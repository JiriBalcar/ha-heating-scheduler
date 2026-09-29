"""Tests for setpoint rounding/clamping, echo classification and override expiry."""

from __future__ import annotations

from datetime import timedelta

import pytest

from custom_components.heating_scheduler.core.echo import (
    Change,
    PendingWrite,
    classify_setpoint_change,
)
from custom_components.heating_scheduler.core.model import Override, OverrideOrigin
from custom_components.heating_scheduler.core.overrides import (
    MAX_EXPLICIT_DURATION,
    ExpiryKind,
    active_overrides,
    override_until,
)
from custom_components.heating_scheduler.core.setpoint import (
    DEFAULT_STEP,
    device_setpoint,
    in_sync,
    normalize_step,
    round_to_step,
)
from tests.builders import utc

NOW = utc(2026, 10, 5, 10)


@pytest.mark.parametrize(
    ("value", "step", "expected"),
    [
        (20.25, 0.5, 20.5),  # halves round up
        (20.24, 0.5, 20.0),
        (21.15, 0.1, 21.2),  # no float artefacts
        (21.4, 1.0, 21.0),
        (21.5, 1.0, 22.0),
        (19.0, None, 19.0),
        (19.3, 0.0, 19.5),  # invalid step falls back to 0.5
        (19.3, float("nan"), 19.5),
    ],
)
def test_round_to_step(value: float, step: float | None, expected: float) -> None:
    assert round_to_step(value, step) == expected


def test_normalize_step() -> None:
    assert normalize_step(None) == DEFAULT_STEP
    assert normalize_step(-1) == DEFAULT_STEP
    assert normalize_step(0.1) == 0.1


def test_device_setpoint_rounds_then_clamps() -> None:
    assert device_setpoint(21.3, step=0.5, min_temp=5, max_temp=30) == 21.5
    assert device_setpoint(4.0, step=0.5, min_temp=7, max_temp=30) == 7
    assert device_setpoint(33.2, step=0.5, min_temp=5, max_temp=30) == 30
    assert device_setpoint(7.2, step=0.5, min_temp=None, max_temp=None) == 7.0


def test_in_sync_uses_half_step_tolerance() -> None:
    assert in_sync(21.0, 21.0, 0.5, None)
    assert in_sync(21.2, 21.0, 0.5, None)
    assert not in_sync(21.5, 21.0, 0.5, None)
    assert not in_sync(None, 21.0, 0.5, None)


def test_in_sync_accepts_value_the_trv_settled_on() -> None:
    # A TRV that reports step 0.5 but stores whole degrees keeps 21.0 for 21.5.
    assert not in_sync(21.0, 21.5, 0.5, None)
    assert in_sync(21.0, 21.5, 0.5, 21.0)
    assert not in_sync(20.0, 21.5, 0.5, 21.0)


def pending(commanded: float = 21.0, previous: float | None = 19.0) -> PendingWrite:
    return PendingWrite(commanded=commanded, previous=previous, until=NOW + timedelta(minutes=5))


@pytest.mark.parametrize(
    ("old", "new", "own", "write", "expected"),
    [
        (None, 21.0, False, None, Change.IGNORE),
        (21.0, None, False, None, Change.IGNORE),
        (21.0, 21.0, False, None, Change.IGNORE),
        (19.0, 21.0, True, None, Change.ECHO),  # our context
        (19.0, 21.0, False, pending(), Change.ECHO),  # late confirmation, new context
        (19.0, 21.5, False, pending(), Change.ECHO),  # TRV rounded our value
        (21.0, 19.0, False, pending(), Change.ECHO),  # stale report of the old value
        (19.0, 23.0, False, pending(), Change.MANUAL),  # knob during our write
        (19.0, 21.0, False, None, Change.MANUAL),  # no write pending
    ],
)
def test_classify_setpoint_change(
    old: float | None,
    new: float | None,
    own: bool,
    write: PendingWrite | None,
    expected: Change,
) -> None:
    result = classify_setpoint_change(
        old=old, new=new, own_context=own, pending=write, now=NOW, step=0.5
    )
    assert result is expected


def test_expired_pending_write_does_not_hide_manual_change() -> None:
    expired = PendingWrite(commanded=21.0, previous=19.0, until=NOW - timedelta(seconds=1))
    result = classify_setpoint_change(
        old=19.0, new=21.0, own_context=False, pending=expired, now=NOW, step=0.5
    )
    assert result is Change.MANUAL


def test_next_change_is_capped_by_max_duration() -> None:
    four_hours = timedelta(hours=4)
    assert override_until(
        NOW, ExpiryKind.NEXT_CHANGE, next_change=NOW + timedelta(hours=2), max_duration=four_hours
    ) == NOW + timedelta(hours=2)
    assert (
        override_until(
            NOW,
            ExpiryKind.NEXT_CHANGE,
            next_change=NOW + timedelta(hours=9),
            max_duration=four_hours,
        )
        == NOW + four_hours
    )
    # No plan change at all (constant plan): the cap applies.
    assert (
        override_until(NOW, ExpiryKind.NEXT_CHANGE, next_change=None, max_duration=four_hours)
        == NOW + four_hours
    )


def test_explicit_duration_and_until_are_not_capped() -> None:
    cap = timedelta(hours=4)
    six_hours = timedelta(hours=6)
    assert (
        override_until(
            NOW, ExpiryKind.DURATION, next_change=None, max_duration=cap, duration=six_hours
        )
        == NOW + six_hours
    )
    until = NOW + timedelta(hours=8)
    assert (
        override_until(NOW, ExpiryKind.UNTIL, next_change=None, max_duration=cap, until=until)
        == until
    )


@pytest.mark.parametrize(
    ("kind", "duration", "until"),
    [
        (ExpiryKind.DURATION, None, None),
        (ExpiryKind.DURATION, timedelta(0), None),
        (ExpiryKind.DURATION, MAX_EXPLICIT_DURATION + timedelta(minutes=1), None),
        (ExpiryKind.UNTIL, None, None),
        (ExpiryKind.UNTIL, None, NOW),
        (ExpiryKind.UNTIL, None, NOW + MAX_EXPLICIT_DURATION + timedelta(minutes=1)),
    ],
)
def test_invalid_expiry(kind: ExpiryKind, duration: timedelta | None, until: object) -> None:
    with pytest.raises(ValueError):
        override_until(
            NOW,
            kind,
            next_change=None,
            max_duration=timedelta(hours=4),
            duration=duration,
            until=until,  # type: ignore[arg-type]
        )


def test_active_overrides_drops_expired() -> None:
    def item(until_hours: int) -> Override:
        return Override(21.0, NOW + timedelta(hours=until_hours), NOW, OverrideOrigin.USER)

    result = active_overrides({"a": item(1), "b": item(0), "c": item(-1)}, NOW)
    assert list(result) == ["a"]
