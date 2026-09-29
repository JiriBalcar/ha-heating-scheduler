"""Room sensor: the current heating mode, with target, reason and next change."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .core.model import TargetMode
from .core.text import render_reason
from .engine import HeatingEngine
from .entity import RoomEntity, async_add_room_entities

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a mode sensor per room."""

    def factory(engine: HeatingEngine, room_id: str) -> list[RoomModeSensor]:
        return [RoomModeSensor(engine, room_id)]

    async_add_room_entities(hass, entry, entry.runtime_data, async_add_entities, factory)


class RoomModeSensor(RoomEntity, SensorEntity):
    """What the room does now: comfort, eco, night, away, frost, off or manual."""

    _attr_translation_key = "mode"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = [mode.value for mode in TargetMode]

    def __init__(self, engine: HeatingEngine, room_id: str) -> None:
        """Create the sensor."""
        super().__init__(engine, room_id, "mode")

    @property
    def native_value(self) -> str | None:
        """Return the current mode."""
        target = self.target
        return None if target is None else target.mode.value

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return target temperature, reason, next change and manual-change details."""
        target = self.target
        room = self.room
        if target is None or room is None:
            return {}
        engine = self._engine
        override = engine.state.overrides.get(room.id)
        plan = engine.config.plans.get(room.plan_id)
        temp_set = engine.config.temp_sets.get(room.temp_set_id)
        return {
            "target_temperature": target.temperature,
            "reason": render_reason(
                target.reason,
                dt_util.utcnow(),
                dt_util.get_default_time_zone(),
                self.hass.config.language,
            ),
            "source": target.source.value,
            "valid_until": None
            if target.valid_until is None
            else dt_util.as_local(target.valid_until).isoformat(),
            "next_mode": None if target.next is None else target.next.mode.value,
            "next_temperature": None if target.next is None else target.next.temperature,
            "override": None
            if override is None
            else {
                "temperature": override.temperature,
                "until": dt_util.as_local(override.until).isoformat(),
                "origin": override.origin.value,
                "entity_id": override.entity_id,
            },
            "plan": None if plan is None else plan.name,
            "temperature_set": None if temp_set is None else temp_set.name,
            "current_temperature": engine.room_temperature(room),
        }
