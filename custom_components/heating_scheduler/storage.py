"""Persistent storage in `.storage/` with versioned migrations."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, LOG_SAVE_DELAY, STATE_SAVE_DELAY
from .core.model import Config, RuntimeState
from .core.serde import (
    CONFIG_MINOR_VERSION,
    CONFIG_VERSION,
    STATE_MINOR_VERSION,
    STATE_VERSION,
    config_from_dict,
    config_to_dict,
    migrate_config,
    migrate_state,
    state_from_dict,
    state_to_dict,
)

type JsonDict = dict[str, Any]
type Migration = Callable[[int, int, JsonDict], JsonDict]


class _MigratingStore(Store[JsonDict]):
    """A Store that migrates old data with a pure function."""

    def __init__(
        self, hass: HomeAssistant, version: int, minor: int, key: str, migrate: Migration
    ) -> None:
        super().__init__(hass, version, key, minor_version=minor)
        self._migrate = migrate

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: JsonDict
    ) -> JsonDict:
        return self._migrate(old_major_version, old_minor_version, old_data)


class HeatingStorage:
    """The three stores of the integration."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Create the stores."""
        self._config = _MigratingStore(
            hass, CONFIG_VERSION, CONFIG_MINOR_VERSION, f"{DOMAIN}.config", migrate_config
        )
        self._state = _MigratingStore(
            hass, STATE_VERSION, STATE_MINOR_VERSION, f"{DOMAIN}.state", migrate_state
        )
        self._log: Store[JsonDict] = Store(hass, 1, f"{DOMAIN}.log")

    async def async_load_config(self) -> Config | None:
        """Load the configuration. None means nothing is stored yet."""
        data = await self._config.async_load()
        return None if data is None else config_from_dict(data)

    async def async_load_state(self) -> RuntimeState:
        """Load runtime state. Broken data gives an empty state."""
        data = await self._state.async_load()
        if data is None:
            return RuntimeState()
        try:
            return state_from_dict(data)
        except ValueError:
            return RuntimeState()

    async def async_load_log(self) -> JsonDict | None:
        """Load the stored log."""
        return await self._log.async_load()

    async def async_save_config(self, config: Config) -> None:
        """Save the configuration now."""
        await self._config.async_save(config_to_dict(config))

    def schedule_state_save(self, get_state: Callable[[], RuntimeState]) -> None:
        """Save runtime state soon. Home Assistant flushes delayed saves on stop."""
        self._state.async_delay_save(lambda: state_to_dict(get_state()), STATE_SAVE_DELAY)

    async def async_save_state(self, state: RuntimeState) -> None:
        """Save runtime state now."""
        await self._state.async_save(state_to_dict(state))

    def schedule_log_save(self, get_log: Callable[[], JsonDict]) -> None:
        """Save the log later."""
        self._log.async_delay_save(get_log, LOG_SAVE_DELAY)

    async def async_save_log(self, data: JsonDict) -> None:
        """Save the log now."""
        await self._log.async_save(data)

    async def async_remove(self) -> None:
        """Delete all stored data (the integration was removed)."""
        await self._config.async_remove()
        await self._state.async_remove()
        await self._log.async_remove()
