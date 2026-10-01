"""Heating Scheduler: schedules room temperatures for radiator valves (TRVs)."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, SIGNAL_ROOMS_CHANGED
from .core.validation import ValidationError
from .engine import HeatingEngine
from .entity import async_sync_devices
from .frontend import (
    async_register_frontend,
    async_remove_card_resource,
    async_unregister_frontend,
)
from .services import async_setup_services
from .storage import HeatingStorage
from .websocket import async_setup_websocket

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.CLIMATE,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type HeatingConfigEntry = ConfigEntry[HeatingEngine]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register services and websocket commands once."""
    async_setup_services(hass)
    async_setup_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HeatingConfigEntry) -> bool:
    """Register the frontend, then start the engine and the platforms.

    Home Assistant serves its page while integrations still start (after a restart, the app
    reconnects at once), and a page loads the card only if its module was registered when the
    page was made. So the frontend comes first.
    """
    await async_register_frontend(hass)
    engine = HeatingEngine(hass, entry, HeatingStorage(hass))
    try:
        await engine.async_setup()
    except ValidationError as err:
        async_unregister_frontend(hass)
        raise ConfigEntryError(f"The stored configuration is invalid: {err}") from err
    entry.runtime_data = engine

    @callback
    def sync_devices() -> None:
        async_sync_devices(hass, entry, engine)

    sync_devices()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ROOMS_CHANGED, sync_devices))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: HeatingConfigEntry) -> bool:
    """Stop the platforms, the engine and the frontend."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_unload()
        async_unregister_frontend(hass)
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: HeatingConfigEntry) -> None:
    """Delete stored data and the card's dashboard resource when the integration is removed."""
    await HeatingStorage(hass).async_remove()
    await async_remove_card_resource(hass)
