"""Resolve the target of a room at an instant.

Precedence (highest wins):
1. House mode OFF, VACATION or AWAY
2. A boost: every room at its valves' maximum for a while. A boost starts only when every
   zone is Normal, and choosing another mode ends it; a planned holiday that starts during a
   boost still wins.
3. Active manual change (override) of the room
4. The room's plan
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timedelta, tzinfo

from .model import (
    HOUSE_ID,
    HouseMode,
    HouseState,
    Mode,
    Override,
    Plan,
    Reason,
    Room,
    RoomBoost,
    RoomTarget,
    Source,
    Target,
    TargetMode,
    TempSet,
)
from .timeline import PlanTimeline, ensure_aware

# How far ahead `resolve()` looks for the next change.
HORIZON = timedelta(days=8)


def effective_temperatures(house_set: TempSet, room_set: TempSet | None) -> dict[Mode, float]:
    """Merge a room's temperature set over the house temperatures."""
    temperatures = dict(house_set.temperatures)
    if room_set is not None and room_set.id != house_set.id:
        temperatures.update(room_set.temperatures)
    return temperatures


def room_inputs(
    room: Room, plans: Mapping[str, Plan], temp_sets: Mapping[str, TempSet]
) -> tuple[Plan, dict[Mode, float]]:
    """Return the plan and effective temperatures of `room`.

    A missing plan or set falls back to the house plan or house temperatures.
    """
    plan = plans.get(room.plan_id) or plans[HOUSE_ID]
    temperatures = effective_temperatures(temp_sets[HOUSE_ID], temp_sets.get(room.temp_set_id))
    return plan, temperatures


def _target_at(
    at: datetime,
    house: HouseState,
    timeline: PlanTimeline,
    temperatures: Mapping[Mode, float],
    override: Override | None,
    boost: RoomBoost | None = None,
) -> Target:
    house_mode = house.effective_mode(at)
    if house_mode is HouseMode.OFF:
        return Target(TargetMode.OFF, None, Source.HOUSE_OFF)
    if house_mode is HouseMode.VACATION:
        assert house.vacation is not None
        mode = house.vacation.mode
        return Target(TargetMode(mode), temperatures[mode], Source.VACATION)
    if house_mode is HouseMode.AWAY:
        return Target(TargetMode.AWAY, temperatures[Mode.AWAY], Source.HOUSE_AWAY)
    if house_mode is HouseMode.FROST:
        return Target(TargetMode.FROST, temperatures[Mode.FROST], Source.HOUSE_FROST)
    if boost is not None and at < boost.until:
        return Target(TargetMode.BOOST, boost.temperature, Source.BOOST)
    if override is not None and at < override.until:
        return Target(TargetMode.MANUAL, override.temperature, Source.MANUAL)
    mode = timeline.mode_at(at)
    temperature = None if mode is Mode.OFF else temperatures[mode]
    return Target(TargetMode(mode), temperature, Source.PLAN)


def _candidates(
    now: datetime,
    house: HouseState,
    timeline: PlanTimeline,
    override: Override | None,
    boost: RoomBoost | None = None,
) -> list[datetime]:
    """Return every instant in (now, now + HORIZON] where the target can change."""
    end = now + HORIZON
    instants = set(timeline.changes_between(now, end))
    if override is not None:
        instants.add(override.until)
    if boost is not None:
        instants.add(boost.until)
    if house.vacation is not None:
        instants.add(house.vacation.start)
        if house.vacation.end is not None:
            instants.add(house.vacation.end)
    return sorted(instant for instant in instants if now < instant <= end)


def resolve(
    now: datetime,
    house: HouseState,
    plan: Plan,
    temperatures: Mapping[Mode, float],
    override: Override | None,
    tz: tzinfo,
    boost: RoomBoost | None = None,
) -> RoomTarget:
    """Return the target of a room at `now`, when it changes, and what comes next.

    `temperatures` must hold every mode with a temperature (see `effective_temperatures`).
    `valid_until` is None when nothing changes within `HORIZON`.
    """
    ensure_aware(now, "now")
    timeline = PlanTimeline(plan, tz, now)
    current = _target_at(now, house, timeline, temperatures, override, boost)
    valid_until: datetime | None = None
    following: Target | None = None
    for candidate in _candidates(now, house, timeline, override, boost):
        target = _target_at(candidate, house, timeline, temperatures, override, boost)
        if target != current:
            valid_until = candidate
            following = target
            break
    return RoomTarget(
        mode=current.mode,
        temperature=current.temperature,
        reason=Reason(current.source, current.mode, valid_until),
        valid_until=valid_until,
        next=following,
    )


def next_plan_change(
    now: datetime,
    house: HouseState,
    plan: Plan,
    temperatures: Mapping[Mode, float],
    tz: tzinfo,
) -> datetime | None:
    """Return the next change of the room target, ignoring any manual change."""
    return resolve(now, house, plan, temperatures, None, tz).valid_until
