"""House temperatures per mode as number entities."""

from __future__ import annotations

from dataclasses import replace

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberMode
from homeassistant.const import EntityCategory, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import HeatingConfigEntry
from .core.config_ops import put_temp_set
from .core.model import HOUSE_ID, MAX_TEMPERATURE, MIN_TEMPERATURE, TEMPERATURE_MODES, Mode
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
    """Add one number per mode temperature."""
    async_add_entities(HouseTemperature(entry.runtime_data, mode) for mode in TEMPERATURE_MODES)


class HouseTemperature(HeatingEntity, NumberEntity):
    """The house temperature of one mode. Rooms in that mode follow at once."""

    _attr_device_class = NumberDeviceClass.TEMPERATURE
    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX
    _attr_native_min_value = MIN_TEMPERATURE
    _attr_native_max_value = MAX_TEMPERATURE
    _attr_native_step = 0.5
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS

    def __init__(self, engine: HeatingEngine, mode: Mode) -> None:
        """Create the number for `mode`."""
        super().__init__(engine)
        self._mode = mode
        self._attr_translation_key = f"temperature_{mode.value}"
        self._attr_unique_id = f"house_temperature_{mode.value}"
        self._attr_device_info = house_device_info()

    @property
    def native_value(self) -> float:
        """Return the house temperature of the mode."""
        return self._engine.config.temp_sets[HOUSE_ID].temperatures[self._mode]

    async def async_set_native_value(self, value: float) -> None:
        """Change the house temperature of the mode."""
        engine = self._engine
        house = engine.config.temp_sets[HOUSE_ID]
        changed = replace(house, temperatures={**house.temperatures, self._mode: value})
        try:
            await engine.async_apply_config(put_temp_set(engine.config, changed), None)
        except ValidationError as err:
            raise service_error(err) from err
