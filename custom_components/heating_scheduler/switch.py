"""Boost switches: the whole house, and each zone when there are two or more zones.

A boost heats rooms at their valves' maximum for a while. A room boosts on its own through the
preset "boost" of its thermostat.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import HeatingEntity, ZoneEntity, async_add_zone_entities, house_device_info
from .errors import service_error

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HeatingConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the boost switch of the house, and one per zone while there are two or more."""
    engine = entry.runtime_data
    async_add_entities([BoostSwitch(engine)])
    async_add_zone_entities(
        hass, entry, engine, async_add_entities, "switch", "boost", ZoneBoostSwitch
    )


def boost_attributes(engine: HeatingEngine, until: datetime | None) -> dict[str, Any]:
    """Return when a boost ends, and how long a new one lasts."""
    return {
        "until": None if until is None else dt_util.as_local(until).isoformat(),
        "duration_minutes": int(engine.config.settings.boost.total_seconds() // 60),
    }


class BoostSwitch(HeatingEntity, SwitchEntity):
    """On while the boost of the whole house runs. On starts one for the length in the
    settings; off ends it. Boosts of zones and rooms are separate and go on.

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
        """Return True while the house's boost runs."""
        return self._engine.boost_until is not None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return when the boost ends, and how long a new one lasts."""
        return boost_attributes(self._engine, self._engine.boost_until)

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Start a boost of the whole house."""
        try:
            await self._engine.async_start_boost()
        except ValidationError as err:
            raise service_error(err) from err

    async def async_turn_off(self, **kwargs: Any) -> None:
        """End the boost of the whole house."""
        await self._engine.async_stop_boost()


class ZoneBoostSwitch(ZoneEntity, SwitchEntity):
    """On while a zone's own boost runs. On starts one (the zone leaves Away, Holiday and Off
    first); off ends it."""

    _attr_translation_key = "zone_boost"

    def __init__(self, engine: HeatingEngine, zone_id: str) -> None:
        """Create the switch of a zone."""
        super().__init__(engine, zone_id, "boost")

    @property
    def is_on(self) -> bool:
        """Return True while the zone's boost runs."""
        return self._engine.zone_boost_until(self.zone_id) is not None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return when the boost ends, and how long a new one lasts."""
        return boost_attributes(self._engine, self._engine.zone_boost_until(self.zone_id))

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Start a boost of this zone."""
        try:
            await self._engine.async_start_boost(zone_ids=[self.zone_id])
        except ValidationError as err:
            raise service_error(err) from err

    async def async_turn_off(self, **kwargs: Any) -> None:
        """End the boost of this zone."""
        await self._engine.async_stop_boost([self.zone_id])
