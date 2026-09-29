"""Room problem sensor: a TRV is unavailable, a write failed, or a mismatch persists."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import HeatingConfigEntry
from .engine import HeatingEngine
from .entity import RoomEntity, async_add_room_entities

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a problem sensor per room."""

    def factory(engine: HeatingEngine, room_id: str) -> list[RoomProblemSensor]:
        return [RoomProblemSensor(engine, room_id)]

    async_add_room_entities(hass, entry, entry.runtime_data, async_add_entities, factory)


class RoomProblemSensor(RoomEntity, BinarySensorEntity):
    """On when something is wrong with the TRVs of the room."""

    _attr_translation_key = "problem"
    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, engine: HeatingEngine, room_id: str) -> None:
        """Create the sensor."""
        super().__init__(engine, room_id, "problem")

    @property
    def available(self) -> bool:
        """Return True while the room exists."""
        return self.room is not None

    @property
    def is_on(self) -> bool:
        """Return True if the room has health issues."""
        return bool(self._engine.health.get(self._room_id))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the issues."""
        return {"issues": [issue.as_dict() for issue in self._engine.health.get(self._room_id, [])]}
