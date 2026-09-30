"""House switch: boost, every room at its valves' maximum for a while."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import HeatingEntity, house_device_info
from .errors import service_error

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the boost switch."""
    async_add_entities([BoostSwitch(entry.runtime_data)])


class BoostSwitch(HeatingEntity, SwitchEntity):
    """On while a boost runs. On starts one for the length in the settings; off ends it.

    A boost ends Away, Holiday and Off first, because someone is home.
    """

    _attr_translation_key = "boost"
    _attr_unique_id = "boost"

    def __init__(self, engine: HeatingEngine) -> None:
        """Create the switch."""
        super().__init__(engine)
        self._attr_device_info = house_device_info()

    @property
    def is_on(self) -> bool:
        """Return True while a boost runs."""
        return self._engine.boost_until is not None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return when the boost ends, and how long a new one lasts."""
        until = self._engine.boost_until
        return {
            "until": None if until is None else dt_util.as_local(until).isoformat(),
            "duration_minutes": int(self._engine.config.settings.boost.total_seconds() // 60),
        }

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Start a boost."""
        try:
            await self._engine.async_start_boost()
        except ValidationError as err:
            raise service_error(err) from err

    async def async_turn_off(self, **kwargs: Any) -> None:
        """End the boost."""
        await self._engine.async_stop_boost()
