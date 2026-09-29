"""Websocket API tests."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar, entity_registry as er
import pytest
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.heating_scheduler.core.schedule_ops import default_house_plan
from custom_components.heating_scheduler.core.serde import plan_to_dict

from .conftest import FakeTrv, engine_of, settle, setup_entry, store, two_rooms


class Ws:
    """A websocket client that keeps pushed events aside."""

    def __init__(self, client: Any) -> None:
        self.client = client
        self.events: list[dict[str, Any]] = []

    async def cmd(self, command: str, **data: Any) -> dict[str, Any]:
        await self.client.send_json_auto_id({"type": f"heating_scheduler/{command}", **data})
        while True:
            msg: dict[str, Any] = await self.client.receive_json()
            if msg["type"] == "event":
                self.events.append(msg["event"])
                continue
            return msg

    async def ok(self, command: str, **data: Any) -> Any:
        msg = await self.cmd(command, **data)
        assert msg["success"], msg
        return msg["result"]

    async def error(self, command: str, **data: Any) -> str:
        msg = await self.cmd(command, **data)
        assert not msg["success"], msg
        code: str = msg["error"]["code"]
        return code

    async def event(self) -> dict[str, Any]:
        if self.events:
            return self.events.pop(0)
        msg: dict[str, Any] = await self.client.receive_json()
        assert msg["type"] == "event"
        event: dict[str, Any] = msg["event"]
        return event

    async def latest(self) -> dict[str, Any]:
        """Return the newest pushed snapshot."""
        event = await self.event()
        while self.events:
            event = self.events.pop(0)
        return event


@pytest.fixture
async def ws(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> Ws:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    return Ws(await hass_ws_client(hass))


async def test_subscribe_pushes_snapshots(hass: HomeAssistant, ws: Ws) -> None:
    await ws.ok("subscribe")
    data = await ws.event()
    assert data["revision"] == 0
    assert data["time_zone"] == "Europe/Prague"
    assert data["house"] == {"mode": "auto", "effective": "auto", "vacation": None}
    assert [room["id"] for room in data["rooms"]] == ["living", "bedroom"]
    living = data["rooms"][0]
    assert living["target"]["mode"] == "comfort"
    assert living["target"]["temperature"] == 21.0
    assert living["target"]["next"] == {"mode": "night", "temperature": 18.0, "source": "plan"}
    assert living["current_temperature"] == 20.0
    assert living["issues"] == []
    assert [trv["entity_id"] for trv in living["trv_status"]] == [
        "climate.living_trv_1",
        "climate.living_trv_2",
    ]
    assert data["plans"][0]["used_by"] == ["living", "bedroom"]
    assert data["temp_sets"][0]["temperatures"]["comfort"] == 21.0
    await ws.ok("override/set", room_id="living", temperature=23.5)
    await settle(hass)
    data = await ws.latest()
    assert data["rooms"][0]["target"]["mode"] == "manual"
    assert data["rooms"][0]["override"]["temperature"] == 23.5


async def test_room_create_update_delete_and_conflict(hass: HomeAssistant, ws: Ws) -> None:
    engine = engine_of(hass.config_entries.async_entries("heating_scheduler")[0])
    result = await ws.ok(
        "room/save",
        revision=0,
        room={"name": " Office ", "trvs": [], "temperature_entity": None},
    )
    room_id = result["room_id"]
    assert result["revision"] == 1
    assert engine.config.rooms[room_id].name == "Office"
    assert engine.config.revision == 1
    assert await ws.error("room/save", revision=0, room={"name": "Late", "trvs": []}) == (
        "revision_conflict"
    )
    await ws.ok(
        "room/save",
        revision=1,
        room={"id": room_id, "name": "Study", "trvs": ["climate.study_trv"]},
    )
    assert engine.config.rooms[room_id].name == "Study"
    assert engine.config.rooms[room_id].trvs == ("climate.study_trv",)
    assert await ws.error(
        "room/save", revision=2, room={"id": "room_nope", "name": "X", "trvs": []}
    ) == ("not_found")
    assert await ws.error("room/save", revision=2, room={"name": "Bedroom", "trvs": []}) == (
        "duplicate_name"
    )
    assert await ws.error(
        "room/save", revision=2, room={"name": "Loop", "trvs": ["climate.living_room"]}
    ) == ("invalid_trv")
    assert await ws.error(
        "room/save", revision=2, room={"name": "Dup", "trvs": ["climate.bedroom_trv"]}
    ) == ("trv_in_two_rooms")
    await ws.ok("rooms/reorder", revision=2, order=[room_id, "bedroom", "living"])
    assert list(engine.config.rooms) == [room_id, "bedroom", "living"]
    await ws.ok("room/delete", revision=3, room_id=room_id)
    assert room_id not in engine.config.rooms


async def test_plans_and_temperature_sets(hass: HomeAssistant, ws: Ws) -> None:
    engine = engine_of(hass.config_entries.async_entries("heating_scheduler")[0])
    plan = plan_to_dict(default_house_plan("Bedrooms"))
    del plan["id"]
    plan["days"][0] = [
        {"start": "22:00", "mode": "night"},
        {"start": "00:00", "mode": "night"},
        {"start": "07:00", "mode": "eco"},
        {"start": "08:00", "mode": "eco"},
    ]
    plan_id = (await ws.ok("plan/save", revision=0, plan=plan))["plan_id"]
    saved = engine.config.plans[plan_id]
    # Days are sorted and equal neighbours merged.
    assert [(slot.start.hour, slot.mode.value) for slot in saved.days[0]] == [
        (0, "night"),
        (7, "eco"),
        (22, "night"),
    ]
    set_id = (
        await ws.ok(
            "temp_set/save",
            revision=1,
            temp_set={"name": "Kids", "temperatures": {"comfort": 22.5}},
        )
    )["temp_set_id"]
    await ws.ok(
        "room/save",
        revision=2,
        room={
            "id": "bedroom",
            "name": "Bedroom",
            "trvs": ["climate.bedroom_trv"],
            "plan_id": plan_id,
            "temp_set_id": set_id,
        },
    )
    await settle(hass)
    assert engine.targets["bedroom"].mode.value == "eco"
    await ws.ok("plan/delete", revision=3, plan_id=plan_id)
    assert engine.config.rooms["bedroom"].plan_id == "house"
    await ws.ok("temp_set/delete", revision=4, temp_set_id=set_id)
    assert engine.config.rooms["bedroom"].temp_set_id == "house"
    assert await ws.error("plan/delete", revision=5, plan_id="house") == "house_protected"
    bad = plan_to_dict(default_house_plan("Broken"))
    del bad["id"]
    bad["days"][0][0]["start"] = "25:00"
    assert await ws.error("plan/save", revision=5, plan=bad) == "invalid"
    empty = {"name": "Empty", "days": [[] for _ in range(7)]}
    assert await ws.error("plan/save", revision=5, plan=empty) == "plan_empty"
    house = {"id": "house", "name": "House", "temperatures": {"comfort": 22.0}}
    assert await ws.error("temp_set/save", revision=5, temp_set=house) == "temperatures_incomplete"


async def test_settings(hass: HomeAssistant, ws: Ws) -> None:
    engine = engine_of(hass.config_entries.async_entries("heating_scheduler")[0])
    settings = {
        "max_override_minutes": 120,
        "safety_interval_minutes": 10,
        "mismatch_alert_minutes": 30,
        "vacation_mode": "away",
        "dry_run": True,
    }
    assert (await ws.ok("settings/save", revision=0, settings=settings)) == {"revision": 1}
    assert engine.config.settings.max_override.total_seconds() == 7200
    assert engine.config.settings.dry_run is True
    settings["safety_interval_minutes"] = 0
    assert await ws.error("settings/save", revision=1, settings=settings) == "setting_range"


async def test_override_house_mode_and_vacation(hass: HomeAssistant, ws: Ws) -> None:
    engine = engine_of(hass.config_entries.async_entries("heating_scheduler")[0])
    result = await ws.ok(
        "override/set", room_id="living", temperature=22.0, kind="duration", minutes=90
    )
    assert result["temperature"] == 22.0
    await ws.ok("override/set", room_id="living", temperature=None)
    assert engine.state.overrides["living"].temperature is None
    await ws.ok("override/clear", room_id="living")
    assert "living" not in engine.state.overrides
    assert await ws.error("override/set", room_id="nope", temperature=21.0) == "not_found"
    await ws.ok("house_mode/set", mode="away")
    assert await ws.error("override/set", room_id="living", temperature=21.0) == (
        "house_mode_active"
    )
    await ws.ok("house_mode/set", mode="auto")
    await ws.ok(
        "vacation/set",
        start="2026-10-10T08:00:00+02:00",
        end="2026-10-20T12:00:00+02:00",
        mode="frost",
    )
    assert engine.config.house.vacation is not None
    assert await ws.error("vacation/set", end="2026-10-01T12:00:00+02:00") == "vacation_order"
    assert await ws.error("vacation/set", end="2026-10-21T12:00:00") == "naive_datetime"
    await ws.ok("vacation/cancel")
    assert engine.config.house.vacation is None
    await ws.ok("reconcile")


async def test_log(hass: HomeAssistant, ws: Ws) -> None:
    result = await ws.ok("log", room_id="bedroom")
    kinds = [entry["kind"] for entry in result["entries"]]
    assert kinds == ["verified", "write"]
    assert result["entries"][1]["value"] == 21.0
    assert result["entries"][1]["source"] == "plan"
    assert await ws.error("log", room_id="nope") == "not_found"


async def test_candidates(hass: HomeAssistant, ws: Ws) -> None:
    areas = ar.async_get(hass)
    kitchen = areas.async_create("Kitchen")
    entities = er.async_get(hass)
    trv = entities.async_get_or_create(
        "climate", "zigbee", "kitchen-trv", suggested_object_id="kitchen_trv"
    )
    entities.async_update_entity(trv.entity_id, area_id=kitchen.id)
    sensor = entities.async_get_or_create(
        "sensor", "zigbee", "kitchen-temp", suggested_object_id="kitchen_temperature"
    )
    entities.async_update_entity(sensor.entity_id, area_id=kitchen.id)
    hass.states.async_set(trv.entity_id, "heat", {"temperature": 20})
    hass.states.async_set(
        sensor.entity_id, "21.5", {"device_class": "temperature", "unit_of_measurement": "°C"}
    )
    result = await ws.ok("candidates")
    climates = {item["entity_id"]: item for item in result["climates"]}
    assert "climate.living_room" not in climates  # our own room thermostat
    assert climates["climate.bedroom_trv"]["room_id"] == "bedroom"
    assert climates[trv.entity_id]["area_id"] == kitchen.id
    assert result["areas"] == [
        {
            "area_id": kitchen.id,
            "name": "Kitchen",
            "climates": [trv.entity_id],
            "temperature_entity": sensor.entity_id,
        }
    ]
    assert result["temperature_entities"][0]["entity_id"] == sensor.entity_id


async def test_not_loaded(hass: HomeAssistant, ws: Ws) -> None:
    entry = hass.config_entries.async_entries("heating_scheduler")[0]
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert await ws.error("log", room_id="bedroom") == "not_loaded"
