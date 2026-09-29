"""Plan operations and defaults."""

from __future__ import annotations

from collections.abc import Collection, Iterable, Sequence
from dataclasses import replace
from datetime import time
import uuid

from .model import (
    DAYS_PER_WEEK,
    DEFAULT_TEMPERATURES,
    HOUSE_ID,
    WEEKEND,
    WORKDAYS,
    Config,
    Mode,
    Plan,
    Slot,
    TempSet,
)


def normalize_day(slots: Iterable[Slot]) -> tuple[Slot, ...]:
    """Sort slots, keep the last slot of equal start times, and merge equal neighbours."""
    by_start: dict[time, Slot] = {}
    for slot in slots:
        by_start[slot.start] = slot
    result: list[Slot] = []
    for start in sorted(by_start):
        slot = by_start[start]
        if result and result[-1].mode is slot.mode:
            continue
        result.append(slot)
    return tuple(result)


def copy_day(plan: Plan, source: int, targets: Iterable[int]) -> Plan:
    """Return `plan` with the slots of day `source` copied to each day in `targets`."""
    days = list(plan.days)
    for target in targets:
        if not 0 <= target < DAYS_PER_WEEK:
            raise ValueError(f"invalid day index {target}")
        days[target] = plan.days[source]
    return replace(plan, days=tuple(days))


def same_every_workday(plan: Plan, source: int) -> Plan:
    """Return `plan` with day `source` copied to Monday..Friday."""
    return copy_day(plan, source, WORKDAYS)


def same_on_weekend(plan: Plan, source: int) -> Plan:
    """Return `plan` with day `source` copied to Saturday and Sunday."""
    return copy_day(plan, source, WEEKEND)


def uniform_plan(plan_id: str, name: str, day: Sequence[Slot]) -> Plan:
    """Return a plan with the same slots on every day."""
    slots = normalize_day(day)
    return Plan(id=plan_id, name=name, days=tuple(slots for _ in range(DAYS_PER_WEEK)))


def default_house_plan(name: str = "House plan") -> Plan:
    """Return the initial house plan: warm 06:00-22:00, night otherwise."""
    return uniform_plan(
        HOUSE_ID,
        name,
        [
            Slot(time(0, 0), Mode.NIGHT),
            Slot(time(6, 0), Mode.COMFORT),
            Slot(time(22, 0), Mode.NIGHT),
        ],
    )


def default_house_temps(name: str = "House") -> TempSet:
    """Return the initial house temperatures."""
    return TempSet(id=HOUSE_ID, name=name, temperatures=dict(DEFAULT_TEMPERATURES))


def default_config(plan_name: str = "House plan", temps_name: str = "House") -> Config:
    """Return the configuration of a new installation."""
    return Config(
        rooms={},
        plans={HOUSE_ID: default_house_plan(plan_name)},
        temp_sets={HOUSE_ID: default_house_temps(temps_name)},
    )


def new_id(prefix: str, existing: Collection[str]) -> str:
    """Return a new random id with `prefix` that is not in `existing`."""
    while True:
        candidate = f"{prefix}_{uuid.uuid4().hex[:8]}"
        if candidate not in existing:
            return candidate
