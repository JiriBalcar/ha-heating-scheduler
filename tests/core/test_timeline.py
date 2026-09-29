"""Tests for local-time to UTC mapping and plan timelines, including DST."""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.heating_scheduler.core.model import Mode, Plan
from custom_components.heating_scheduler.core.timeline import (
    PlanTimeline,
    ensure_aware,
    local_to_utc,
    plan_boundaries,
)
from tests.builders import PRAGUE, STANDARD, prague, slots, uniform, utc, week


def test_regular_summer_and_winter_times() -> None:
    assert local_to_utc(date(2026, 9, 29), time(6, 0), PRAGUE) == utc(2026, 9, 29, 4, 0)
    assert local_to_utc(date(2026, 12, 1), time(6, 0), PRAGUE) == utc(2026, 12, 1, 5, 0)


def test_ambiguous_time_maps_to_first_occurrence() -> None:
    # 2026-10-25: 02:30 happens at 00:30Z (CEST) and again at 01:30Z (CET).
    assert local_to_utc(date(2026, 10, 25), time(2, 30), PRAGUE) == utc(2026, 10, 25, 0, 30)
    assert local_to_utc(date(2026, 10, 25), time(3, 0), PRAGUE) == utc(2026, 10, 25, 2, 0)


def test_nonexistent_time_maps_to_end_of_gap() -> None:
    # 2027-03-28: clocks jump from 02:00 CET to 03:00 CEST at 01:00Z.
    assert local_to_utc(date(2027, 3, 28), time(1, 59), PRAGUE) == utc(2027, 3, 28, 0, 59)
    assert local_to_utc(date(2027, 3, 28), time(2, 0), PRAGUE) == utc(2027, 3, 28, 1, 0)
    assert local_to_utc(date(2027, 3, 28), time(2, 30), PRAGUE) == utc(2027, 3, 28, 1, 0)
    assert local_to_utc(date(2027, 3, 28), time(3, 0), PRAGUE) == utc(2027, 3, 28, 1, 0)
    assert local_to_utc(date(2027, 3, 28), time(3, 1), PRAGUE) == utc(2027, 3, 28, 1, 1)


def test_half_hour_dst_gap() -> None:
    lord_howe = ZoneInfo("Australia/Lord_Howe")
    # 2026-10-04: clocks jump from 02:00 to 02:30 local.
    gap_end = local_to_utc(date(2026, 10, 4), time(2, 0), lord_howe)
    assert local_to_utc(date(2026, 10, 4), time(2, 15), lord_howe) == gap_end
    assert gap_end.astimezone(lord_howe).time() == time(2, 30)


def test_ensure_aware_rejects_naive() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        ensure_aware(datetime(2026, 1, 1))
    assert ensure_aware(utc(2026, 1, 1)) == utc(2026, 1, 1)


def test_mode_at_and_next_change() -> None:
    timeline = PlanTimeline(STANDARD, PRAGUE, prague(2026, 10, 5, 12))
    assert timeline.mode_at(prague(2026, 10, 5, 5, 59)) is Mode.NIGHT
    assert timeline.mode_at(prague(2026, 10, 5, 6, 0)) is Mode.COMFORT
    assert timeline.mode_at(prague(2026, 10, 5, 21, 59)) is Mode.COMFORT
    assert timeline.mode_at(prague(2026, 10, 5, 22, 0)) is Mode.NIGHT
    # The 00:00 night slot merges with the previous night: the next change is 06:00.
    assert timeline.next_change(prague(2026, 10, 5, 23, 0)) == prague(2026, 10, 6, 6, 0)


def test_day_wraps_into_next_day_until_its_first_slot() -> None:
    # Tuesday has no 00:00 slot: Monday's 22:00 night continues until Tuesday 07:00.
    # Wednesday has no slots: Tuesday's last slot continues through Wednesday.
    plan = week(
        slots(("00:00", Mode.NIGHT), ("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT)),
        slots(("07:00", Mode.COMFORT), ("20:00", Mode.ECO)),
        (),
        slots(("00:00", Mode.NIGHT)),
        slots(("00:00", Mode.NIGHT)),
        slots(("00:00", Mode.NIGHT)),
        slots(("00:00", Mode.NIGHT)),
    )
    timeline = PlanTimeline(plan, PRAGUE, prague(2026, 10, 6, 3))
    assert timeline.mode_at(prague(2026, 10, 6, 3)) is Mode.NIGHT
    assert timeline.mode_at(prague(2026, 10, 6, 7)) is Mode.COMFORT
    assert timeline.mode_at(prague(2026, 10, 7, 12)) is Mode.ECO
    assert timeline.next_change(prague(2026, 10, 6, 21)) == prague(2026, 10, 8, 0, 0)


def test_constant_plan_has_no_change() -> None:
    timeline = PlanTimeline(uniform(("00:00", Mode.ECO)), PRAGUE, utc(2026, 10, 5))
    assert timeline.next_change(utc(2026, 10, 5)) is None
    assert timeline.changes_between(utc(2026, 10, 5), utc(2026, 10, 12)) == []


def test_outside_window_raises() -> None:
    timeline = PlanTimeline(STANDARD, PRAGUE, utc(2026, 10, 5))
    with pytest.raises(ValueError, match="outside"):
        timeline.mode_at(utc(2026, 11, 5))


def test_empty_plan_raises() -> None:
    empty = Plan(id="house", name="x", days=((),) * 7)
    with pytest.raises(ValueError, match="no slots"):
        PlanTimeline(empty, PRAGUE, utc(2026, 10, 5))


DST_PLAN = uniform(("00:00", Mode.NIGHT), ("02:30", Mode.COMFORT), ("05:00", Mode.ECO))


def test_spring_forward_slot_in_gap_starts_at_gap_end() -> None:
    timeline = PlanTimeline(DST_PLAN, PRAGUE, utc(2027, 3, 28))
    # 02:30 does not exist on 2027-03-28; the slot starts at 03:00 CEST (01:00Z).
    assert timeline.next_change(utc(2027, 3, 27, 23, 30)) == utc(2027, 3, 28, 1, 0)
    assert timeline.mode_at(utc(2027, 3, 28, 0, 59)) is Mode.NIGHT
    assert timeline.mode_at(utc(2027, 3, 28, 1, 0)) is Mode.COMFORT
    # 05:00 CEST = 03:00Z.
    assert timeline.next_change(utc(2027, 3, 28, 1, 0)) == utc(2027, 3, 28, 3, 0)


def test_fall_back_slot_in_fold_starts_once() -> None:
    timeline = PlanTimeline(DST_PLAN, PRAGUE, utc(2026, 10, 25))
    # The first 02:30 (CEST) is 00:30Z. During the second 02:00-03:00 (CET), comfort stays.
    assert timeline.mode_at(utc(2026, 10, 25, 0, 29)) is Mode.NIGHT
    assert timeline.mode_at(utc(2026, 10, 25, 0, 30)) is Mode.COMFORT
    assert timeline.mode_at(utc(2026, 10, 25, 1, 15)) is Mode.COMFORT  # 02:15 CET
    assert timeline.mode_at(utc(2026, 10, 25, 1, 45)) is Mode.COMFORT  # 02:45 CET
    changes = timeline.changes_between(utc(2026, 10, 24, 22), utc(2026, 10, 25, 22))
    # night->comfort at 00:30Z, comfort->eco at 05:00 CET (04:00Z), eco->night at 23:00Z.
    assert changes == [utc(2026, 10, 25, 0, 30), utc(2026, 10, 25, 4, 0)]


def test_slots_collapsing_in_gap_keep_the_last_one() -> None:
    plan = uniform(("00:00", Mode.NIGHT), ("02:15", Mode.ECO), ("02:45", Mode.COMFORT))
    timeline = PlanTimeline(plan, PRAGUE, utc(2027, 3, 28))
    # Both slots map to 01:00Z; the later one (comfort) wins, eco never becomes active.
    assert timeline.mode_at(utc(2027, 3, 28, 1, 0)) is Mode.COMFORT
    assert timeline.changes_between(utc(2027, 3, 27, 23), utc(2027, 3, 28, 12)) == [
        utc(2027, 3, 28, 1, 0)
    ]


@pytest.mark.parametrize(
    ("monday", "hours"),
    [
        (date(2026, 10, 5), 168),
        (date(2026, 10, 19), 169),  # contains 2026-10-25 (fall back)
        (date(2027, 3, 22), 167),  # contains 2027-03-28 (spring forward)
    ],
)
def test_week_length_and_one_start_per_day(monday: date, hours: int) -> None:
    start = local_to_utc(monday, time(0), PRAGUE)
    end = local_to_utc(monday + timedelta(days=7), time(0), PRAGUE)
    assert end - start == timedelta(hours=hours)
    timeline = PlanTimeline(DST_PLAN, PRAGUE, start + timedelta(days=3))
    changes = timeline.changes_between(start - timedelta(seconds=1), end - timedelta(seconds=1))
    comfort_starts = [at for at in changes if timeline.mode_at(at) is Mode.COMFORT]
    # Every day starts comfort exactly once: no skipped and no doubled slot.
    assert len(comfort_starts) == 7
    assert len({at.astimezone(PRAGUE).date() for at in comfort_starts}) == 7


def test_boundaries_are_sorted_and_utc() -> None:
    boundaries = plan_boundaries(DST_PLAN, date(2027, 3, 27), date(2027, 3, 29), PRAGUE)
    instants = [boundary.at for boundary in boundaries]
    assert instants == sorted(instants)
    assert all(instant.tzinfo is UTC for instant in instants)
