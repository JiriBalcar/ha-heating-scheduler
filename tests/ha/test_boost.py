"""Boost: every room at its valves' maximum for a while, then the plans again."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.heating_scheduler.const import DOMAIN
from custom_components.heating_scheduler.core.model import HouseMode, RuntimeState, Source
from custom_components.heating_scheduler.core.validation import ValidationError

from .conftest import (
    TRV_IDS,
    FakeClimate,
    FakeTrv,
    advance,
    engine_of,
    settle,
    setup_entry,
    store,
    two_rooms,
)
from .test_entities import call
from .test_websocket import Ws
from .test_zones import state_of, two_zones

BOOST = "switch.heating_boost"
THERMOSTAT = "climate.living_room"
BEDROOM = "climate.bedroom"


def zone_switch(hass: HomeAssistant, zone_id: str) -> str:
    entity_id = er.async_get(hass).async_get_entity_id("switch", DOMAIN, f"zone_{zone_id}_boost")
    assert entity_id is not None
    return entity_id


async def trvs_with_one_lower_maximum(climate: FakeClimate) -> dict[str, FakeTrv]:
    """The TRVs of `two_rooms()`; the second living room TRV goes only up to 30 °C."""
    return {
        entity_id: await climate.add(
            entity_id, setpoint=18.0, max_temp=30.0 if entity_id.endswith("_2") else 35.0
        )
        for entity_id in TRV_IDS
    }


async def test_boost_heats_each_valve_at_its_maximum_then_the_plan_resumes(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    trvs = await trvs_with_one_lower_maximum(climate)
    store(hass_storage, two_rooms())
    engine = engine_of(await setup_entry(hass))
    await hass.services.async_call("switch", "turn_on", {"entity_id": BOOST}, blocking=True)
    await settle(hass)

    switch = state_of(hass, BOOST)
    assert switch.state == "on"
    assert switch.attributes["duration_minutes"] == 60
    assert engine.targets["living"].source is Source.BOOST
    assert engine.targets["living"].temperature == 35.0
    assert trvs["climate.living_trv_1"].setpoint == 35.0
    assert trvs["climate.living_trv_2"].setpoint == 30.0  # its own maximum
    assert trvs["climate.bedroom_trv"].setpoint == 35.0
    thermostat = state_of(hass, THERMOSTAT)
    assert thermostat.state == "heat"
    assert thermostat.attributes["preset_mode"] == "boost"

    # A knob turn during the boost is undone; changes from the app are refused.
    trvs["climate.bedroom_trv"].knob(20.0)
    await settle(hass)
    assert trvs["climate.bedroom_trv"].setpoint == 35.0
    assert "bedroom" not in engine.state.overrides
    with pytest.raises(ValidationError) as err:
        await engine.async_set_override("living", 22.0)
    assert err.value.code == "boost_active"

    # After the boost length, the plans again (warm 21 °C at noon).
    await advance(hass, freezer, 61 * 60, steps=4)
    assert state_of(hass, BOOST).state == "off"
    assert engine.targets["living"].source is Source.PLAN
    assert all(trv.setpoint == 21.0 for trv in trvs.values())
    assert state_of(hass, THERMOSTAT).attributes["preset_mode"] == "comfort"


async def test_boost_ends_away_holiday_and_off_and_leaving_ends_the_boost(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> None:
    store(hass_storage, two_zones())
    engine = engine_of(await setup_entry(hass))
    await engine.async_set_house_mode(HouseMode.OFF, ["house"])
    await engine.async_set_vacation(None, dt_util.utcnow() + timedelta(days=3), None, ["upstairs"])
    await settle(hass)
    ws = Ws(await hass_ws_client(hass))
    await ws.ok("boost/start")
    await settle(hass)
    assert engine.house_mode() is HouseMode.AUTO
    assert all(zone.house.vacation is None for zone in engine.config.zones.values())
    await ws.ok("subscribe")
    snapshot = await ws.event()
    assert snapshot["boost_until"] is not None
    assert engine.targets["bedroom"].source is Source.BOOST

    # Choosing Away during a boost ends the boost.
    await engine.async_set_house_mode(HouseMode.AWAY)
    await settle(hass)
    assert engine.boost_until is None
    assert engine.targets["living"].source is Source.HOUSE_AWAY
    assert standard_trvs["climate.living_trv_1"].setpoint == 16.0

    # The switch and the websocket stop a boost.
    await engine.async_set_house_mode(HouseMode.AUTO)
    await ws.ok("boost/start")
    await ws.ok("boost/stop")
    await settle(hass)
    assert engine.boost_until is None
    await hass.services.async_call("switch", "turn_on", {"entity_id": BOOST}, blocking=True)
    await hass.services.async_call("switch", "turn_off", {"entity_id": BOOST}, blocking=True)
    await settle(hass)
    assert engine.boost_until is None
    assert engine.targets["living"].source is Source.PLAN


async def test_a_planned_holiday_that_starts_during_a_boost_ends_it(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    engine = engine_of(await setup_entry(hass))
    await engine.async_set_vacation(dt_util.utcnow() + timedelta(minutes=20), None, None)
    await engine.async_start_boost()
    await settle(hass)
    assert engine.targets["living"].source is Source.BOOST
    assert engine.config.zones["house"].house.vacation is not None  # still planned

    await advance(hass, freezer, 20 * 60 + 1)
    assert engine.boost_until is None
    assert state_of(hass, BOOST).state == "off"
    assert engine.targets["living"].source is Source.VACATION
    assert all(trv.setpoint == 7.0 for trv in standard_trvs.values())


async def test_boost_service_takes_a_length_within_limits(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    engine = engine_of(await setup_entry(hass))
    await hass.services.async_call(DOMAIN, "boost", {"duration": "00:30:00"}, blocking=True)
    assert engine.boost_until == dt_util.utcnow() + timedelta(minutes=30)
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(DOMAIN, "boost", {"duration": "00:05:00"}, blocking=True)
    assert err.value.translation_key == "boost_duration"


async def test_boost_survives_a_restart_until_its_end(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    until = dt_util.utcnow() + timedelta(minutes=20)
    store(hass_storage, two_rooms(), RuntimeState(boost_until=until))
    engine = engine_of(await setup_entry(hass))
    assert engine.boost_until == until
    assert standard_trvs["climate.living_trv_1"].setpoint == 35.0


async def test_a_boost_that_ended_while_stopped_is_dropped(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(
        hass_storage, two_rooms(), RuntimeState(boost_until=dt_util.utcnow() - timedelta(minutes=1))
    )
    engine = engine_of(await setup_entry(hass))
    assert engine.boost_until is None
    assert engine.state.boost_until is None
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0


async def test_a_zone_boosts_only_its_rooms_and_leaves_away_first(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_zones())
    engine = engine_of(await setup_entry(hass))
    await engine.async_set_house_mode(HouseMode.AWAY, ["upstairs"])
    await settle(hass)
    upstairs = zone_switch(hass, "upstairs")
    await call(hass, "switch", "turn_on", {"entity_id": upstairs})

    assert engine.config.zones["upstairs"].house.mode is HouseMode.AUTO
    assert standard_trvs["climate.bedroom_trv"].setpoint == 35.0
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0  # the other zone: its plan
    assert state_of(hass, upstairs).state == "on"
    assert state_of(hass, BOOST).state == "off"  # the house's own boost is separate
    await call(hass, "switch", "turn_off", {"entity_id": upstairs})
    assert standard_trvs["climate.bedroom_trv"].setpoint == 21.0

    # The action takes a zone by name.
    await call(hass, DOMAIN, "boost", {"zone": "upstairs"})
    assert engine.zone_boost_until("upstairs") is not None
    assert engine.boost_until is None


async def test_a_room_boosts_through_its_thermostat_preset(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_zones())
    engine = engine_of(await setup_entry(hass))
    await call(hass, "climate", "set_preset_mode", {"entity_id": BEDROOM, "preset_mode": "boost"})
    assert standard_trvs["climate.bedroom_trv"].setpoint == 35.0
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0
    assert state_of(hass, BEDROOM).attributes["preset_mode"] == "boost"

    # Another preset replaces the room's boost; back to the plan ends it too.
    await call(hass, "climate", "set_preset_mode", {"entity_id": BEDROOM, "preset_mode": "eco"})
    assert engine.room_boost_until("bedroom") is None
    assert standard_trvs["climate.bedroom_trv"].setpoint == 19.0
    await call(hass, "climate", "set_preset_mode", {"entity_id": BEDROOM, "preset_mode": "boost"})
    await call(hass, "climate", "set_hvac_mode", {"entity_id": BEDROOM, "hvac_mode": "auto"})
    assert engine.room_boost_until("bedroom") is None
    assert standard_trvs["climate.bedroom_trv"].setpoint == 21.0

    # Only in Normal, like a manual change.
    await engine.async_set_house_mode(HouseMode.AWAY, ["upstairs"])
    await settle(hass)
    with pytest.raises(ServiceValidationError) as err:
        await call(
            hass, "climate", "set_preset_mode", {"entity_id": BEDROOM, "preset_mode": "boost"}
        )
    assert err.value.translation_key == "house_mode_active"


async def test_boosts_of_the_house_zones_and_rooms_are_each_on_their_own(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_zones())
    engine = engine_of(await setup_entry(hass))
    await call(hass, "climate", "set_preset_mode", {"entity_id": BEDROOM, "preset_mode": "boost"})
    await call(hass, "switch", "turn_on", {"entity_id": BOOST})
    await call(hass, "switch", "turn_off", {"entity_id": BOOST})
    assert standard_trvs["climate.bedroom_trv"].setpoint == 35.0  # its own boost goes on
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0

    # A room under the house's boost takes no changes; its knob is undone.
    await call(hass, "switch", "turn_on", {"entity_id": BOOST})
    with pytest.raises(ServiceValidationError) as err:
        await call(hass, "climate", "set_temperature", {"entity_id": THERMOSTAT, "temperature": 22})
    assert err.value.translation_key == "boost_active"
    standard_trvs["climate.living_trv_1"].knob(20.0)
    await settle(hass)
    assert standard_trvs["climate.living_trv_1"].setpoint == 35.0

    # A zone leaving Normal ends its own boosts; the house's boost goes on in the other zone
    # and ends once no zone is Normal.
    await call(hass, "switch", "turn_on", {"entity_id": zone_switch(hass, "upstairs")})
    await engine.async_set_house_mode(HouseMode.AWAY, ["upstairs"])
    await settle(hass)
    assert engine.zone_boost_until("upstairs") is None
    assert engine.room_boost_until("bedroom") is None
    assert engine.boost_until is not None
    assert standard_trvs["climate.bedroom_trv"].setpoint == 16.0
    assert standard_trvs["climate.living_trv_1"].setpoint == 35.0
    await engine.async_set_house_mode(HouseMode.AWAY, ["house"])
    await settle(hass)
    assert engine.boost_until is None


async def test_zone_and_room_boosts_survive_a_restart_until_their_end(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    now = dt_util.utcnow()
    until = now + timedelta(minutes=20)
    ended = now - timedelta(minutes=1)
    state = RuntimeState(
        zone_boosts={"upstairs": until, "house": ended},
        room_boosts={"living": until, "gone": until},
    )
    store(hass_storage, two_zones(), state)
    engine = engine_of(await setup_entry(hass))
    assert engine.state.zone_boosts == {"upstairs": until}
    assert engine.state.room_boosts == {"living": until}
    assert all(trv.setpoint == 35.0 for trv in standard_trvs.values())
