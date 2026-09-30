"""Frost guard and the modes each zone offers, in Home Assistant."""

from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.heating_scheduler.const import DOMAIN
from custom_components.heating_scheduler.core.config_ops import put_zone
from custom_components.heating_scheduler.core.model import Config, HouseMode

from .conftest import FakeTrv, advance, engine_of, settle, setup_entry, store
from .test_websocket import Ws
from .test_zones import state_of, two_zones, zone_select

HOUSE = "select.heating_house_mode"


def upstairs_without_away_and_holiday() -> Config:
    """Upstairs offers Normal, Frost guard and Off: Normal for Away, Frost guard on holiday."""
    config = two_zones()
    upstairs = replace(
        config.zones["upstairs"],
        modes=frozenset({HouseMode.AUTO, HouseMode.FROST, HouseMode.OFF}),
        replacements={HouseMode.AWAY: HouseMode.AUTO, HouseMode.VACATION: HouseMode.FROST},
    )
    return put_zone(config, upstairs)


async def test_the_whole_house_gives_each_zone_its_mode_or_its_replacement(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, upstairs_without_away_and_holiday())
    engine = engine_of(await setup_entry(hass))
    upstairs = zone_select(hass, "upstairs")
    assert upstairs is not None
    assert state_of(hass, upstairs).attributes["options"] == ["auto", "frost", "off"]

    await hass.services.async_call(
        "select", "select_option", {"entity_id": HOUSE, "option": "away"}, blocking=True
    )
    await settle(hass)
    assert engine.config.zones["house"].house.mode is HouseMode.AWAY
    assert engine.config.zones["upstairs"].house.mode is HouseMode.AUTO  # its replacement
    assert state_of(hass, HOUSE).state == "away"  # the whole house is Away, not mixed
    assert standard_trvs["climate.living_trv_1"].setpoint == 16.0
    assert standard_trvs["climate.bedroom_trv"].setpoint == 21.0

    # A holiday of the whole house: upstairs runs Frost guard for the holiday's dates.
    await engine.async_set_house_mode(HouseMode.AUTO)
    await engine.async_set_vacation(None, dt_util.utcnow() + timedelta(hours=3), None)
    await settle(hass)
    assert state_of(hass, HOUSE).state == "vacation"
    assert state_of(hass, upstairs).state == "frost"
    assert standard_trvs["climate.bedroom_trv"].setpoint == 7.0
    await advance(hass, freezer, 3 * 3600 + 60, steps=3)
    assert state_of(hass, upstairs).state == "auto"
    assert standard_trvs["climate.bedroom_trv"].setpoint == 21.0

    # The action for one zone gives it its replacement too.
    await hass.services.async_call(
        DOMAIN, "set_house_mode", {"mode": "away", "zone": "Upstairs"}, blocking=True
    )
    assert engine.config.zones["upstairs"].house.mode is HouseMode.AUTO


async def test_frost_guard_keeps_a_zone_at_its_frost_guard_temperature(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_zones())
    engine = engine_of(await setup_entry(hass))
    upstairs = zone_select(hass, "upstairs")
    assert upstairs is not None
    await hass.services.async_call(
        "select", "select_option", {"entity_id": upstairs, "option": "frost"}, blocking=True
    )
    await settle(hass)
    assert standard_trvs["climate.bedroom_trv"].setpoint == 7.0
    assert standard_trvs["climate.living_trv_1"].setpoint == 21.0
    assert state_of(hass, HOUSE).state == "mixed"
    assert state_of(hass, "climate.bedroom").attributes["status"] == "Upstairs: Frost guard"
    # A boost means someone is home: it ends Frost guard.
    await engine.async_start_boost()
    assert engine.config.zones["upstairs"].house.mode is HouseMode.AUTO


async def test_a_zone_that_stops_offering_its_mode_runs_the_replacement(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    hass_ws_client: WebSocketGenerator,
    standard_trvs: dict[str, FakeTrv],
) -> None:
    store(hass_storage, two_zones())
    engine = engine_of(await setup_entry(hass))
    await engine.async_set_house_mode(HouseMode.AWAY, ["upstairs"])
    ws = Ws(await hass_ws_client(hass))
    zone = {
        "id": "upstairs",
        "name": "Upstairs",
        "modes": ["auto", "vacation", "frost", "off"],
        "replacements": {"away": "frost"},
    }
    await ws.ok("zone/save", revision=engine.config.revision, zone=zone)
    await settle(hass)
    assert engine.config.zones["upstairs"].house.mode is HouseMode.FROST
    assert standard_trvs["climate.bedroom_trv"].setpoint == 7.0
    upstairs = zone_select(hass, "upstairs")
    assert upstairs is not None
    assert state_of(hass, upstairs).attributes["options"] == ["auto", "vacation", "frost", "off"]

    # Each mode a zone does not offer needs a replacement.
    incomplete = {**zone, "modes": ["auto"], "replacements": {"away": "auto"}}
    assert await ws.error("zone/save", revision=engine.config.revision, zone=incomplete) == (
        "zone_modes"
    )
