"""Services of the integration."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.climate.const import DOMAIN as CLIMATE_DOMAIN
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv, service
from homeassistant.helpers.typing import VolDictType
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import DOMAIN
from .core.model import MAX_TEMPERATURE, MIN_TEMPERATURE, HouseMode, Mode
from .core.validation import ValidationError
from .engine import HeatingEngine
from .errors import service_error

SERVICE_SET_OVERRIDE = "set_override"
SERVICE_CLEAR_OVERRIDE = "clear_override"
SERVICE_SET_HOUSE_MODE = "set_house_mode"
SERVICE_SET_VACATION = "set_vacation"
SERVICE_CANCEL_VACATION = "cancel_vacation"
SERVICE_RECONCILE_NOW = "reconcile_now"

SET_OVERRIDE_SCHEMA: VolDictType = {
    vol.Required("temperature"): vol.All(
        vol.Coerce(float), vol.Range(min=MIN_TEMPERATURE, max=MAX_TEMPERATURE)
    ),
    vol.Exclusive("duration", "end"): cv.positive_time_period,
    vol.Exclusive("until", "end"): cv.datetime,
}
SET_HOUSE_MODE_SCHEMA = vol.Schema({vol.Required("mode"): vol.In([m.value for m in HouseMode])})
SET_VACATION_SCHEMA = vol.Schema(
    {
        vol.Optional("start"): cv.datetime,
        vol.Optional("end"): cv.datetime,
        vol.Optional("mode"): vol.In([Mode.FROST.value, Mode.AWAY.value]),
    }
)


def _engine(hass: HomeAssistant) -> HeatingEngine:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        raise ServiceValidationError(
            "Heating Scheduler is not loaded",
            translation_domain=DOMAIN,
            translation_key="not_loaded",
        )
    engine: HeatingEngine = entries[0].runtime_data
    return engine


def _aware(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=dt_util.get_default_time_zone())


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register all services."""
    service.async_register_platform_entity_service(
        hass,
        DOMAIN,
        SERVICE_SET_OVERRIDE,
        entity_domain=CLIMATE_DOMAIN,
        schema=SET_OVERRIDE_SCHEMA,
        func="async_set_override_service",
    )
    service.async_register_platform_entity_service(
        hass,
        DOMAIN,
        SERVICE_CLEAR_OVERRIDE,
        entity_domain=CLIMATE_DOMAIN,
        schema=None,
        func="async_clear_override_service",
    )

    async def set_house_mode(call: ServiceCall) -> None:
        try:
            await _engine(hass).async_set_house_mode(HouseMode(call.data["mode"]))
        except ValidationError as err:
            raise service_error(err) from err

    async def set_vacation(call: ServiceCall) -> None:
        mode = call.data.get("mode")
        try:
            await _engine(hass).async_set_vacation(
                _aware(call.data.get("start")),
                _aware(call.data.get("end")),
                None if mode is None else Mode(mode),
            )
        except ValidationError as err:
            raise service_error(err) from err

    async def cancel_vacation(_call: ServiceCall) -> None:
        await _engine(hass).async_cancel_vacation()

    async def reconcile_now(_call: ServiceCall) -> None:
        _engine(hass).reconcile_now()

    hass.services.async_register(
        DOMAIN, SERVICE_SET_HOUSE_MODE, set_house_mode, schema=SET_HOUSE_MODE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SET_VACATION, set_vacation, schema=SET_VACATION_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_CANCEL_VACATION, cancel_vacation)
    hass.services.async_register(DOMAIN, SERVICE_RECONCILE_NOW, reconcile_now)
