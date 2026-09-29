"""Heating Scheduler: schedules room temperatures for radiator valves (TRVs)."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .core.validation import ValidationError
from .engine import HeatingEngine
from .storage import HeatingStorage

PLATFORMS: list[Platform] = []

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type HeatingConfigEntry = ConfigEntry[HeatingEngine]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register services and websocket commands once."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HeatingConfigEntry) -> bool:
    """Start the engine and the platforms."""
    engine = HeatingEngine(hass, entry, HeatingStorage(hass))
    try:
        await engine.async_setup()
    except ValidationError as err:
        raise ConfigEntryError(f"The stored configuration is invalid: {err}") from err
    entry.runtime_data = engine
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: HeatingConfigEntry) -> bool:
    """Stop the engine and the platforms."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_unload()
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: HeatingConfigEntry) -> None:
    """Delete stored data when the integration is removed."""
    await HeatingStorage(hass).async_remove()
