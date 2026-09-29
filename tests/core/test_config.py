"""Tests for validation, plan operations, serialization and migrations."""

from __future__ import annotations

from dataclasses import replace
from datetime import time, timedelta
from typing import Any

import pytest

from custom_components.heating_scheduler.core.model import (
    HOUSE_ID,
    Config,
    HouseMode,
    HouseState,
    Mode,
    Override,
    OverrideOrigin,
    Plan,
    Room,
    Settings,
    Slot,
    TempSet,
    Vacation,
)
from custom_components.heating_scheduler.core.schedule_ops import (
    copy_day,
    default_config,
    new_id,
    normalize_day,
    same_every_workday,
    same_on_weekend,
)
from custom_components.heating_scheduler.core.serde import (
    CONFIG_VERSION,
    config_from_dict,
    config_to_dict,
    migrate_config,
    migrate_state,
    plan_from_dict,
    state_from_dict,
    state_to_dict,
    time_from_str,
)
from custom_components.heating_scheduler.core.validation import (
    ValidationError,
    validate_config,
    validate_house,
    validate_plan,
    validate_room,
    validate_settings,
    validate_temp_set,
)
from tests.builders import STANDARD, TEMPS, slots, uniform, utc


def full_config() -> Config:
    base = default_config()
    bedrooms = uniform(("00:00", Mode.NIGHT), ("07:00", Mode.ECO), plan_id="bedrooms", name="Bed")
    kids = TempSet("kids", "Kids", {Mode.COMFORT: 22.0})
    rooms = {
        "living": Room("living", "Living room", ("climate.living_1", "climate.living_2")),
        "bed": Room("bed", "Bedroom", ("climate.bed",), plan_id="bedrooms", temp_set_id="kids"),
    }
    return replace(
        base,
        rooms=rooms,
        plans={**base.plans, "bedrooms": bedrooms},
        temp_sets={**base.temp_sets, "kids": kids},
        house=HouseState(
            HouseMode.AWAY, Vacation(utc(2026, 10, 10), utc(2026, 10, 20), Mode.FROST)
        ),
        settings=Settings(max_override=timedelta(hours=3), dry_run=True),
        revision=7,
    )


def expect_error(code: str, check: Any, *args: Any, **kwargs: Any) -> None:
    with pytest.raises(ValidationError) as info:
        check(*args, **kwargs)
    assert info.value.code == code


def test_default_config_is_valid() -> None:
    config = default_config()
    validate_config(config)
    assert config.house_plan.id == HOUSE_ID
    assert config.house_temps.temperatures == TEMPS


def test_full_config_is_valid_and_round_trips() -> None:
    config = full_config()
    validate_config(config)
    assert config_from_dict(config_to_dict(config)) == config


def test_plan_rules() -> None:
    validate_plan(STANDARD)
    expect_error("plan_days", validate_plan, Plan("house", "x", STANDARD.days[:6]))
    unordered = (slots(("06:00", Mode.COMFORT), ("05:00", Mode.NIGHT)), *STANDARD.days[1:])
    expect_error("slot_order", validate_plan, Plan("house", "x", unordered))
    seconds = ((Slot(time(6, 0, 30), Mode.COMFORT),), *STANDARD.days[1:])
    expect_error("slot_time", validate_plan, Plan("house", "x", seconds))
    expect_error("plan_empty", validate_plan, Plan("house", "x", ((),) * 7))
    expect_error("name_required", validate_plan, Plan("house", "  ", STANDARD.days))
    expect_error("invalid_id", validate_plan, Plan("House!", "x", STANDARD.days))
    many = (
        *tuple(Slot(time(h, m), Mode.ECO) for h in range(24) for m in (0, 30)),
        Slot(time(23, 59), Mode.ECO),
    )
    expect_error("too_many_slots", validate_plan, Plan("house", "x", (many, *STANDARD.days[1:])))


def test_temp_set_rules() -> None:
    validate_temp_set(TempSet("kids", "Kids", {Mode.COMFORT: 22.0}), complete=False)
    expect_error(
        "temperatures_incomplete",
        validate_temp_set,
        TempSet(HOUSE_ID, "House", {Mode.COMFORT: 22.0}),
        complete=True,
    )
    expect_error(
        "temperature_range",
        validate_temp_set,
        TempSet("kids", "Kids", {Mode.COMFORT: 31.0}),
        complete=False,
    )
    expect_error(
        "mode_without_temperature",
        validate_temp_set,
        TempSet("kids", "Kids", {Mode.OFF: 10.0}),
        complete=False,
    )


def test_room_rules() -> None:
    validate_room(Room("r", "Room", ("climate.a",), temperature_entity="sensor.t"))
    expect_error("invalid_entity", validate_room, Room("r", "Room", ("light.a",)))
    expect_error("duplicate_trv", validate_room, Room("r", "Room", ("climate.a", "climate.a")))
    expect_error(
        "invalid_entity", validate_room, Room("r", "Room", (), temperature_entity="switch.t")
    )
    expect_error("name_too_long", validate_room, Room("r", "x" * 61))


def test_config_references_and_uniqueness() -> None:
    config = full_config()
    rooms = dict(config.rooms)
    rooms["bed"] = replace(rooms["bed"], plan_id="gone")
    expect_error("unknown_plan", validate_config, replace(config, rooms=rooms))
    rooms["bed"] = replace(config.rooms["bed"], temp_set_id="gone")
    expect_error("unknown_temp_set", validate_config, replace(config, rooms=rooms))
    rooms["bed"] = replace(config.rooms["bed"], trvs=("climate.living_1",))
    expect_error("trv_in_two_rooms", validate_config, replace(config, rooms=rooms))
    rooms["bed"] = replace(config.rooms["bed"], name="living ROOM")
    expect_error("duplicate_name", validate_config, replace(config, rooms=rooms))
    plans = {k: v for k, v in config.plans.items() if k != HOUSE_ID}
    expect_error("house_plan_missing", validate_config, replace(config, plans=plans))
    sets = {k: v for k, v in config.temp_sets.items() if k != HOUSE_ID}
    expect_error("house_temps_missing", validate_config, replace(config, temp_sets=sets))
    wrong_key = {**config.rooms, "other": config.rooms["bed"]}
    expect_error("id_mismatch", validate_config, replace(config, rooms=wrong_key))


def test_house_and_settings_rules() -> None:
    expect_error("house_mode", validate_house, HouseState(HouseMode.VACATION))
    backwards = Vacation(utc(2026, 10, 10), utc(2026, 10, 9), Mode.FROST)
    expect_error("vacation_order", validate_house, HouseState(vacation=backwards))
    comfort = Vacation(utc(2026, 10, 10), None, Mode.COMFORT)
    expect_error("vacation_mode", validate_house, HouseState(vacation=comfort))
    expect_error(
        "setting_range", validate_settings, Settings(safety_interval=timedelta(seconds=30))
    )
    expect_error("vacation_mode", validate_settings, Settings(vacation_mode=Mode.ECO))


def test_normalize_day() -> None:
    day = [
        Slot(time(22), Mode.NIGHT),
        Slot(time(6), Mode.ECO),
        Slot(time(6), Mode.COMFORT),  # same start: the last one wins
        Slot(time(8), Mode.COMFORT),  # same mode as its neighbour: merged
        Slot(time(0), Mode.NIGHT),
    ]
    assert normalize_day(day) == slots(
        ("00:00", Mode.NIGHT), ("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)
    )


def test_copy_day_and_templates() -> None:
    monday = slots(("00:00", Mode.NIGHT), ("05:30", Mode.COMFORT), ("21:00", Mode.NIGHT))
    plan = Plan("house", "House", (monday, *STANDARD.days[1:]))
    copied = copy_day(plan, 0, [2, 4])
    assert copied.days[2] == monday
    assert copied.days[4] == monday
    assert copied.days[1] == STANDARD.days[1]
    workdays = same_every_workday(plan, 0)
    assert all(workdays.days[i] == monday for i in range(5))
    assert workdays.days[5] == STANDARD.days[5]
    weekend = same_on_weekend(plan, 0)
    assert weekend.days[5] == weekend.days[6] == monday
    with pytest.raises(ValueError, match="invalid day"):
        copy_day(plan, 0, [7])


def test_new_id_is_unique() -> None:
    first = new_id("room", set())
    assert first.startswith("room_")
    assert new_id("room", {first}) != first


def test_parse_errors() -> None:
    assert time_from_str("06:30") == time(6, 30)
    for bad in ("6:30", "24:00", "06:60", 630):
        expect_error("invalid", time_from_str, bad)
    expect_error("invalid", plan_from_dict, {"id": "x", "name": "x"})
    expect_error("invalid", plan_from_dict, {"id": "x", "name": "x", "days": [["06:00"]]})
    data = config_to_dict(full_config())
    data["house"]["mode"] = "party"
    expect_error("invalid", config_from_dict, data)
    data = config_to_dict(full_config())
    data["revision"] = True
    expect_error("invalid", config_from_dict, data)
    data = config_to_dict(full_config())
    data["house"]["vacation"]["start"] = "2026-10-10T00:00:00"
    expect_error("naive_datetime", config_from_dict, data)
    data = config_to_dict(full_config())
    data["temp_sets"][1]["temperatures"]["comfort"] = float("inf")
    expect_error("invalid", config_from_dict, data)


def test_state_round_trip() -> None:
    overrides = {
        "living": Override(22.5, utc(2026, 10, 5, 18), utc(2026, 10, 5, 14), OverrideOrigin.USER),
        "bed": Override(
            None, utc(2026, 10, 5, 18), utc(2026, 10, 5, 14), OverrideOrigin.DEVICE, "climate.bed"
        ),
    }
    assert state_from_dict(state_to_dict(overrides)) == overrides


def test_migrations() -> None:
    data = config_to_dict(full_config())
    assert migrate_config(1, 1, data) == data
    assert migrate_state(1, 1, {"overrides": {}}) == {"overrides": {}}
    with pytest.raises(ValueError, match="newer"):
        migrate_config(CONFIG_VERSION + 1, 1, data)
    with pytest.raises(ValueError, match="newer"):
        migrate_state(2, 1, {})
