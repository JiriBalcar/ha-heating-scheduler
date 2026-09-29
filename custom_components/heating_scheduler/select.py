"""House mode select: normal (auto), away, holiday (vacation), off."""

from __future__ import annotations

from typing import Any

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .core.model import HouseMode
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
    """Add the house mode select."""
    async_add_entities([HouseModeSelect(entry.runtime_data)])


class HouseModeSelect(HeatingEntity, SelectEntity):
    """The house mode. Selecting vacation starts an open-ended vacation now."""

    _attr_translation_key = "house_mode"
    _attr_unique_id = "house_mode"
    _attr_options = [mode.value for mode in HouseMode]

    def __init__(self, engine: HeatingEngine) -> None:
        """Create the select."""
        super().__init__(engine)
        self._attr_device_info = house_device_info()

    @property
    def current_option(self) -> str:
        """Return the effective house mode."""
        return self._engine.config.house.effective_mode(dt_util.utcnow()).value

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the selected mode and the vacation window."""
        house = self._engine.config.house
        vacation = house.vacation
        return {
            "selected_mode": house.mode.value,
            "vacation_start": None
            if vacation is None
            else dt_util.as_local(vacation.start).isoformat(),
            "vacation_end": None
            if vacation is None or vacation.end is None
            else dt_util.as_local(vacation.end).isoformat(),
            "vacation_mode": None if vacation is None else vacation.mode.value,
        }

    async def async_select_option(self, option: str) -> None:
        """Select a house mode."""
        try:
            await self._engine.async_set_house_mode(HouseMode(option))
        except ValidationError as err:
            raise service_error(err) from err
