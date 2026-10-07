"""Open windows: contact sensors, the valves' own detection and a fast temperature drop."""

from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.heating_scheduler.core.config_ops import put_settings
from custom_components.heating_scheduler.core.model import (
    Config,
    HouseMode,
    RuntimeState,
    Source,
    TargetMode,
    WindowSignals,
)
from custom_components.heating_scheduler.core.validation import ValidationError
from custom_components.heating_scheduler.log import LogKind

from .conftest import FakeTrv, advance, engine_of, settle, setup_entry, store, two_rooms
from .test_websocket import Ws
from .test_zones import state_of

WINDOW = "binary_sensor.living_window"
VALVE_WINDOW = "binary_sensor.living_trv_1_window_open"
ROOM_TEMPERATURE = "sensor.living_temperature"
SENSOR = "sensor.living_room_heating_mode"
THERMOSTAT = "climate.living_room"


def with_living(**changes: Any) -> Config:
    config = two_rooms()
    living = replace(config.rooms["living"], **changes)
    return replace(config, rooms={**config.rooms, "living": living})


def living_trvs(trvs: dict[str, FakeTrv]) -> tuple[FakeTrv, FakeTrv]:
    return trvs["climate.living_trv_1"], trvs["climate.living_trv_2"]


def kinds(engine: Any, room_id: str) -> list[LogKind]:
    return [entry.kind for entry in engine.log.entries(room_id)]


async def test_contact_sensor_turns_the_room_off_after_the_delay_and_back_when_closed(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    hass.states.async_set(WINDOW, "off")
    store(hass_storage, with_living(window_sensors=(WINDOW,)))
    engine = engine_of(await setup_entry(hass))
    first, second = living_trvs(standard_trvs)
    bedroom = standard_trvs["climate.bedroom_trv"]
    assert first.setpoint == 21.0

    hass.states.async_set(WINDOW, "on")
    await settle(hass)
    await advance(hass, freezer, 29)
    assert engine.targets["living"].source is Source.PLAN
    assert engine.targets["living"].next is not None
    assert engine.targets["living"].next.mode is TargetMode.WINDOW
    assert first.mode == "heat"

    await advance(hass, freezer, 1)
    target = engine.targets["living"]
    assert target.source is Source.WINDOW
    assert target.temperature is None
    assert first.mode == "off" and second.mode == "off"
    assert bedroom.mode == "heat"  # other rooms go on
    assert LogKind.WINDOW_OPEN in kinds(engine, "living")
    assert state_of(hass, SENSOR).state == "window"
    assert state_of(hass, SENSOR).attributes["window_open"] is True
    thermostat = state_of(hass, THERMOSTAT)
    assert thermostat.state == "off"
    assert thermostat.attributes["window_open"] is True
    assert thermostat.attributes["status"] == "Window open: off until 13:00"

    # Changes from the app wait until the window is closed.
    with pytest.raises(ValidationError) as err:
        await engine.async_set_override("living", 23.0)
    assert err.value.code == "window_open"

    hass.states.async_set(WINDOW, "off")
    await settle(hass)
    assert engine.targets["living"].source is Source.PLAN
    assert first.mode == "heat" and first.setpoint == 21.0
    assert second.mode == "heat" and second.setpoint == 21.0
    assert LogKind.WINDOW_CLOSED in kinds(engine, "living")
    assert state_of(hass, SENSOR).attributes["window_open"] is False


async def test_window_closed_within_the_delay_does_nothing(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, with_living(window_sensors=(WINDOW,)))
    engine = engine_of(await setup_entry(hass))
    first, _ = living_trvs(standard_trvs)
    first.calls.clear()
    hass.states.async_set(WINDOW, "on")
    await advance(hass, freezer, 10)
    hass.states.async_set(WINDOW, "off")
    await advance(hass, freezer, 60)
    assert first.calls == []
    assert LogKind.WINDOW_OPEN not in kinds(engine, "living")


async def test_window_open_too_long_heats_at_frost_guard(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, with_living(window_sensors=(WINDOW,)))
    engine = engine_of(await setup_entry(hass))
    first, _ = living_trvs(standard_trvs)
    hass.states.async_set(WINDOW, "on")
    await advance(hass, freezer, 30)
    assert first.mode == "off"
    await advance(hass, freezer, 3600)
    assert engine.targets["living"].source is Source.WINDOW
    assert engine.targets["living"].temperature == 7.0
    assert first.mode == "heat" and first.setpoint == 7.0


async def test_knob_turn_while_the_window_is_open_is_undone(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: Any,
    freezer: FrozenDateTimeFactory,
) -> None:
    # Valves without HVAC mode off get their minimum while the window is open.
    trvs = {
        entity_id: await climate.add(entity_id, setpoint=18.0, hvac_modes=("heat",))
        for entity_id in ("climate.living_trv_1", "climate.living_trv_2", "climate.bedroom_trv")
    }
    store(hass_storage, with_living(window_sensors=(WINDOW,)))
    engine = engine_of(await setup_entry(hass))
    first, _ = living_trvs(trvs)
    hass.states.async_set(WINDOW, "on")
    await advance(hass, freezer, 30)
    assert first.setpoint == 4.0
    first.knob(22.0)
    await settle(hass)
    assert "living" not in engine.state.overrides
    assert first.setpoint == 4.0
    ignored = engine.log.entries("living")
    assert any(e.kind is LogKind.MANUAL_IGNORED and e.detail == "window" for e in ignored)


async def test_open_window_does_not_beat_a_house_mode(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, with_living(window_sensors=(WINDOW,)))
    engine = engine_of(await setup_entry(hass))
    await engine.async_set_house_mode(HouseMode.AWAY)
    hass.states.async_set(WINDOW, "on")
    await advance(hass, freezer, 30)
    assert engine.targets["living"].source is Source.HOUSE_AWAY


async def test_valve_detection_counts_at_once_and_its_own_setpoint_change_is_not_manual(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    hass.states.async_set(VALVE_WINDOW, "off")
    store(hass_storage, with_living(valve_window_sensors=(VALVE_WINDOW,)))
    engine = engine_of(await setup_entry(hass))
    first, second = living_trvs(standard_trvs)

    # The valve lowers its setpoint first, then reports the open window.
    first.knob(5.0)
    await settle(hass)
    assert "living" in engine.state.overrides
    hass.states.async_set(VALVE_WINDOW, "on")
    await settle(hass)
    assert "living" not in engine.state.overrides
    assert engine.targets["living"].source is Source.WINDOW
    assert first.mode == "off" and second.mode == "off"

    # Closed: the valve restores its setpoint by itself; that is not a manual change either.
    await advance(hass, freezer, 60)
    hass.states.async_set(VALVE_WINDOW, "off")
    first.knob(18.0)
    await settle(hass)
    await advance(hass, freezer, 5)
    assert "living" not in engine.state.overrides
    assert engine.targets["living"].source is Source.PLAN
    assert first.mode == "heat" and first.setpoint == 21.0


async def test_fast_temperature_drop_counts_as_an_open_window(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    unit = {"device_class": "temperature", "unit_of_measurement": "°C"}
    hass.states.async_set(ROOM_TEMPERATURE, "21.0", unit)
    store(
        hass_storage,
        with_living(temperature_entity=ROOM_TEMPERATURE, window_drop=True),
    )
    engine = engine_of(await setup_entry(hass))
    first, _ = living_trvs(standard_trvs)
    hass.states.async_set(ROOM_TEMPERATURE, "21.1", unit)
    await advance(hass, freezer, 60)
    hass.states.async_set(ROOM_TEMPERATURE, "20.5", unit)
    await advance(hass, freezer, 60)
    assert engine.targets["living"].source is Source.PLAN
    hass.states.async_set(ROOM_TEMPERATURE, "20.0", unit)
    await settle(hass)
    assert engine.targets["living"].source is Source.WINDOW
    assert first.mode == "off"

    # Without a rise, the drop counts as closed after 30 minutes.
    await advance(hass, freezer, 30 * 60)
    assert engine.targets["living"].source is Source.PLAN
    assert first.mode == "heat" and first.setpoint == 21.0


async def test_drop_rules_come_from_the_settings(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    unit = {"device_class": "temperature", "unit_of_measurement": "°C"}
    hass.states.async_set(ROOM_TEMPERATURE, "21.0", unit)
    store(hass_storage, with_living(temperature_entity=ROOM_TEMPERATURE, window_drop=True))
    engine = engine_of(await setup_entry(hass))
    settings = replace(
        engine.config.settings, window_drop_degrees=0.5, window_drop_hold=timedelta(minutes=10)
    )
    await engine.async_apply_config(put_settings(engine.config, settings), None)
    await settle(hass)
    hass.states.async_set(ROOM_TEMPERATURE, "21.1", unit)
    await advance(hass, freezer, 60)
    hass.states.async_set(ROOM_TEMPERATURE, "20.6", unit)
    await settle(hass)
    assert engine.targets["living"].source is Source.WINDOW
    await advance(hass, freezer, 10 * 60)
    assert engine.targets["living"].source is Source.PLAN


async def test_a_restart_keeps_the_time_a_window_has_been_open(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    # Open for 40 minutes before the restart; the sensor is offline while HA starts.
    opened = dt_util.utcnow() - timedelta(minutes=40)
    hass.states.async_set(WINDOW, "unavailable")
    store(
        hass_storage,
        with_living(window_sensors=(WINDOW,)),
        RuntimeState(windows={"living": WindowSignals(contact=opened)}),
    )
    engine = engine_of(await setup_entry(hass))
    first, _ = living_trvs(standard_trvs)
    assert engine.targets["living"].source is Source.PLAN
    assert engine.state.windows["living"].contact == opened  # kept while not known

    # It reports open with a new last_changed: no new delay, and the limit counts from before.
    hass.states.async_set(WINDOW, "on")
    await settle(hass)
    window = engine.windows["living"]
    assert window.since == opened + timedelta(seconds=30)
    assert first.mode == "off"
    await advance(hass, freezer, 21 * 60)
    assert engine.targets["living"].temperature == 7.0
    await advance(hass, freezer, 5)
    assert hass_storage["heating_scheduler.state"]["data"]["windows"]["living"]["contact"] == (
        opened.isoformat()
    )

    hass.states.async_set(WINDOW, "off")
    await settle(hass)
    assert engine.state.windows == {}


async def test_a_window_closed_while_home_assistant_was_down_is_forgotten(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
) -> None:
    hass.states.async_set(WINDOW, "off")
    opened = dt_util.utcnow() - timedelta(hours=3)
    store(
        hass_storage,
        with_living(window_sensors=(WINDOW,)),
        RuntimeState(windows={"living": WindowSignals(contact=opened)}),
    )
    engine = engine_of(await setup_entry(hass))
    assert engine.state.windows == {}
    hass.states.async_set(WINDOW, "on")
    await settle(hass)
    assert "living" not in engine.windows  # a new opening waits for the delay again


async def test_a_restart_keeps_a_drop_detection(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    unit = {"device_class": "temperature", "unit_of_measurement": "°C"}
    hass.states.async_set(ROOM_TEMPERATURE, "18.0", unit)
    opened = dt_util.utcnow() - timedelta(minutes=10)
    store(
        hass_storage,
        with_living(temperature_entity=ROOM_TEMPERATURE, window_drop=True),
        RuntimeState(windows={"living": WindowSignals(drop=opened)}),
    )
    engine = engine_of(await setup_entry(hass))
    first, _ = living_trvs(standard_trvs)
    assert engine.targets["living"].source is Source.WINDOW
    assert first.mode == "off"
    # Closed after the rest of the 30 minutes.
    await advance(hass, freezer, 20 * 60)
    assert engine.targets["living"].source is Source.PLAN
    assert engine.state.windows == {}


async def ws_client(
    hass: HomeAssistant, hass_storage: dict[str, Any], hass_ws_client: WebSocketGenerator
) -> Ws:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    return Ws(await hass_ws_client(hass))


async def test_room_save_and_snapshot_with_windows(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> None:
    ws = await ws_client(hass, hass_storage, hass_ws_client)
    engine = engine_of(hass.config_entries.async_entries("heating_scheduler")[0])
    room = {
        "id": "living",
        "name": "Living room",
        "trvs": ["climate.living_trv_1", "climate.living_trv_2"],
    }
    # One way to detect an open window per room.
    assert await ws.error(
        "room/save",
        revision=0,
        room={**room, "window_sensors": [WINDOW], "valve_window_sensors": [VALVE_WINDOW]},
    ) == ("one_window_method")
    await ws.ok("room/save", revision=0, room={**room, "valve_window_sensors": [VALVE_WINDOW]})
    living = engine.config.rooms["living"]
    assert living.window_sensors == ()
    assert living.valve_window_sensors == (VALVE_WINDOW,)
    assert living.window_drop is False
    assert await ws.error(
        "room/save",
        revision=1,
        room={"id": "living", "name": "Living room", "trvs": [], "window_sensors": ["sensor.x"]},
    ) == ("invalid_entity")

    await ws.ok("subscribe")
    data = await ws.event()
    assert data["rooms"][0]["window"] is None
    assert data["rooms"][0]["valve_window_sensors"] == [VALVE_WINDOW]
    hass.states.async_set(VALVE_WINDOW, "on")
    await settle(hass)
    data = await ws.latest()
    assert data["rooms"][0]["target"]["source"] == "window"
    assert data["rooms"][0]["window"]["since"] == "2026-10-05T10:00:00+00:00"


async def test_candidates_offer_the_valves_window_entities(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> None:
    ws = await ws_client(hass, hass_storage, hass_ws_client)
    devices = dr.async_get(hass)
    entities = er.async_get(hass)
    entry = MockConfigEntry(domain="mqtt")
    entry.add_to_hass(hass)
    device = devices.async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={("mqtt", "kitchen-trv")}
    )
    for domain, object_id in (
        ("climate", "kitchen_trv"),
        ("binary_sensor", "kitchen_trv_window_open"),
        ("switch", "kitchen_trv_open_window"),  # turns the valve's detection on
        ("sensor", "kitchen_trv_battery"),
    ):
        item = entities.async_get_or_create(
            domain, "mqtt", object_id, suggested_object_id=object_id, device_id=device.id
        )
        hass.states.async_set(item.entity_id, "off")
    result = await ws.ok("candidates")
    assert [(item["entity_id"], item["trvs"]) for item in result["valve_window_entities"]] == [
        ("binary_sensor.kitchen_trv_window_open", ["climate.kitchen_trv"])
    ]
