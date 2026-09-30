"""House mode selects: the whole house, and each zone when there are two or more zones."""

from __future__ import annotations

from typing import Any, Final

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HeatingConfigEntry
from .const import DOMAIN
from .core.model import HouseMode, HouseState
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import HeatingEntity, ZoneEntity, async_add_zone_entities, house_device_info
from .errors import service_error

PARALLEL_UPDATES = 0

# The state of the house select while the zones are in different modes. It cannot be selected.
MIXED: Final = "mixed"


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
    async_add_zone_entities(
        hass, entry, engine, async_add_entities, "select", "mode", ZoneModeSelect
    )


class HouseModeSelect(HeatingEntity, SelectEntity):
    """The mode of the whole house: selecting sets every zone.

    "mixed" while the zones are in different modes; only then is it one of the options.
    """

    _attr_translation_key = "house_mode"
    _attr_unique_id = "house_mode"

    def __init__(self, engine: HeatingEngine) -> None:
        """Create the select."""
        super().__init__(engine)
        self._attr_device_info = house_device_info()

    @property
    def options(self) -> list[str]:
        """Return the modes, and "mixed" while the zones are in different modes."""
        modes = [mode.value for mode in HouseMode]
        return modes if self._engine.house_mode() is not None else [*modes, MIXED]

    @property
    def current_option(self) -> str:
        """Return the effective mode shared by all zones, or "mixed"."""
        mode = self._engine.house_mode()
        return MIXED if mode is None else mode.value

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
        if option == MIXED:
            raise ServiceValidationError(
                "mixed is not a mode", translation_domain=DOMAIN, translation_key="mixed"
            )
        try:
            await self._engine.async_set_house_mode(HouseMode(option))
        except ValidationError as err:
            raise service_error(err) from err


class ZoneModeSelect(ZoneEntity, SelectEntity):
    """The house mode of one zone."""

    _attr_translation_key = "zone_mode"
    _attr_options = [mode.value for mode in HouseMode]

    def __init__(self, engine: HeatingEngine, zone_id: str) -> None:
        """Create the select of a zone."""
        super().__init__(engine, zone_id, "mode")

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
