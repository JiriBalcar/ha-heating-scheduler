"""Zones in Home Assistant: per-zone modes and holidays, selects, actions, websocket, upgrade."""

from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, State
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import area_registry as ar, entity_registry as er, floor_registry as fr
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.heating_scheduler.const import DOMAIN
from custom_components.heating_scheduler.core.config_ops import put_zone
from custom_components.heating_scheduler.core.model import (
    Config,
    HouseMode,
    HouseState,
    Room,
    Source,
    Zone,
)
from custom_components.heating_scheduler.core.serde import config_to_dict

from .conftest import FakeTrv, advance, engine_of, settle, setup_entry, store, two_rooms
from .test_websocket import Ws


def two_zones() -> Config:
    """The living room in the first zone ("House"), the bedroom upstairs."""
    config = put_zone(two_rooms(), Zone("upstairs", "Upstairs"))
    bedroom = replace(config.rooms["bedroom"], zone_id="upstairs")
    return replace(config, rooms={**config.rooms, "bedroom": bedroom})


def state_of(hass: HomeAssistant, entity_id: str) -> State:
    state = hass.states.get(entity_id)
    assert state is not None
    return state


def zone_select(hass: HomeAssistant, zone_id: str) -> str | None:
    return er.async_get(hass).async_get_entity_id("select", DOMAIN, f"zone_{zone_id}_mode")


async def test_zone_mode_applies_only_to_its_rooms(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_zones())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    await engine.async_set_override("living", 23.0)
    await engine.async_set_override("bedroom", 23.0)
    await engine.async_set_house_mode(HouseMode.AWAY, ["upstairs"])
    await settle(hass)
    assert engine.targets["bedroom"].source is Source.HOUSE_AWAY
    assert standard_trvs["climate.bedroom_trv"].setpoint == 16.0
    # The upstairs mode ended the manual change upstairs only.
    assert "bedroom" not in engine.state.overrides
    assert engine.targets["living"].source is Source.MANUAL
    assert standard_trvs["climate.living_trv_1"].setpoint == 23.0
    assert engine.house_mode() is None
    await engine.async_set_house_mode(HouseMode.AWAY)
    await settle(hass)
    assert engine.house_mode() is HouseMode.AWAY
    assert "living" not in engine.state.overrides


async def test_zone_holiday_returns_to_the_zone_mode(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_zones())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    await engine.async_set_house_mode(HouseMode.OFF, ["upstairs"])
    await engine.async_set_vacation(None, None, None, ["upstairs"])
    await settle(hass)
    upstairs = engine.config.zones["upstairs"].house
    assert upstairs.mode is HouseMode.OFF
    assert upstairs.vacation is not None
    assert engine.targets["bedroom"].source is Source.VACATION
    assert engine.targets["living"].source is Source.PLAN
    await engine.async_cancel_vacation(["upstairs"])
    await settle(hass)
    assert engine.targets["bedroom"].source is Source.HOUSE_OFF
    # A holiday with an end: afterwards the zone is back in its own mode.
    end = dt_util.utcnow() + timedelta(hours=1)
    await engine.async_set_vacation(None, end, None, ["upstairs"])
    await settle(hass)
    assert engine.targets["bedroom"].source is Source.VACATION
    await advance(hass, freezer, 3700)
    assert engine.config.zones["upstairs"].house == HouseState(HouseMode.OFF)
    assert engine.targets["bedroom"].source is Source.HOUSE_OFF
    assert engine.targets["living"].source is Source.PLAN


async def test_selects_for_the_house_and_each_zone(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    # One zone: only the house select.
    assert zone_select(hass, "house") is None
    assert state_of(hass, "select.heating_house_mode").state == "auto"
    await engine.async_apply_config(put_zone(engine.config, Zone("upstairs", "Upstairs")), None)
    await settle(hass)
    upstairs = zone_select(hass, "upstairs")
    house = zone_select(hass, "house")
    assert upstairs is not None and house is not None
    await hass.services.async_call(
        "select", "select_option", {"entity_id": upstairs, "option": "away"}, blocking=True
    )
    await settle(hass)
    assert state_of(hass, upstairs).state == "away"
    assert state_of(hass, house).state == "auto"
    # The zones differ: the house select is unknown and lists the zones.
    state = state_of(hass, "select.heating_house_mode")
    assert state.state == "unknown"
    assert state.attributes["zones"] == {"House": "auto", "Upstairs": "away"}
    await hass.services.async_call(
        "select",
        "select_option",
        {"entity_id": "select.heating_house_mode", "option": "off"},
        blocking=True,
    )
    await settle(hass)
    assert state_of(hass, "select.heating_house_mode").state == "off"
    assert state_of(hass, upstairs).state == "off"
    # Back to one zone: the zone selects are removed.
    config = engine.config
    config = replace(config, zones={"house": config.zones["house"]})
    await engine.async_apply_config(config, None)
    await settle(hass)
    assert zone_select(hass, "upstairs") is None
    assert zone_select(hass, "house") is None
    assert hass.states.get(upstairs) is None


async def test_house_actions_with_a_zone(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_zones())
    entry = await setup_entry(hass)
    engine = engine_of(entry)

    async def call(service: str, data: dict[str, Any]) -> None:
        await hass.services.async_call(DOMAIN, service, data, blocking=True)
        await settle(hass)

    await call("set_house_mode", {"mode": "off", "zone": "upstairs"})  # a name, any case
    assert engine.config.zones["upstairs"].house.mode is HouseMode.OFF
    assert engine.config.zones["house"].house.mode is HouseMode.AUTO
    await call("set_vacation", {"zone": "upstairs", "end": "2026-10-20 12:00:00"})
    assert engine.config.zones["upstairs"].house.vacation is not None
    assert engine.config.zones["house"].house.vacation is None
    await call("cancel_vacation", {"zone": "Upstairs"})
    assert engine.config.zones["upstairs"].house.vacation is None
    await call("set_house_mode", {"mode": "away"})  # no zone: every zone
    assert {zone.house.mode for zone in engine.config.zones.values()} == {HouseMode.AWAY}
    with pytest.raises(ServiceValidationError) as info:
        await call("set_house_mode", {"mode": "auto", "zone": "Garage"})
    assert info.value.translation_key == "not_found"


async def test_zone_commands(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    ws = Ws(await hass_ws_client(hass))
    result = await ws.ok("zone/save", revision=0, zone={"name": "Upstairs"})
    upstairs = result["zone_id"]
    await ws.ok("zone/save", revision=1, zone={"id": upstairs, "name": "First floor"})
    assert engine.config.zones[upstairs].name == "First floor"
    assert await ws.error("zone/save", revision=0, zone={"name": "X"}) == "revision_conflict"
    room = config_to_dict(engine.config)["rooms"][1]
    await ws.ok("room/save", revision=2, room={**room, "zone_id": upstairs})
    assert engine.config.rooms["bedroom"].zone_id == upstairs
    await ws.ok("house_mode/set", mode="away", zone_id=upstairs)
    await settle(hass)
    assert engine.targets["bedroom"].source is Source.HOUSE_AWAY
    assert engine.targets["living"].source is Source.PLAN
    await ws.ok("vacation/set", end="2026-10-20T10:00:00+00:00", zone_id=upstairs)
    assert engine.config.zones[upstairs].house.vacation is not None
    await ws.ok("vacation/cancel", zone_id=upstairs)
    assert engine.config.zones[upstairs].house.vacation is None
    revision = engine.config.revision
    await ws.ok("zones/reorder", revision=revision, order=[upstairs, "house"])
    assert list(engine.config.zones) == [upstairs, "house"]
    await ws.ok("zone/delete", revision=revision + 1, zone_id=upstairs)
    assert list(engine.config.zones) == ["house"]
    assert engine.config.rooms["bedroom"].zone_id == "house"
    code = await ws.error("zone/delete", revision=revision + 2, zone_id="house")
    assert code == "last_zone"
    await ws.ok("subscribe")
    data = await ws.event()
    assert [zone["id"] for zone in data["zones"]] == ["house"]
    assert data["zones"][0]["rooms"] == ["living", "bedroom"]


async def test_zones_from_floors(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> None:
    floors = fr.async_get(hass)
    ground = floors.async_create("Ground floor", level=0)
    first = floors.async_create("First floor", level=1)
    areas = ar.async_get(hass)
    living_area = areas.async_create("Living", floor_id=ground.floor_id)
    bed_area = areas.async_create("Bed", floor_id=first.floor_id)
    # A room without an area of its own is on the floor of its valve's area.
    registry = er.async_get(hass)
    attic_trv = registry.async_get_or_create(
        "climate", "test", "attic", suggested_object_id="attic"
    )
    registry.async_update_entity(attic_trv.entity_id, area_id=bed_area.id)
    config = two_rooms()
    rooms = {
        "living": replace(config.rooms["living"], area_id=living_area.id),
        "bedroom": replace(config.rooms["bedroom"], area_id=bed_area.id),
        "attic": Room("attic", "Attic", (attic_trv.entity_id,)),
    }
    store(hass_storage, replace(config, rooms=rooms))
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    ws = Ws(await hass_ws_client(hass))
    candidates = await ws.ok("candidates")
    assert [(item["name"], item["rooms"]) for item in candidates["floors"]] == [
        ("Ground floor", ["living"]),
        ("First floor", ["bedroom", "attic"]),
    ]
    await ws.ok("zones/from_floors", revision=0)
    names = {zone.name: zone.id for zone in engine.config.zones.values()}
    # The old zone was emptied by the import and is gone.
    assert list(names) == ["Ground floor", "First floor"]
    assert engine.config.rooms["living"].zone_id == names["Ground floor"]
    assert engine.config.rooms["bedroom"].zone_id == names["First floor"]
    assert engine.config.rooms["attic"].zone_id == names["First floor"]
    # Running it again changes nothing.
    await ws.ok("zones/from_floors", revision=1)
    assert {zone.name for zone in engine.config.zones.values()} == set(names)


async def test_upgrade_from_one_house_state(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    """Data of version 1.1 had one house state and no zones."""
    data = config_to_dict(two_rooms())
    del data["zones"]
    data["house"] = {"mode": "away", "vacation": None}
    for room in data["rooms"]:
        del room["zone_id"]
    hass_storage[f"{DOMAIN}.config"] = {
        "version": 1,
        "minor_version": 1,
        "key": f"{DOMAIN}.config",
        "data": data,
    }
    hass_storage[f"{DOMAIN}.state"] = {
        "version": 1,
        "minor_version": 1,
        "key": f"{DOMAIN}.state",
        "data": {"overrides": {}, "house_mode": "away"},
    }
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert engine.config.zones == {"house": Zone("house", "House", HouseState(HouseMode.AWAY))}
    assert {room.zone_id for room in engine.config.rooms.values()} == {"house"}
    assert engine.state.house_modes == {"house": HouseMode.AWAY}
    assert engine.targets["living"].source is Source.HOUSE_AWAY
