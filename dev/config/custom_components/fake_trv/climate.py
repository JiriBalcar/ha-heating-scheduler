"""Simulated TRVs (development only)."""

from __future__ import annotations

from datetime import timedelta
import random
from typing import Any

from homeassistant.components.climate import ClimateEntity
from homeassistant.components.climate.const import ClimateEntityFeature, HVACAction, HVACMode
from homeassistant.const import UnitOfTemperature
from homeassistant.core import Context, HomeAssistant, ServiceCall, callback
import voluptuous as vol

from homeassistant.helpers import area_registry as ar, config_validation as cv, entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_call_later, async_track_time_interval
from homeassistant.helpers.typing import ConfigType, DiscoveryInfoType

from . import DOMAIN, ROOMS


async def async_setup_platform(
    hass: HomeAssistant,
    config: ConfigType,
    async_add_entities: AddEntitiesCallback,
    discovery_info: DiscoveryInfoType | None = None,
) -> None:
    """Add the valves and put them into areas."""
    entities: list[FakeTrv] = []
    for slug, _area, count, _start in ROOMS:
        for index in range(count):
            suffix = f"_{index + 1}" if count > 1 else ""
            entities.append(FakeTrv(slug, f"{slug}_hlavice{suffix}"))
    async_add_entities(entities)

    # Simulate a valve that stops answering, e.g. with empty batteries. A domain service,
    # because HA does not call entity services on unavailable entities.
    by_id = {entity.entity_id: entity for entity in entities}

    async def set_offline(call: ServiceCall) -> None:
        for entity_id in call.data["entity_id"]:
            if entity_id in by_id:
                by_id[entity_id].set_offline(call.data["offline"])

    hass.services.async_register(
        DOMAIN,
        "set_offline",
        set_offline,
        schema=vol.Schema({vol.Required("entity_id"): cv.entity_ids, vol.Required("offline"): bool}),
    )

    @callback
    def assign_areas(_now: Any = None) -> None:
        areas = ar.async_get(hass)
        registry = er.async_get(hass)
        for slug, area_name, _count, _start in ROOMS:
            area = areas.async_get_area_by_name(area_name) or areas.async_create(area_name)
            for entry in list(registry.entities.values()):
                if entry.platform == DOMAIN and entry.unique_id.startswith(slug):
                    registry.async_update_entity(entry.entity_id, area_id=area.id)

    async_call_later(hass, 2, assign_areas)


class FakeTrv(ClimateEntity):
    """A battery TRV that answers 1-8 seconds after a command."""

    _attr_should_poll = False
    _attr_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_hvac_modes = [HVACMode.OFF, HVACMode.AUTO, HVACMode.HEAT]
    _attr_min_temp = 4.0
    _attr_max_temp = 35.0
    _attr_target_temperature_step = 0.5
    _attr_supported_features = (
        ClimateEntityFeature.TARGET_TEMPERATURE
        | ClimateEntityFeature.TURN_ON
        | ClimateEntityFeature.TURN_OFF
    )

    def __init__(self, room: str, object_id: str) -> None:
        self._room = room
        self._attr_unique_id = object_id
        self._attr_name = object_id.replace("_", " ").capitalize()
        self.entity_id = f"climate.{object_id}"
        self._attr_hvac_mode = HVACMode.HEAT
        self._attr_target_temperature = 19.0

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            async_track_time_interval(self.hass, self._simulate, timedelta(seconds=30))
        )

    @property
    def current_temperature(self) -> float:
        value: float = self.hass.data[DOMAIN][self._room]
        return round(value, 1)

    @property
    def hvac_action(self) -> HVACAction:
        if self._attr_hvac_mode == HVACMode.OFF:
            return HVACAction.OFF
        target = self._attr_target_temperature or 0
        return HVACAction.HEATING if target > self.current_temperature + 0.2 else HVACAction.IDLE

    @callback
    def _simulate(self, _now: Any) -> None:
        temps: dict[str, float] = self.hass.data[DOMAIN]
        target = self._attr_target_temperature or 16
        heating = self._attr_hvac_mode != HVACMode.OFF and target > temps[self._room]
        step = 0.05 if heating else -0.03
        temps[self._room] = max(12.0, min(26.0, temps[self._room] + step))
        self.async_write_ha_state()

    def _report_later(self, apply: Any) -> None:
        @callback
        def report(_now: Any) -> None:
            apply()
            # A new context, like a Zigbee report that arrives on its own.
            self.async_set_context(Context())
            self.async_write_ha_state()

        async_call_later(self.hass, random.uniform(1, 8), report)  # noqa: S311

    async def async_set_temperature(self, **kwargs: Any) -> None:
        value = float(kwargs["temperature"])

        def apply() -> None:
            self._attr_target_temperature = value

        self._report_later(apply)

    @callback
    def set_offline(self, offline: bool) -> None:
        self._attr_available = not offline
        self.async_write_ha_state()

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        def apply() -> None:
            self._attr_hvac_mode = hvac_mode

        self._report_later(apply)
