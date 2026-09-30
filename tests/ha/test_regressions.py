"""Regression tests for the code review of 2026-09-30 (docs/code-review-2026-09-30.md)."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.climate.const import HVACMode
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar, device_registry as dr
from homeassistant.util.unit_system import US_CUSTOMARY_SYSTEM
import pytest

from custom_components.heating_scheduler.const import DOMAIN

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


async def test_f01_fahrenheit_host_sends_the_celsius_target(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    hass.config.units = US_CUSTOMARY_SYSTEM
    store(hass_storage, two_rooms())
    await climate.add("climate.living_trv_1", setpoint=21.0, min_temp=5.0)
    await climate.add("climate.living_trv_2", setpoint=21.0, min_temp=5.0)
    trv = await climate.add("climate.bedroom_trv", setpoint=18.0, min_temp=5.0, current=19.5)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert engine.targets["bedroom"].temperature == 21.0
    # The valve works in °C; Home Assistant shows and accepts °F in between.
    assert trv.temperature_calls == [pytest.approx(21.0, abs=0.01)]
    assert trv.setpoint == pytest.approx(21.0, abs=0.01)
    assert engine.workers["climate.bedroom_trv"].phase.value == "idle"
    # Home Assistant shows °F in whole degrees: 19.5 °C → 67 °F → 19.4 °C.
    assert engine.room_temperature(engine.config.rooms["bedroom"]) == pytest.approx(19.5, abs=0.3)
    # A knob change is read in °C as well.
    trv.knob(23.0)
    await settle(hass)
    assert engine.state.overrides["bedroom"].temperature == 23.0


async def test_f01_fahrenheit_display_sensor_is_converted(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    config = two_rooms()
    rooms = {
        **config.rooms,
        "living": replace(config.rooms["living"], temperature_entity="sensor.outside_unit"),
    }
    store(hass_storage, replace(config, rooms=rooms))
    hass.states.async_set(
        "sensor.outside_unit", "71.6", {"device_class": "temperature", "unit_of_measurement": "°F"}
    )
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert engine.room_temperature(engine.config.rooms["living"]) == 22.0


async def test_f02_late_older_command_after_newer_confirmation_is_corrected(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_trv_1", "climate.living_trv_2"):
        await climate.add(entity_id, setpoint=21.0)
    trv = await climate.add("climate.bedroom_trv", setpoint=18.0, delay=8)
    entry = await setup_entry(hass)  # 21 is sent now and lands at +8 s
    engine = engine_of(entry)
    await advance(hass, freezer, 1)
    trv.delay = 1
    override = await engine.async_set_override("bedroom", 23.0)
    await settle(hass)
    await advance(hass, freezer, 1)  # 23 lands and is confirmed
    assert trv.setpoint == 23.0
    await advance(hass, freezer, 6)  # the old 21 lands after the newer 23
    assert engine.state.overrides["bedroom"] == override
    await advance(hass, freezer, 2)  # the engine sends 23 again
    assert trv.setpoint == 23.0
    assert engine.state.overrides["bedroom"] == override


async def test_f03_unrelated_report_does_not_confirm_a_mode_switch(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    await climate.add("climate.living_trv_1", setpoint=21.0)
    await climate.add("climate.living_trv_2", setpoint=21.0)
    trv = await climate.add("climate.bedroom_trv", setpoint=21.0)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    climate.slow = asyncio.Event()
    # Someone turns the valve off in Home Assistant; the engine switches it back on.
    trv.mode = HVACMode.OFF
    trv.intermediate = 5.0
    trv.write()
    for _ in range(20):
        await asyncio.sleep(0)
    worker = engine.workers[trv.entity_id]
    assert worker.pending
    assert not worker.pending[-1].confirmed
    # An unrelated report (room temperature) arrives while the valve is still off.
    trv._attr_current_temperature = 19.0
    trv.write()
    for _ in range(20):
        await asyncio.sleep(0)
    assert not worker.pending[-1].confirmed
    climate.slow.set()
    await settle(hass)
    assert engine.state.overrides == {}
    assert trv.mode == "heat"
    assert trv.setpoint == 21.0


async def test_f04_test_mode_stops_a_retrying_write(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_trv_1", "climate.living_trv_2"):
        await climate.add(entity_id, setpoint=21.0)
    trv = await climate.add("climate.bedroom_trv", setpoint=18.0, respond=False)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert trv.temperature_calls == [21.0]
    settings = replace(engine.config.settings, dry_run=True)
    await engine.async_apply_config(replace(engine.config, settings=settings), None)
    await settle(hass)
    await advance(hass, freezer, 31)
    await advance(hass, freezer, 400, steps=4)
    assert trv.temperature_calls == [21.0]


async def test_f04_queued_write_is_not_sent_in_test_mode(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    config = two_rooms()
    many = replace(config.rooms["living"], trvs=tuple(f"climate.trv_{i}" for i in range(4)))
    store(hass_storage, replace(config, rooms={"living": many}))
    for i in range(4):
        await climate.add(f"climate.trv_{i}", setpoint=21.0)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    climate.slow = asyncio.Event()
    await engine.async_set_override("living", 23.0)
    for _ in range(20):
        await asyncio.sleep(0)
    assert climate.in_flight == 2  # two writes run, two wait for the write limiter
    # Test mode goes on without stopping the cycles: the queued writes must check it.
    engine.config = replace(engine.config, settings=replace(engine.config.settings, dry_run=True))
    climate.slow.set()
    await settle(hass)
    calls = sorted(len(trv.temperature_calls) for trv in climate.trvs.values())
    assert calls == [0, 0, 1, 1]


async def test_f08_display_sensor_change_reaches_listeners(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    config = two_rooms()
    rooms = {
        **config.rooms,
        "living": replace(config.rooms["living"], temperature_entity="sensor.living_temp"),
    }
    store(hass_storage, replace(config, rooms=rooms))
    hass.states.async_set("sensor.living_temp", "20", {"device_class": "temperature"})
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    pushes: list[float | None] = []
    unsub = engine.async_add_listener(
        lambda: pushes.append(engine.room_temperature(engine.config.rooms["living"]))
    )
    try:
        hass.states.async_set("sensor.living_temp", "23", {"device_class": "temperature"})
        await settle(hass)
        assert pushes[-1] == 23.0
        sensor = hass.states.get("sensor.living_room_heating_mode")
        assert sensor is not None
        assert sensor.attributes["current_temperature"] == 23.0
        # A new display sensor is followed without a TRV change.
        rooms = {
            **engine.config.rooms,
            "living": replace(engine.config.rooms["living"], temperature_entity="sensor.other"),
        }
        await engine.async_apply_config(replace(engine.config, rooms=rooms), None)
        await settle(hass)
        hass.states.async_set("sensor.other", "18.5", {"device_class": "temperature"})
        await settle(hass)
        assert pushes[-1] == 18.5
    finally:
        unsub()


async def test_f09_clearing_a_room_area_clears_the_device_area(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    area = ar.async_get(hass).async_create("Downstairs")
    config = two_rooms()
    rooms = {**config.rooms, "living": replace(config.rooms["living"], area_id=area.id)}
    store(hass_storage, replace(config, rooms=rooms))
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    registry = dr.async_get(hass)
    device = registry.async_get_device_by_identifier((DOMAIN, "living"), entry.entry_id)
    assert device is not None
    assert device.area_id == area.id
    rooms = {**engine.config.rooms, "living": replace(engine.config.rooms["living"], area_id=None)}
    await engine.async_apply_config(replace(engine.config, rooms=rooms), None)
    await settle(hass)
    updated = registry.async_get(device.id)
    assert updated is not None
    assert updated.area_id is None


async def test_f09_area_set_in_home_assistant_stays(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    """A room without `area_id` keeps the device area a person chose in Home Assistant."""
    area = ar.async_get(hass).async_create("Upstairs")
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    registry = dr.async_get(hass)
    device = registry.async_get_device_by_identifier((DOMAIN, "bedroom"), entry.entry_id)
    assert device is not None
    registry.async_update_device(device.id, area_id=area.id)
    rooms = {
        **engine.config.rooms,
        "bedroom": replace(engine.config.rooms["bedroom"], name="Master bedroom"),
    }
    await engine.async_apply_config(replace(engine.config, rooms=rooms), None)
    await settle(hass)
    updated = registry.async_get(device.id)
    assert updated is not None
    assert updated.area_id == area.id
    assert updated.name == "Master bedroom"
