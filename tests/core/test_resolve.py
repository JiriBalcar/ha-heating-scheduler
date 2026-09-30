"""Tests for resolve(): precedence, wrap-around, vacation, overrides, DST."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from custom_components.heating_scheduler.core.model import (
    HOUSE_ID,
    HouseMode,
    HouseState,
    Mode,
    Override,
    OverrideOrigin,
    Room,
    RoomBoost,
    Source,
    Target,
    TargetMode,
    TempSet,
    Vacation,
)
from custom_components.heating_scheduler.core.resolve import (
    effective_temperatures,
    next_plan_change,
    resolve,
    room_inputs,
)
from tests.builders import PRAGUE, STANDARD, TEMPS, prague, slots, uniform, utc, week

AUTO = HouseState()


def manual(temperature: float | None, until: datetime) -> Override:
    return Override(
        temperature=temperature,
        until=until,
        created=until - timedelta(hours=1),
        origin=OverrideOrigin.USER,
    )


def test_plan_target_and_reason() -> None:
    target = resolve(prague(2026, 10, 5, 12), AUTO, STANDARD, TEMPS, None, PRAGUE)
    assert target.mode is TargetMode.COMFORT
    assert target.temperature == 21.0
    assert target.source is Source.PLAN
    assert target.valid_until == prague(2026, 10, 5, 22)
    assert target.reason.until == target.valid_until
    assert target.next == Target(TargetMode.NIGHT, 18.0, Source.PLAN)


def test_night_until_morning_across_midnight() -> None:
    target = resolve(prague(2026, 10, 5, 23), AUTO, STANDARD, TEMPS, None, PRAGUE)
    assert target.mode is TargetMode.NIGHT
    assert target.valid_until == prague(2026, 10, 6, 6)


def test_wrap_from_previous_day() -> None:
    plan = week(
        slots(("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)),
        slots(("07:00", Mode.COMFORT), ("20:00", Mode.ECO)),
        slots(("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)),
        slots(("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)),
        slots(("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)),
        slots(("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)),
        slots(("08:00", Mode.COMFORT), ("23:00", Mode.OFF)),
    )
    # Tuesday 05:00 still belongs to Monday 22:00 night.
    tuesday = resolve(prague(2026, 10, 6, 5), AUTO, plan, TEMPS, None, PRAGUE)
    assert (tuesday.mode, tuesday.valid_until) == (TargetMode.NIGHT, prague(2026, 10, 6, 7))
    # Wednesday 03:00 belongs to Tuesday 20:00 eco.
    wednesday = resolve(prague(2026, 10, 7, 3), AUTO, plan, TEMPS, None, PRAGUE)
    assert (wednesday.mode, wednesday.valid_until) == (TargetMode.ECO, prague(2026, 10, 7, 6))
    # Monday 05:00 belongs to Sunday 23:00 off.
    monday = resolve(prague(2026, 10, 12, 5), AUTO, plan, TEMPS, None, PRAGUE)
    assert monday.mode is TargetMode.OFF
    assert monday.temperature is None


def test_constant_plan_never_changes() -> None:
    target = resolve(utc(2026, 10, 5), AUTO, uniform(("00:00", Mode.ECO)), TEMPS, None, PRAGUE)
    assert target.mode is TargetMode.ECO
    assert target.valid_until is None
    assert target.next is None


def test_house_off_away_and_vacation() -> None:
    now = prague(2026, 10, 5, 12)
    off = resolve(now, HouseState(HouseMode.OFF), STANDARD, TEMPS, None, PRAGUE)
    assert (off.mode, off.temperature, off.source) == (TargetMode.OFF, None, Source.HOUSE_OFF)
    away = resolve(now, HouseState(HouseMode.AWAY), STANDARD, TEMPS, None, PRAGUE)
    assert (away.mode, away.temperature, away.source) == (
        TargetMode.AWAY,
        16.0,
        Source.HOUSE_AWAY,
    )
    assert away.valid_until is None
    frost = HouseState(vacation=Vacation(now - timedelta(days=1), None, Mode.FROST))
    holiday = resolve(now, frost, STANDARD, TEMPS, None, PRAGUE)
    assert (holiday.mode, holiday.temperature, holiday.source) == (
        TargetMode.FROST,
        7.0,
        Source.VACATION,
    )
    assert holiday.valid_until is None
    away_vacation = HouseState(vacation=Vacation(now, None, Mode.AWAY))
    assert resolve(now, away_vacation, STANDARD, TEMPS, None, PRAGUE).temperature == 16.0


@pytest.mark.parametrize(
    "house",
    [
        HouseState(HouseMode.OFF),
        HouseState(HouseMode.AWAY),
        HouseState(vacation=Vacation(utc(2026, 10, 1), None, Mode.FROST)),
    ],
)
def test_house_mode_beats_manual_change(house: HouseState) -> None:
    now = prague(2026, 10, 5, 12)
    target = resolve(now, house, STANDARD, TEMPS, manual(25.0, now + timedelta(hours=2)), PRAGUE)
    assert target.mode is not TargetMode.MANUAL
    assert target.source is not Source.MANUAL


def test_boost_beats_manual_change_and_plan_and_ends() -> None:
    now = prague(2026, 10, 5, 12)
    boost = RoomBoost(prague(2026, 10, 5, 13), 35.0)
    override = manual(18.0, now + timedelta(hours=2))
    target = resolve(now, AUTO, STANDARD, TEMPS, override, PRAGUE, boost)
    assert (target.mode, target.temperature, target.source) == (
        TargetMode.BOOST,
        35.0,
        Source.BOOST,
    )
    assert target.valid_until == prague(2026, 10, 5, 13)
    after = resolve(boost.until, AUTO, STANDARD, TEMPS, override, PRAGUE, boost)
    assert after.source is Source.MANUAL
    assert target.next == Target(after.mode, after.temperature, after.source)


def test_a_planned_holiday_that_starts_during_a_boost_wins() -> None:
    now = prague(2026, 10, 5, 12)
    start = prague(2026, 10, 5, 13)
    house = HouseState(vacation=Vacation(start, None, Mode.FROST))
    boost = RoomBoost(prague(2026, 10, 5, 14), 35.0)
    target = resolve(now, house, STANDARD, TEMPS, None, PRAGUE, boost)
    assert target.source is Source.BOOST
    assert target.valid_until == start
    assert target.next == Target(TargetMode.FROST, TEMPS[Mode.FROST], Source.VACATION)


def test_manual_change_beats_plan_and_ends() -> None:
    now = prague(2026, 10, 5, 12)
    override = manual(23.5, prague(2026, 10, 5, 14))
    target = resolve(now, AUTO, STANDARD, TEMPS, override, PRAGUE)
    assert (target.mode, target.temperature, target.source) == (
        TargetMode.MANUAL,
        23.5,
        Source.MANUAL,
    )
    assert target.valid_until == prague(2026, 10, 5, 14)
    assert target.next == Target(TargetMode.COMFORT, 21.0, Source.PLAN)
    expired = resolve(prague(2026, 10, 5, 14), AUTO, STANDARD, TEMPS, override, PRAGUE)
    assert expired.mode is TargetMode.COMFORT


def test_manual_off() -> None:
    now = prague(2026, 10, 5, 12)
    target = resolve(now, AUTO, STANDARD, TEMPS, manual(None, now + timedelta(hours=1)), PRAGUE)
    assert (target.mode, target.temperature) == (TargetMode.MANUAL, None)


def test_manual_change_with_same_temperature_still_ends() -> None:
    now = prague(2026, 10, 5, 12)
    override = manual(21.0, prague(2026, 10, 5, 13))
    target = resolve(now, AUTO, STANDARD, TEMPS, override, PRAGUE)
    assert target.valid_until == prague(2026, 10, 5, 13)
    assert target.next == Target(TargetMode.COMFORT, 21.0, Source.PLAN)


def test_planned_vacation_starts_later() -> None:
    now = prague(2026, 10, 5, 12)
    start = prague(2026, 10, 5, 15)
    house = HouseState(vacation=Vacation(start, prague(2026, 10, 12, 12), Mode.FROST))
    target = resolve(now, house, STANDARD, TEMPS, None, PRAGUE)
    assert target.mode is TargetMode.COMFORT
    assert target.valid_until == start
    assert target.next == Target(TargetMode.FROST, 7.0, Source.VACATION)


def test_vacation_ends_and_returns_to_selected_mode() -> None:
    end = prague(2026, 10, 12, 12)
    vacation = Vacation(prague(2026, 10, 5), end, Mode.FROST)
    during = resolve(
        prague(2026, 10, 10), HouseState(vacation=vacation), STANDARD, TEMPS, None, PRAGUE
    )
    assert during.source is Source.VACATION
    assert during.valid_until == end
    assert during.next == Target(TargetMode.COMFORT, 21.0, Source.PLAN)
    # The selected mode before the vacation was AWAY: the house returns to AWAY.
    away_after = resolve(
        prague(2026, 10, 10),
        HouseState(HouseMode.AWAY, vacation),
        STANDARD,
        TEMPS,
        None,
        PRAGUE,
    )
    assert away_after.next == Target(TargetMode.AWAY, 16.0, Source.HOUSE_AWAY)
    after = resolve(end, HouseState(vacation=vacation), STANDARD, TEMPS, None, PRAGUE)
    assert after.source is Source.PLAN


def test_vacation_to_same_temperature_is_still_a_change() -> None:
    vacation = Vacation(prague(2026, 10, 5), prague(2026, 10, 7), Mode.AWAY)
    target = resolve(
        prague(2026, 10, 6), HouseState(HouseMode.AWAY, vacation), STANDARD, TEMPS, None, PRAGUE
    )
    assert target.valid_until == prague(2026, 10, 7)
    assert target.next == Target(TargetMode.AWAY, 16.0, Source.HOUSE_AWAY)


def test_plan_off_has_no_temperature() -> None:
    target = resolve(utc(2026, 7, 1), AUTO, uniform(("00:00", Mode.OFF)), TEMPS, None, PRAGUE)
    assert (target.mode, target.temperature) == (TargetMode.OFF, None)


def test_naive_now_raises() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        resolve(datetime(2026, 10, 5, 12), AUTO, STANDARD, TEMPS, None, PRAGUE)


def test_next_plan_change_ignores_manual_change() -> None:
    now = prague(2026, 10, 5, 12)
    assert next_plan_change(now, AUTO, STANDARD, TEMPS, PRAGUE) == prague(2026, 10, 5, 22)


def test_temperature_sets_merge_over_house() -> None:
    house = TempSet(HOUSE_ID, "House", TEMPS)
    bathroom = TempSet("bath", "Bathroom", {Mode.COMFORT: 23.0})
    merged = effective_temperatures(house, bathroom)
    assert merged[Mode.COMFORT] == 23.0
    assert merged[Mode.NIGHT] == TEMPS[Mode.NIGHT]
    assert effective_temperatures(house, None) == TEMPS
    assert effective_temperatures(house, house) == TEMPS


def test_room_inputs_fall_back_to_house() -> None:
    house_set = TempSet(HOUSE_ID, "House", TEMPS)
    bedrooms = uniform(("00:00", Mode.NIGHT), ("07:00", Mode.ECO), plan_id="bedrooms", name="B")
    plans = {HOUSE_ID: STANDARD, "bedrooms": bedrooms}
    sets = {HOUSE_ID: house_set, "kids": TempSet("kids", "Kids", {Mode.ECO: 22.0})}
    shared = Room(id="r1", name="Bedroom", plan_id="bedrooms", temp_set_id="kids")
    plan, temps = room_inputs(shared, plans, sets)
    assert plan is bedrooms
    assert temps[Mode.ECO] == 22.0
    dangling = Room(id="r2", name="Kids", plan_id="gone", temp_set_id="gone")
    plan, temps = room_inputs(dangling, plans, sets)
    assert plan is STANDARD
    assert temps == TEMPS


def test_shared_plan_gives_same_targets_in_two_rooms() -> None:
    bedrooms = uniform(("00:00", Mode.NIGHT), ("07:00", Mode.ECO), plan_id="bedrooms", name="B")
    plans = {HOUSE_ID: STANDARD, "bedrooms": bedrooms}
    sets = {HOUSE_ID: TempSet(HOUSE_ID, "House", TEMPS)}
    now = prague(2026, 10, 5, 12)
    targets = []
    for room in (Room("a", "A", plan_id="bedrooms"), Room("b", "B", plan_id="bedrooms")):
        plan, temps = room_inputs(room, plans, sets)
        targets.append(resolve(now, AUTO, plan, temps, None, PRAGUE))
    assert targets[0] == targets[1]
    assert targets[0].mode is TargetMode.ECO


def test_dst_spring_forward_boundary_in_gap() -> None:
    plan = uniform(("00:00", Mode.NIGHT), ("02:30", Mode.COMFORT), ("08:00", Mode.ECO))
    target = resolve(utc(2027, 3, 27, 23, 30), AUTO, plan, TEMPS, None, PRAGUE)
    assert target.mode is TargetMode.NIGHT
    assert target.valid_until == utc(2027, 3, 28, 1, 0)  # 03:00 CEST


def test_dst_fall_back_second_pass_keeps_slot() -> None:
    plan = uniform(("00:00", Mode.NIGHT), ("02:30", Mode.COMFORT), ("08:00", Mode.ECO))
    # 02:15 CET (second pass) on 2026-10-25: the 02:30 slot already started at 00:30Z.
    target = resolve(utc(2026, 10, 25, 1, 15), AUTO, plan, TEMPS, None, PRAGUE)
    assert target.mode is TargetMode.COMFORT
    assert target.valid_until == utc(2026, 10, 25, 7, 0)  # 08:00 CET
