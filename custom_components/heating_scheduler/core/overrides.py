"""Expiry rules of manual changes (overrides)."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timedelta
from enum import StrEnum

from .model import Override
from .timeline import ensure_aware

# Longest explicit duration a person can choose ("for 2 h", "until 18:00").
MAX_EXPLICIT_DURATION = timedelta(days=7)


class ExpiryKind(StrEnum):
    """How the end of a manual change is chosen."""

    NEXT_CHANGE = "next_change"
    DURATION = "duration"
    UNTIL = "until"


def override_until(
    now: datetime,
    kind: ExpiryKind,
    *,
    next_change: datetime | None,
    max_duration: timedelta,
    duration: timedelta | None = None,
    until: datetime | None = None,
) -> datetime:
    """Return the instant a new manual change ends.

    NEXT_CHANGE ends at the next plan change, but never later than `max_duration` from now.
    DURATION and UNTIL are explicit choices and are not capped by `max_duration`.
    """
    ensure_aware(now, "now")
    if kind is ExpiryKind.NEXT_CHANGE:
        cap = now + max_duration
        return cap if next_change is None else min(next_change, cap)
    if kind is ExpiryKind.DURATION:
        if duration is None or duration <= timedelta(0):
            raise ValueError("duration must be positive")
        if duration > MAX_EXPLICIT_DURATION:
            raise ValueError("duration is too long")
        return now + duration
    if until is None:
        raise ValueError("until is required")
    ensure_aware(until, "until")
    if until <= now:
        raise ValueError("until must be in the future")
    if until - now > MAX_EXPLICIT_DURATION:
        raise ValueError("until is too far in the future")
    return until


def active_overrides(overrides: Mapping[str, Override], now: datetime) -> dict[str, Override]:
    """Return the overrides that have not expired at `now`."""
    return {room_id: item for room_id, item in overrides.items() if item.until > now}
