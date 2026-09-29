"""Tests for pure configuration operations."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import replace
from datetime import timedelta

import pytest

from custom_components.heating_scheduler.core.config_ops import (
    delete_plan,
    delete_room,
    delete_temp_set,
    put_house,
    put_plan,
    put_room,
    put_settings,
    put_temp_set,
    reorder_rooms,
    rooms_using_plan,
    rooms_using_temp_set,
)
from custom_components.heating_scheduler.core.model import (
    HOUSE_ID,
    Config,
    HouseMode,
    HouseState,
    Mode,
    Room,
    Settings,
    TempSet,
)
from custom_components.heating_scheduler.core.schedule_ops import default_config
from custom_components.heating_scheduler.core.validation import ValidationError, validate_config
from tests.builders import uniform

BEDROOMS = uniform(("00:00", Mode.NIGHT), ("07:00", Mode.ECO), plan_id="bedrooms", name="Beds")
KIDS = TempSet("kids", "Kids", {Mode.COMFORT: 22.0})


def config_with_rooms() -> Config:
    config = put_temp_set(put_plan(default_config(), BEDROOMS), KIDS)
    config = put_room(config, Room("a", "Bedroom", plan_id="bedrooms", temp_set_id="kids"))
    config = put_room(config, Room("b", "Kids room", plan_id="bedrooms"))
    return put_room(config, Room("c", "Living room"))


def test_usage_lists() -> None:
    config = config_with_rooms()
    assert rooms_using_plan(config, "bedrooms") == ["a", "b"]
    assert rooms_using_plan(config, HOUSE_ID) == ["c"]
    assert rooms_using_temp_set(config, "kids") == ["a"]


def test_put_room_replaces_in_place() -> None:
    config = config_with_rooms()
    renamed = put_room(config, replace(config.rooms["a"], name="Master bedroom"))
    assert list(renamed.rooms) == ["a", "b", "c"]
    assert renamed.rooms["a"].name == "Master bedroom"


def test_delete_and_reorder_rooms() -> None:
    config = config_with_rooms()
    assert list(delete_room(config, "b").rooms) == ["a", "c"]
    assert list(reorder_rooms(config, ["c", "a", "b"]).rooms) == ["c", "a", "b"]
    for order in (["a", "b"], ["a", "b", "b"], ["a", "b", "x"]):
        with pytest.raises(ValidationError) as info:
            reorder_rooms(config, order)
        assert info.value.code == "invalid_order"
    with pytest.raises(ValidationError) as info:
        delete_room(config, "x")
    assert info.value.code == "not_found"


def test_delete_shared_plan_moves_rooms_to_house_plan() -> None:
    config = delete_plan(config_with_rooms(), "bedrooms")
    assert "bedrooms" not in config.plans
    assert config.rooms["a"].plan_id == HOUSE_ID
    assert config.rooms["b"].plan_id == HOUSE_ID
    validate_config(config)


def test_delete_temp_set_moves_rooms_to_house_temperatures() -> None:
    config = delete_temp_set(config_with_rooms(), "kids")
    assert config.rooms["a"].temp_set_id == HOUSE_ID
    validate_config(config)


@pytest.mark.parametrize(
    ("operation", "target", "code"),
    [
        (delete_plan, HOUSE_ID, "house_protected"),
        (delete_plan, "missing", "not_found"),
        (delete_temp_set, HOUSE_ID, "house_protected"),
        (delete_temp_set, "missing", "not_found"),
    ],
)
def test_protected_and_missing(
    operation: Callable[[Config, str], Config], target: str, code: str
) -> None:
    with pytest.raises(ValidationError) as info:
        operation(config_with_rooms(), target)
    assert info.value.code == code


def test_put_settings_and_house() -> None:
    config = config_with_rooms()
    settings = Settings(max_override=timedelta(hours=2))
    assert put_settings(config, settings).settings == settings
    house = HouseState(HouseMode.OFF)
    assert put_house(config, house).house == house
