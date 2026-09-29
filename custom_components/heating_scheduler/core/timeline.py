"""Map local wall-clock plans to UTC instants, safely across DST transitions.

Rules:
- An ambiguous local time (it occurs twice when clocks go back) maps to its first occurrence.
- A non-existent local time (skipped when clocks go forward) maps to the first instant
  after the gap.
- All comparisons use UTC instants, never wall times.
"""

from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta, tzinfo

from .model import DAYS_PER_WEEK, Mode, Plan

# The plan is evaluated for this many days before and after the instant of interest.
# Days before: a slot can carry over from up to a week back (days without slots).
# Days after: `next_change` must see a full week ahead plus one day.
_DAYS_BEFORE = DAYS_PER_WEEK + 1
_DAYS_AFTER = DAYS_PER_WEEK + 2


def ensure_aware(value: datetime, name: str = "datetime") -> datetime:
    """Raise ValueError if `value` is naive; return it otherwise."""
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{name} must be timezone-aware")
    return value


def _wall(instant: datetime, tz: tzinfo) -> datetime:
    """Return the naive local wall time of an aware instant."""
    return instant.astimezone(tz).replace(tzinfo=None)


def local_to_utc(day: date, at: time, tz: tzinfo) -> datetime:
    """Return the UTC instant of local wall time `at` on `day` in `tz`."""
    naive = datetime.combine(day, at.replace(tzinfo=None))
    candidate = naive.replace(tzinfo=tz, fold=0).astimezone(UTC)
    if _wall(candidate, tz) == naive:
        # The time exists. fold=0 selects the first occurrence of an ambiguous time.
        return candidate

    # The time is in a DST gap. fold=0 and fold=1 give instants on both sides of the
    # transition. Search the first whole second whose wall time is at or after `naive`.
    other = naive.replace(tzinfo=tz, fold=1).astimezone(UTC)
    low = int(min(candidate, other).timestamp())
    high = int(max(candidate, other).timestamp())
    while high - low > 1:
        middle = (low + high) // 2
        if _wall(datetime.fromtimestamp(middle, UTC), tz) >= naive:
            high = middle
        else:
            low = middle
    return datetime.fromtimestamp(high, UTC)


@dataclass(frozen=True, slots=True)
class Boundary:
    """The instant a plan slot starts."""

    at: datetime
    mode: Mode


def plan_boundaries(plan: Plan, first_day: date, last_day: date, tz: tzinfo) -> list[Boundary]:
    """Return slot starts of local days `first_day`..`last_day` as UTC instants.

    Several slots can map to the same instant (DST gap). They keep their wall-clock order,
    so the last one of them is the one in effect.
    """
    boundaries: list[Boundary] = []
    day = first_day
    while day <= last_day:
        boundaries.extend(
            Boundary(local_to_utc(day, slot.start, tz), slot.mode)
            for slot in plan.days[day.weekday()]
        )
        day += timedelta(days=1)
    # Instants are already non-decreasing. The stable sort is a safety net only.
    boundaries.sort(key=lambda boundary: boundary.at)
    return boundaries


class PlanTimeline:
    """A plan evaluated around one instant: mode at an instant, and next mode change."""

    def __init__(self, plan: Plan, tz: tzinfo, around: datetime) -> None:
        """Evaluate `plan` in `tz` for the days around `around`."""
        ensure_aware(around, "around")
        local_day = around.astimezone(tz).date()
        raw = plan_boundaries(
            plan,
            local_day - timedelta(days=_DAYS_BEFORE),
            local_day + timedelta(days=_DAYS_AFTER),
            tz,
        )
        if not raw:
            raise ValueError(f"plan {plan.id!r} has no slots")
        # Keep only real mode changes. For equal instants, the last slot wins.
        changes: list[Boundary] = []
        for boundary in raw:
            if changes and changes[-1].at == boundary.at:
                changes.pop()
            if not changes or changes[-1].mode is not boundary.mode:
                changes.append(boundary)
        self._changes = changes
        self._instants = [boundary.at for boundary in changes]
        self._start = self._instants[0]
        self._end = local_to_utc(local_day + timedelta(days=_DAYS_AFTER + 1), time(0), tz)

    def _index_at(self, at: datetime) -> int:
        if not self._start <= at < self._end:
            raise ValueError(f"{at.isoformat()} is outside the evaluated window")
        return bisect_right(self._instants, at) - 1

    def mode_at(self, at: datetime) -> Mode:
        """Return the plan mode in effect at `at`."""
        return self._changes[self._index_at(at)].mode

    def changes_between(self, start: datetime, end: datetime) -> list[datetime]:
        """Return the instants in (start, end] where the plan mode changes."""
        index = bisect_right(self._instants, start)
        result: list[datetime] = []
        while index < len(self._instants) and self._instants[index] <= end:
            result.append(self._instants[index])
            index += 1
        return result

    def next_change(self, at: datetime) -> datetime | None:
        """Return the first instant after `at` where the plan mode changes, if any."""
        index = self._index_at(at) + 1
        return self._instants[index] if index < len(self._instants) else None
