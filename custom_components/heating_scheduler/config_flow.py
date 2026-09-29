"""Config flow: one confirmation step. Rooms are managed in the panel."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class HeatingSchedulerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create the single Heating Scheduler entry."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Confirm the setup."""
        if user_input is not None:
            return self.async_create_entry(title="Heating Scheduler", data={})
        return self.async_show_form(step_id="user")
