"""Tests for setpoint rounding/clamping, echo classification and override expiry."""

from __future__ import annotations

from datetime import timedelta

import pytest

from custom_components.heating_scheduler.core.echo import (
    Change,
    PendingWrite,
    classify_setpoint_change,
    settle_pending,
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


def pending(
    commanded: float | None = 21.0,
    previous: float | None = 19.0,
    *,
    confirmed: bool = False,
    mode_switch: bool = False,
) -> PendingWrite:
    return PendingWrite(
        commanded=commanded,
        previous=previous,
        until=NOW + timedelta(minutes=5),
        mode_switch=mode_switch,
        confirmed=confirmed,
    )


@pytest.mark.parametrize(
    ("old", "new", "writes", "expected"),
    [
        (None, 21.0, [], Change.IGNORE),
        (21.0, None, [], Change.IGNORE),
        (21.0, 21.0, [], Change.IGNORE),
        (19.0, 21.0, [pending()], Change.ECHO),  # late confirmation, any context
        (19.0, 21.5, [pending()], Change.ECHO),  # TRV rounded our value
        (21.0, 19.0, [pending()], Change.ECHO),  # stale report of the old value
        (19.0, 23.0, [pending()], Change.MANUAL),  # knob during our write
        (19.0, 21.0, [], Change.MANUAL),  # no write pending
        # Once confirmed, only our exact value is an echo.
        (21.0, 19.0, [pending(confirmed=True)], Change.MANUAL),
        (21.0, 21.5, [pending(confirmed=True)], Change.MANUAL),
        (22.0, 21.0, [pending(confirmed=True)], Change.ECHO),
        # A write that also switches the HVAC mode hides intermediate setpoints.
        (4.0, 19.0, [pending(21.0, 4.0, mode_switch=True)], Change.ECHO),
        (4.0, 19.0, [pending(21.0, 4.0, mode_switch=True, confirmed=True)], Change.MANUAL),
        (20.0, 4.0, [pending(None, 20.0, mode_switch=True)], Change.ECHO),
        # An older write can still land after a newer one was sent.
        (23.0, 22.0, [pending(22.0, 21.0), pending(23.0, 22.0)], Change.ECHO),
    ],
)
def test_classify_setpoint_change(
    old: float | None,
    new: float | None,
    writes: list[PendingWrite],
    expected: Change,
) -> None:
    result = classify_setpoint_change(old=old, new=new, pending=writes, now=NOW, step=0.5)
    assert result is expected


def test_expired_pending_write_does_not_hide_manual_change() -> None:
    expired = PendingWrite(commanded=21.0, previous=19.0, until=NOW - timedelta(seconds=1))
    result = classify_setpoint_change(old=19.0, new=21.0, pending=[expired], now=NOW, step=0.5)
    assert result is Change.MANUAL


def test_settle_keeps_superseded_writes() -> None:
    older = pending(22.0, 21.0)
    newer = pending(23.0, 22.0)
    # The newer command lands first: the older one is superseded but kept.
    after = settle_pending([older, newer], reported=23.0, hvac_mode="heat", now=NOW, step=0.5)
    assert [(w.commanded, w.confirmed, w.superseded) for w in after] == [
        (22.0, False, True),
        (23.0, True, False),
    ]
    # The older command lands late: still an echo, so the engine corrects the TRV.
    late = classify_setpoint_change(old=23.0, new=22.0, pending=after, now=NOW, step=0.5)
    assert late is Change.ECHO
    # A superseded write no longer hides a return to its previous value.
    back = classify_setpoint_change(old=23.0, new=21.0, pending=after, now=NOW, step=0.5)
    assert back is Change.MANUAL


def test_settle_needs_a_move_for_rounded_confirmation() -> None:
    write = pending(21.5, 21.0)
    # The TRV still reports its old value, which is one step away: not a confirmation.
    unchanged = settle_pending([write], reported=21.0, hvac_mode="heat", now=NOW, step=0.5)
    assert unchanged[0].confirmed is False
    rounded = settle_pending([write], reported=22.0, hvac_mode="heat", now=NOW, step=0.5)
    assert rounded[0].confirmed is True


def test_mode_switch_is_confirmed_only_in_the_new_mode() -> None:
    switch = PendingWrite(
        commanded=21.0,
        previous=21.0,
        until=NOW + timedelta(minutes=5),
        mode_switch=True,
        hvac_mode="heat",
    )
    # An unrelated report while the TRV is still off: the setpoint matches, the mode not.
    still_off = settle_pending([switch], reported=21.0, hvac_mode="off", now=NOW, step=0.5)
    assert still_off[0].confirmed is False
    # The TRV turns on and reports an intermediate setpoint: an echo, not confirmed yet.
    middle = classify_setpoint_change(old=21.0, new=5.0, pending=still_off, now=NOW, step=0.5)
    assert middle is Change.ECHO
    heating = settle_pending(still_off, reported=5.0, hvac_mode="heat", now=NOW, step=0.5)
    assert heating[0].confirmed is False
    done = settle_pending(heating, reported=21.0, hvac_mode="heat", now=NOW, step=0.5)
    assert done[0].confirmed is True


def test_settle_off_write_and_expiry() -> None:
    off = PendingWrite(
        commanded=None,
        previous=20.0,
        until=NOW + timedelta(minutes=5),
        mode_switch=True,
        hvac_mode="off",
    )
    heat = settle_pending([off], reported=20.0, hvac_mode="heat", now=NOW, step=0.5)
    assert heat[0].confirmed is False
    switched = settle_pending([off], reported=20.0, hvac_mode="off", now=NOW, step=0.5)
    assert switched[0].confirmed is True
    late = NOW + timedelta(minutes=6)
    assert settle_pending([off], reported=20.0, hvac_mode="off", now=late, step=0.5) == []


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
