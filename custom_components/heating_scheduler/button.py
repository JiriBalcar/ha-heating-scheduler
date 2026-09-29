"""Room button: back to plan (clears a manual change)."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import HeatingConfigEntry
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import RoomEntity, async_add_room_entities
from .errors import service_error

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add a resume button per room."""

    def factory(engine: HeatingEngine, room_id: str) -> list[ResumeButton]:
        return [ResumeButton(engine, room_id)]

    async_add_room_entities(hass, entry, entry.runtime_data, async_add_entities, factory)


class ResumeButton(RoomEntity, ButtonEntity):
    """Go back to the plan in this room."""

    _attr_translation_key = "resume"

    def __init__(self, engine: HeatingEngine, room_id: str) -> None:
        """Create the button."""
        super().__init__(engine, room_id, "resume")

    async def async_press(self) -> None:
        """Clear the manual change of the room."""
        try:
            await self._engine.async_clear_override(self._room_id)
        except ValidationError as err:
            raise service_error(err) from err
