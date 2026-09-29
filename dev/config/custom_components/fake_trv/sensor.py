"""Simulated room temperature sensors (development only)."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.typing import ConfigType, DiscoveryInfoType

from . import DOMAIN, ROOMS


async def async_setup_platform(
    hass: HomeAssistant,
    config: ConfigType,
    async_add_entities: AddEntitiesCallback,
    discovery_info: DiscoveryInfoType | None = None,
) -> None:
    """Add one temperature sensor per room."""
    async_add_entities(RoomTemperature(slug) for slug, _area, _count, _start in ROOMS)


class RoomTemperature(SensorEntity):
    """The room temperature that the valves also use."""

    _attr_should_poll = False
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS

    def __init__(self, room: str) -> None:
        self._room = room
        self._attr_unique_id = f"{room}_teplota"
        self._attr_name = f"{room.replace('_', ' ').capitalize()} teplota"
        self.entity_id = f"sensor.{room}_teplota"

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            async_track_time_interval(self.hass, self._refresh, timedelta(seconds=30))
        )

    @property
    def native_value(self) -> float:
        value: float = self.hass.data[DOMAIN][self._room]
        return round(value, 1)

    @callback
    def _refresh(self, _now: Any) -> None:
        self.async_write_ha_state()
