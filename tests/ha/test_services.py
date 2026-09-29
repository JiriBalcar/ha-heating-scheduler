"""Service tests, config flow and frontend registration."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ServiceValidationError
from homeassistant.util import dt as dt_util
import pytest

from custom_components.heating_scheduler.const import DOMAIN, PANEL_URL_PATH
from tests.builders import prague

from .conftest import FakeClimate, FakeTrv, engine_of, settle, setup_entry, store, two_rooms

THERMOSTAT = "climate.living_room"


async def call(hass: HomeAssistant, service: str, data: dict[str, Any]) -> None:
    await hass.services.async_call(DOMAIN, service, data, blocking=True)
    await settle(hass)


async def test_set_override_duration_until_and_clear(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    now = dt_util.utcnow()
    await call(
        hass,
        "set_override",
        {"entity_id": THERMOSTAT, "temperature": 22.5, "duration": {"hours": 2}},
    )
    assert engine.state.overrides["living"].until == now + timedelta(hours=2)
    assert standard_trvs["climate.living_trv_1"].setpoint == 22.5
    await call(
        hass,
        "set_override",
        {"entity_id": THERMOSTAT, "temperature": 23.0, "until": "2026-10-05 23:30:00"},
    )
    assert engine.state.overrides["living"].until == prague(2026, 10, 5, 23, 30)
    await call(hass, "set_override", {"entity_id": THERMOSTAT, "temperature": 20.0})
    assert engine.state.overrides["living"].until == prague(2026, 10, 5, 16)
    await call(hass, "clear_override", {"entity_id": THERMOSTAT})
    assert "living" not in engine.state.overrides
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0


async def test_set_override_rejects_bad_input(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    import voluptuous as vol

    store(hass_storage, two_rooms())
    await setup_entry(hass)
    with pytest.raises(vol.Invalid):
        await call(hass, "set_override", {"entity_id": THERMOSTAT, "temperature": 45})
    with pytest.raises(vol.Invalid):
        await call(
            hass,
            "set_override",
            {
                "entity_id": THERMOSTAT,
                "temperature": 21,
                "duration": {"hours": 1},
                "until": "2026-10-05 23:30:00",
            },
        )
    with pytest.raises(ServiceValidationError) as info:
        await call(
            hass,
            "set_override",
            {"entity_id": THERMOSTAT, "temperature": 21, "until": "2026-10-05 08:00:00"},
        )
    assert info.value.translation_key == "invalid_duration"


async def test_house_mode_and_vacation_services(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    trv = standard_trvs["climate.bedroom_trv"]
    await call(hass, "set_house_mode", {"mode": "off"})
    assert trv.mode == "off"
    await call(hass, "set_house_mode", {"mode": "auto"})
    assert trv.mode == "heat"
    await call(
        hass,
        "set_vacation",
        {"start": "2026-10-10 08:00:00", "end": "2026-10-20 12:00:00", "mode": "away"},
    )
    vacation = engine.config.house.vacation
    assert vacation is not None
    assert vacation.start == prague(2026, 10, 10, 8)
    assert vacation.end == prague(2026, 10, 20, 12)
    assert trv.setpoint == 21.0  # planned, not active yet
    await call(hass, "cancel_vacation", {})
    assert engine.config.house.vacation is None
    with pytest.raises(ServiceValidationError) as info:
        await call(hass, "set_vacation", {"end": "2026-10-01 12:00:00"})
    assert info.value.translation_key == "vacation_order"


async def test_reconcile_now_retries_failed_writes(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    await climate.add("climate.living_trv_1", setpoint=21.0)
    await climate.add("climate.living_trv_2", setpoint=21.0)
    trv = await climate.add("climate.bedroom_trv", setpoint=18.0)
    entry = await setup_entry(hass)
    trv.setpoint = 17.0
    trv.calls.clear()
    # Change the value behind our back with our own context: no override, but out of sync.
    engine = engine_of(entry)
    trv.write(engine.new_context())
    await settle(hass)
    assert trv.calls == []
    await call(hass, "reconcile_now", {})
    assert trv.temperature_calls == [21.0]


async def test_services_fail_when_not_loaded(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    assert await hass.config_entries.async_unload(entry.entry_id)
    with pytest.raises(ServiceValidationError) as info:
        await call(hass, "set_house_mode", {"mode": "away"})
    assert info.value.translation_key == "not_loaded"


async def test_config_flow_creates_single_entry(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Heating Scheduler"
    await settle(hass)
    again = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert again["type"] is FlowResultType.ABORT
    assert again["reason"] == "single_instance_allowed"


async def test_first_setup_creates_localized_defaults(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    hass.config.language = "cs"
    entry = await setup_entry(hass)
    config = engine_of(entry).config
    assert config.plans["house"].name == "Plán domu"
    assert config.temp_sets["house"].name == "Teploty domu"
    assert hass_storage[f"{DOMAIN}.config"]["data"]["plans"][0]["name"] == "Plán domu"


async def test_panel_registered_and_removed(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    entry = await setup_entry(hass)
    panels = hass.data["frontend_panels"]
    assert PANEL_URL_PATH in panels
    panel = panels[PANEL_URL_PATH]
    assert panel.config["_panel_custom"]["name"] == "heating-scheduler-panel"
    assert panel.config["_panel_custom"]["module_url"].startswith("/heating_scheduler_static/")
    assert panel.require_admin is False
    extra = hass.data["frontend_extra_module_url"]
    assert any(
        url.startswith("/heating_scheduler_static/heating-scheduler-card.js") for url in extra.urls
    )
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_URL_PATH not in hass.data["frontend_panels"]
    assert not any("heating-scheduler-card" in url for url in extra.urls)


async def test_broken_stored_config_fails_setup(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    config = two_rooms()
    store(hass_storage, config)
    hass_storage[f"{DOMAIN}.config"]["data"]["rooms"][0]["plan_id"] = "missing"
    entry = MockConfigEntry(domain=DOMAIN, title="Heating Scheduler", data={})
    entry.add_to_hass(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is config_entries.ConfigEntryState.SETUP_ERROR
