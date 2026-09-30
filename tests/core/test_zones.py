"""Zones: parts of the house with their own house mode and holiday."""

from __future__ import annotations

from dataclasses import replace

import pytest

from custom_components.heating_scheduler.core.config_ops import (
    delete_zone,
    put_zone,
    put_zone_house,
    reorder_zones,
    rooms_in_zone,
)
from custom_components.heating_scheduler.core.model import (
    Config,
    HouseMode,
    HouseState,
    Mode,
    Room,
    RuntimeState,
    Vacation,
    Zone,
)
from custom_components.heating_scheduler.core.schedule_ops import default_config
from custom_components.heating_scheduler.core.serde import (
    config_from_dict,
    config_to_dict,
    state_from_dict,
    state_to_dict,
)
from custom_components.heating_scheduler.core.validation import ValidationError, validate_config
from tests.builders import utc


def two_floors() -> Config:
    """Two zones: the living room downstairs, the bedroom upstairs."""
    config = default_config(zone_name="Downstairs")
    config = put_zone(config, Zone("upstairs", "Upstairs"))
    return replace(
        config,
        rooms={
            "living": Room("living", "Living room", ("climate.living",)),
            "bed": Room("bed", "Bedroom", ("climate.bed",), zone_id="upstairs"),
        },
    )


def code_of(action: object) -> str:
    with pytest.raises(ValidationError) as info:
        action()  # type: ignore[operator]
    return info.value.code


def test_default_config_has_one_zone() -> None:
    config = default_config(zone_name="Dům")
    assert list(config.zones) == ["house"]
    assert config.zones["house"].name == "Dům"
    assert config.zones["house"].house == HouseState()


def test_rooms_follow_their_zone() -> None:
    config = two_floors()
    validate_config(config)
    assert rooms_in_zone(config, "house") == ["living"]
    assert rooms_in_zone(config, "upstairs") == ["bed"]
    assert config.zone_of(config.rooms["bed"]).name == "Upstairs"


def test_delete_zone_moves_its_rooms_to_the_first_zone() -> None:
    config = delete_zone(two_floors(), "upstairs")
    assert list(config.zones) == ["house"]
    assert config.rooms["bed"].zone_id == "house"
    validate_config(config)
    assert code_of(lambda: delete_zone(config, "house")) == "last_zone"
    assert code_of(lambda: delete_zone(config, "nope")) == "not_found"


def test_reorder_zones() -> None:
    config = reorder_zones(two_floors(), ["upstairs", "house"])
    assert list(config.zones) == ["upstairs", "house"]
    assert code_of(lambda: reorder_zones(config, ["house"])) == "invalid_order"


def test_zone_house_state() -> None:
    house = HouseState(HouseMode.AWAY, Vacation(utc(2026, 10, 10), None, Mode.FROST))
    config = put_zone_house(two_floors(), "upstairs", house)
    assert config.zones["upstairs"].house == house
    assert config.zones["house"].house == HouseState()
    assert code_of(lambda: put_zone_house(config, "nope", house)) == "not_found"


def test_validation_of_zones() -> None:
    config = two_floors()
    moved = replace(
        config, rooms={**config.rooms, "bed": replace(config.rooms["bed"], zone_id="x")}
    )
    assert code_of(lambda: validate_config(moved)) == "unknown_zone"
    twins = put_zone(config, Zone("attic", "upstairs"))
    assert code_of(lambda: validate_config(twins)) == "duplicate_name"
    assert code_of(lambda: validate_config(replace(config, zones={}))) == "zones_missing"
    bad_id = put_zone(config, Zone("Bad Id", "Attic"))
    assert code_of(lambda: validate_config(bad_id)) == "invalid_id"
    unnamed = put_zone(config, Zone("attic", " "))
    assert code_of(lambda: validate_config(unnamed)) == "name_required"
    selected_vacation = put_zone_house(config, "upstairs", HouseState(HouseMode.VACATION))
    assert code_of(lambda: validate_config(selected_vacation)) == "house_mode"


def test_zones_round_trip() -> None:
    house = HouseState(HouseMode.OFF, Vacation(utc(2026, 10, 10), utc(2026, 10, 20), Mode.AWAY))
    config = put_zone_house(two_floors(), "upstairs", house)
    assert config_from_dict(config_to_dict(config)) == config
    state = RuntimeState({}, {"house": HouseMode.AUTO, "upstairs": HouseMode.OFF})
    assert state_from_dict(state_to_dict(state)) == state
    # An unknown mode in stored runtime state is dropped, not fatal.
    assert state_from_dict({"overrides": {}, "house_modes": {"house": "party"}}) == RuntimeState()
