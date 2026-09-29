"""Virtual room thermostat for voice assistants and standard thermostat cards.

HVAC modes: `auto` follows the plan, `heat` means a manual change is active,
`off` means the room is off. Setting a temperature or a preset makes a manual
change until the next plan change.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.climate import ClimateEntity
from homeassistant.components.climate.const import ClimateEntityFeature, HVACAction, HVACMode
from homeassistant.const import ATTR_TEMPERATURE, UnitOfTemperature
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .core.model import (
    HOUSE_ID,
    MAX_TEMPERATURE,
    MIN_TEMPERATURE,
    TEMPERATURE_MODES,
    Mode,
    Source,
)
from .core.overrides import ExpiryKind
from .core.resolve import effective_temperatures
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import RoomEntity, async_add_room_entities
from .errors import service_error

PARALLEL_UPDATES = 0

PRESETS = [mode.value for mode in TEMPERATURE_MODES]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a thermostat per room."""

    def factory(engine: HeatingEngine, room_id: str) -> list[RoomThermostat]:
        return [RoomThermostat(engine, room_id)]

    async_add_room_entities(hass, entry, entry.runtime_data, async_add_entities, factory)


class RoomThermostat(RoomEntity, ClimateEntity):
    """The room as one thermostat."""

    _attr_name = None
    _attr_translation_key = "thermostat"
    _attr_hvac_modes = [HVACMode.AUTO, HVACMode.HEAT, HVACMode.OFF]
    _attr_preset_modes = PRESETS
    _attr_supported_features = (
        ClimateEntityFeature.TARGET_TEMPERATURE
        | ClimateEntityFeature.PRESET_MODE
        | ClimateEntityFeature.TURN_ON
        | ClimateEntityFeature.TURN_OFF
    )
    _attr_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_target_temperature_step = 0.5
    _attr_min_temp = MIN_TEMPERATURE
    _attr_max_temp = MAX_TEMPERATURE

    def __init__(self, engine: HeatingEngine, room_id: str) -> None:
        """Create the thermostat."""
        super().__init__(engine, room_id, "thermostat")
        self._tracked: tuple[str, ...] = ()
        self._track_unsub: CALLBACK_TYPE | None = None

    async def async_added_to_hass(self) -> None:
        """Follow the room's TRVs and temperature entity."""
        await super().async_added_to_hass()
        self._update_tracking()
        self.async_on_remove(self._stop_tracking)

    @callback
    def _stop_tracking(self) -> None:
        if self._track_unsub is not None:
            self._track_unsub()
            self._track_unsub = None

    @callback
    def _update_tracking(self) -> None:
        room = self.room
        wanted: tuple[str, ...] = ()
        if room is not None:
            wanted = room.trvs + (
                (room.temperature_entity,) if room.temperature_entity is not None else ()
            )
        if wanted == self._tracked and self._track_unsub is not None:
            return
        self._stop_tracking()
        self._tracked = wanted
        if wanted:
            self._track_unsub = async_track_state_change_event(
                self.hass, list(wanted), self._handle_source_change
            )

    @callback
    def _handle_source_change(self, _event: Event[EventStateChangedData]) -> None:
        self.async_write_ha_state()

    @callback
    def _handle_engine_update(self) -> None:
        if self.room is not None:
            self._update_tracking()
            self.async_write_ha_state()

    # ----- state -----

    @property
    def current_temperature(self) -> float | None:
        """Return the room temperature."""
        room = self.room
        return None if room is None else self._engine.room_temperature(room)

    @property
    def target_temperature(self) -> float | None:
        """Return the target temperature, None when off."""
        target = self.target
        return None if target is None else target.temperature

    @property
    def hvac_mode(self) -> HVACMode | None:
        """Return auto (plan), heat (manual change) or off."""
        target = self.target
        if target is None:
            return None
        if target.temperature is None:
            return HVACMode.OFF
        if target.source is Source.MANUAL:
            return HVACMode.HEAT
        return HVACMode.AUTO

    @property
    def hvac_action(self) -> HVACAction | None:
        """Return heating if any TRV of the room heats."""
        room = self.room
        target = self.target
        if room is None or target is None:
            return None
        if target.temperature is None:
            return HVACAction.OFF
        for entity_id in room.trvs:
            state = self.hass.states.get(entity_id)
            if state is not None and state.attributes.get("hvac_action") == HVACAction.HEATING:
                return HVACAction.HEATING
        return HVACAction.IDLE

    @property
    def preset_mode(self) -> str | None:
        """Return the current mode if it has a temperature."""
        target = self.target
        if target is None or target.mode.value not in PRESETS:
            return None
        return target.mode.value

    # ----- actions -----

    def _temperatures(self) -> dict[Mode, float]:
        config = self._engine.config
        room = self.room
        room_set = None if room is None else config.temp_sets.get(room.temp_set_id)
        return effective_temperatures(config.temp_sets[HOUSE_ID], room_set)

    async def _override(
        self,
        temperature: float | None,
        kind: ExpiryKind = ExpiryKind.NEXT_CHANGE,
        *,
        duration: timedelta | None = None,
        until: datetime | None = None,
    ) -> None:
        try:
            await self._engine.async_set_override(
                self._room_id, temperature, kind, duration=duration, until=until
            )
        except ValidationError as err:
            raise service_error(err) from err

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Set a manual temperature until the next plan change."""
        hvac_mode = kwargs.get("hvac_mode")
        if hvac_mode is not None and hvac_mode != HVACMode.HEAT:
            await self.async_set_hvac_mode(HVACMode(hvac_mode))
            if hvac_mode == HVACMode.OFF:
                return
        temperature = kwargs.get(ATTR_TEMPERATURE)
        if temperature is not None:
            await self._override(float(temperature))

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Auto: back to plan. Heat: keep the current target by hand. Off: off by hand."""
        if hvac_mode == HVACMode.AUTO:
            try:
                await self._engine.async_clear_override(self._room_id)
            except ValidationError as err:
                raise service_error(err) from err
        elif hvac_mode == HVACMode.OFF:
            await self._override(None)
        else:
            current = self.target_temperature
            await self._override(current if current is not None else self._comfort())

    def _comfort(self) -> float:
        return self._temperatures()[Mode.COMFORT]

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        """Use the temperature of a mode by hand until the next plan change."""
        await self._override(self._temperatures()[Mode(preset_mode)])

    async def async_turn_on(self) -> None:
        """Turn heating on: undo a manual off, or heat to comfort."""
        target = self.target
        if target is None or target.temperature is not None:
            return
        if target.source is Source.MANUAL:
            await self.async_set_hvac_mode(HVACMode.AUTO)
        else:
            await self._override(self._comfort())

    async def async_turn_off(self) -> None:
        """Turn the room off until the next plan change."""
        await self.async_set_hvac_mode(HVACMode.OFF)

    async def async_set_override_service(
        self,
        temperature: float,
        duration: timedelta | None = None,
        until: datetime | None = None,
    ) -> None:
        """Service `heating_scheduler.set_override`."""
        if duration is not None:
            await self._override(temperature, ExpiryKind.DURATION, duration=duration)
        elif until is not None:
            if until.tzinfo is None:
                until = until.replace(tzinfo=dt_util.get_default_time_zone())
            await self._override(temperature, ExpiryKind.UNTIL, until=until)
        else:
            await self._override(temperature)

    async def async_clear_override_service(self) -> None:
        """Service `heating_scheduler.clear_override`."""
        await self.async_set_hvac_mode(HVACMode.AUTO)
