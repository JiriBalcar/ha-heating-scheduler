"""Entity tests: sensor, button, problem sensor, select, numbers, room thermostat."""

from __future__ import annotations

from dataclasses import replace
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import device_registry as dr, entity_registry as er
import pytest

from custom_components.heating_scheduler.core.model import HouseMode, Room
from tests.builders import prague

from .conftest import (
    FakeClimate,
    FakeTrv,
    advance,
    engine_of,
    settle,
    setup_entry,
    store,
    two_rooms,
)

SENSOR = "sensor.living_room_heating_mode"
THERMOSTAT = "climate.living_room"


async def call(hass: HomeAssistant, domain: str, service: str, data: dict[str, Any]) -> None:
    await hass.services.async_call(domain, service, data, blocking=True)
    await settle(hass)


async def test_mode_sensor_state_and_attributes(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    state = hass.states.get(SENSOR)
    assert state is not None
    assert state.state == "comfort"
    assert state.attributes["target_temperature"] == 21.0
    assert state.attributes["reason"] == "Schedule: Warm until 22:00"
    assert state.attributes["source"] == "plan"
    assert state.attributes["valid_until"] == prague(2026, 10, 5, 22).isoformat()
    assert state.attributes["next_mode"] == "night"
    assert state.attributes["next_temperature"] == 18.0
    assert state.attributes["override"] is None
    assert state.attributes["plan"] == "House plan"
    assert state.attributes["current_temperature"] == 20.0


async def test_manual_change_shows_in_sensor_and_button_clears_it(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    await call(hass, "climate", "set_temperature", {"entity_id": THERMOSTAT, "temperature": 23.0})
    state = hass.states.get(SENSOR)
    assert state is not None
    assert state.state == "manual"
    assert state.attributes["override"]["temperature"] == 23.0
    assert state.attributes["override"]["origin"] == "user"
    assert state.attributes["reason"] == "Changed by hand until 16:00"
    thermostat = hass.states.get(THERMOSTAT)
    assert thermostat is not None
    assert thermostat.state == "heat"
    assert thermostat.attributes["temperature"] == 23.0
    assert standard_trvs["climate.living_trv_1"].setpoint == 23.0
    await call(hass, "button", "press", {"entity_id": "button.living_room_back_to_plan"})
    state = hass.states.get(SENSOR)
    assert state is not None
    assert state.state == "comfort"
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0


async def test_problem_sensor_turns_on_after_failed_writes(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    await climate.add("climate.living_trv_1", setpoint=21.0)
    await climate.add("climate.living_trv_2", setpoint=21.0)
    await climate.add("climate.bedroom_trv", setpoint=18.0, respond=False)
    await setup_entry(hass)
    problem = "binary_sensor.bedroom_heating_problem"
    assert hass.states.get(problem).state == "off"  # type: ignore[union-attr]
    await advance(hass, freezer, 210, steps=7)
    state = hass.states.get(problem)
    assert state is not None
    assert state.state == "on"
    assert state.attributes["issues"][0]["kind"] == "write_failed"
    assert state.attributes["issues"][0]["entity_id"] == "climate.bedroom_trv"


async def test_house_mode_select(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    select = "select.heating_house_mode"
    await call(hass, "select", "select_option", {"entity_id": select, "option": "away"})
    assert hass.states.get(select).state == "away"  # type: ignore[union-attr]
    assert standard_trvs["climate.bedroom_trv"].setpoint == 16.0
    await call(hass, "select", "select_option", {"entity_id": select, "option": "vacation"})
    state = hass.states.get(select)
    assert state is not None
    assert state.state == "vacation"
    assert state.attributes["selected_mode"] == "away"
    assert state.attributes["vacation_end"] is None
    assert standard_trvs["climate.bedroom_trv"].setpoint == 7.0
    await call(hass, "select", "select_option", {"entity_id": select, "option": "auto"})
    assert engine_of(entry).config.house.vacation is None
    assert standard_trvs["climate.bedroom_trv"].setpoint == 21.0


async def test_house_temperature_numbers(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    warm = "number.heating_temperature_warm"
    assert hass.states.get(warm).state == "21.0"  # type: ignore[union-attr]
    await call(hass, "number", "set_value", {"entity_id": warm, "value": 22.5})
    assert hass.states.get(warm).state == "22.5"  # type: ignore[union-attr]
    assert all(trv.setpoint == 22.5 for trv in standard_trvs.values())
    assert hass.states.get(SENSOR).attributes["target_temperature"] == 22.5  # type: ignore[union-attr]


async def test_thermostat_modes_presets_and_turn_on_off(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    trv = standard_trvs["climate.living_trv_1"]
    await call(hass, "climate", "set_preset_mode", {"entity_id": THERMOSTAT, "preset_mode": "eco"})
    assert trv.setpoint == 19.0
    assert hass.states.get(THERMOSTAT).state == "heat"  # type: ignore[union-attr]
    await call(hass, "climate", "set_hvac_mode", {"entity_id": THERMOSTAT, "hvac_mode": "auto"})
    assert trv.setpoint == 21.0
    await call(hass, "climate", "turn_off", {"entity_id": THERMOSTAT})
    assert hass.states.get(THERMOSTAT).state == "off"  # type: ignore[union-attr]
    assert trv.mode == "off"
    await call(hass, "climate", "turn_on", {"entity_id": THERMOSTAT})
    assert hass.states.get(THERMOSTAT).state == "auto"  # type: ignore[union-attr]
    assert trv.mode == "heat"
    await call(hass, "climate", "set_hvac_mode", {"entity_id": THERMOSTAT, "hvac_mode": "heat"})
    assert hass.states.get(THERMOSTAT).state == "heat"  # type: ignore[union-attr]
    assert trv.setpoint == 21.0


async def test_thermostat_refuses_changes_in_away_mode(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    config = two_rooms()
    store(hass_storage, replace(config, house=replace(config.house, mode=HouseMode.AWAY)))
    await setup_entry(hass)
    with pytest.raises(ServiceValidationError) as info:
        await hass.services.async_call(
            "climate",
            "set_temperature",
            {"entity_id": THERMOSTAT, "temperature": 23.0},
            blocking=True,
        )
    assert info.value.translation_key == "house_mode_active"


async def test_thermostat_follows_trv_temperatures_and_action(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    await climate.add("climate.living_trv_1", setpoint=21.0, current=19.0)
    second = await climate.add("climate.living_trv_2", setpoint=21.0, current=20.0)
    await climate.add("climate.bedroom_trv", setpoint=21.0)
    await setup_entry(hass)
    state = hass.states.get(THERMOSTAT)
    assert state is not None
    assert state.attributes["current_temperature"] == 19.5
    assert state.attributes["hvac_action"] == "idle"
    second._attr_hvac_action = "heating"  # type: ignore[assignment]
    second._attr_current_temperature = 21.0
    second.async_write_ha_state()
    await settle(hass)
    state = hass.states.get(THERMOSTAT)
    assert state is not None
    assert state.attributes["current_temperature"] == 20.0
    assert state.attributes["hvac_action"] == "heating"


async def test_display_temperature_entity(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    config = two_rooms()
    rooms = {
        **config.rooms,
        "living": replace(config.rooms["living"], temperature_entity="sensor.living_temperature"),
    }
    store(hass_storage, replace(config, rooms=rooms))
    hass.states.async_set("sensor.living_temperature", "22.34", {"device_class": "temperature"})
    await setup_entry(hass)
    assert hass.states.get(THERMOSTAT).attributes["current_temperature"] == 22.3  # type: ignore[union-attr]
    hass.states.async_set("sensor.living_temperature", "unavailable")
    await settle(hass)
    # Falls back to the TRVs.
    assert hass.states.get(THERMOSTAT).attributes["current_temperature"] == 20.0  # type: ignore[union-attr]


async def test_rooms_added_renamed_and_removed(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    devices = dr.async_get(hass)
    entities = er.async_get(hass)
    config = engine.config
    rooms = {
        **config.rooms,
        "living": replace(config.rooms["living"], name="Lounge"),
        "office": Room("office", "Office"),
    }
    await engine.async_apply_config(replace(config, rooms=rooms), None)
    await settle(hass)
    assert hass.states.get("sensor.office_heating_mode") is not None
    living = devices.async_get_device_by_identifier(("heating_scheduler", "living"), entry.entry_id)
    assert living is not None
    assert living.name == "Lounge"
    rooms = {key: value for key, value in rooms.items() if key != "bedroom"}
    await engine.async_apply_config(replace(engine.config, rooms=rooms), None)
    await settle(hass)
    assert (
        devices.async_get_device_by_identifier(("heating_scheduler", "bedroom"), entry.entry_id)
        is None
    )
    assert entities.async_get("sensor.bedroom_heating_mode") is None
    assert hass.states.get("sensor.bedroom_heating_mode") is None
