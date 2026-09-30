"""House mode selects: the whole house, and each zone when there are two or more zones."""

from __future__ import annotations

from typing import Any

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .const import DOMAIN, SIGNAL_ZONES_CHANGED
from .core.model import HouseMode, HouseState, Zone
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import HeatingEntity, house_device_info
from .errors import service_error

PARALLEL_UPDATES = 0


def zone_unique_id(zone_id: str) -> str:
    """Return the unique id of a zone's select."""
    return f"zone_{zone_id}_mode"


def house_attributes(house: HouseState) -> dict[str, Any]:
    """Return the selected mode and the holiday window of a zone."""
    vacation = house.vacation
    start = None if vacation is None else dt_util.as_local(vacation.start).isoformat()
    end = None if vacation is None or vacation.end is None else vacation.end
    return {
        "selected_mode": house.mode.value,
        "vacation_start": start,
        "vacation_end": None if end is None else dt_util.as_local(end).isoformat(),
        "vacation_mode": None if vacation is None else vacation.mode.value,
    }


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the house select, and a select per zone while there are two or more zones."""
    engine = entry.runtime_data
    async_add_entities([HouseModeSelect(engine)])
    registry = er.async_get(hass)
    known: set[str] = set()

    @callback
    def sync_zones() -> None:
        zones = engine.config.zones
        wanted = set(zones) if len(zones) > 1 else set()
        for zone_id in known - wanted:
            entity_id = registry.async_get_entity_id("select", DOMAIN, zone_unique_id(zone_id))
            if entity_id is not None:
                registry.async_remove(entity_id)
        known.intersection_update(wanted)
        new = [ZoneModeSelect(engine, zone_id) for zone_id in zones if zone_id in wanted - known]
        known.update(entity.zone_id for entity in new)
        if new:
            async_add_entities(new)

    sync_zones()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ZONES_CHANGED, sync_zones))


class HouseModeSelect(HeatingEntity, SelectEntity):
    """The mode of the whole house: selecting sets every zone.

    Unknown while the zones are in different modes.
    """

    _attr_translation_key = "house_mode"
    _attr_unique_id = "house_mode"
    _attr_options = [mode.value for mode in HouseMode]

    def __init__(self, engine: HeatingEngine) -> None:
        """Create the select."""
        super().__init__(engine)
        self._attr_device_info = house_device_info()

    @property
    def current_option(self) -> str | None:
        """Return the effective mode shared by all zones."""
        mode = self._engine.house_mode()
        return None if mode is None else mode.value

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the selected mode and holiday, or the mode of each zone."""
        zones = list(self._engine.config.zones.values())
        if len(zones) == 1:
            return house_attributes(zones[0].house)
        now = dt_util.utcnow()
        return {"zones": {zone.name: zone.house.effective_mode(now).value for zone in zones}}

    async def async_select_option(self, option: str) -> None:
        """Select a mode for every zone."""
        try:
            await self._engine.async_set_house_mode(HouseMode(option))
        except ValidationError as err:
            raise service_error(err) from err


class ZoneModeSelect(HeatingEntity, SelectEntity):
    """The house mode of one zone."""

    _attr_translation_key = "zone_mode"
    _attr_options = [mode.value for mode in HouseMode]

    def __init__(self, engine: HeatingEngine, zone_id: str) -> None:
        """Create the select of a zone."""
        super().__init__(engine)
        self.zone_id = zone_id
        self._attr_unique_id = zone_unique_id(zone_id)
        self._attr_device_info = house_device_info()
        self._attr_translation_placeholders = {"zone": engine.config.zones[zone_id].name}

    @property
    def zone(self) -> Zone | None:
        """Return the zone, or None once it is deleted."""
        return self._engine.config.zones.get(self.zone_id)

    @property
    def available(self) -> bool:
        """Return True while the zone exists."""
        return self.zone is not None

    @callback
    def _handle_engine_update(self) -> None:
        if (zone := self.zone) is not None:
            self._attr_translation_placeholders = {"zone": zone.name}
        super()._handle_engine_update()

    @property
    def current_option(self) -> str | None:
        """Return the zone's effective mode."""
        zone = self.zone
        return None if zone is None else zone.house.effective_mode(dt_util.utcnow()).value

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the zone's selected mode and holiday."""
        zone = self.zone
        return {} if zone is None else house_attributes(zone.house)

    async def async_select_option(self, option: str) -> None:
        """Select a mode for this zone."""
        try:
            await self._engine.async_set_house_mode(HouseMode(option), [self.zone_id])
        except ValidationError as err:
            raise service_error(err) from err
