"""Setpoint arithmetic for TRVs: rounding, clamping, tolerance."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
import math

DEFAULT_STEP = 0.5
EPSILON = 1e-6


def normalize_step(step: float | None) -> float:
    """Return a usable step: `step` if it is positive, else DEFAULT_STEP."""
    if step is None or not math.isfinite(step) or step <= 0:
        return DEFAULT_STEP
    return step


def round_to_step(value: float, step: float | None) -> float:
    """Round `value` to the nearest multiple of `step`; halves round up."""
    decimal_step = Decimal(str(normalize_step(step)))
    count = (Decimal(str(value)) / decimal_step).quantize(Decimal(1), rounding=ROUND_HALF_UP)
    return float(count * decimal_step)


def device_setpoint(
    target: float,
    *,
    step: float | None,
    min_temp: float | None,
    max_temp: float | None,
) -> float:
    """Return the setpoint to send to a TRV: rounded to its step, then clamped."""
    value = round_to_step(target, step)
    if min_temp is not None and value < min_temp:
        value = min_temp
    if max_temp is not None and value > max_temp:
        value = max_temp
    return value


def same_value(first: float, second: float) -> bool:
    """Return True if two temperatures are equal within float noise."""
    return abs(first - second) < EPSILON


def within(first: float, second: float, tolerance: float) -> bool:
    """Return True if two temperatures differ by at most `tolerance`."""
    return abs(first - second) <= tolerance + EPSILON


def in_sync(
    actual: float | None, desired: float, step: float | None, accepted: float | None
) -> bool:
    """Return True if a TRV with setpoint `actual` needs no write for `desired`.

    `accepted` is the value the TRV settled on the last time we wrote this `desired`
    value. It stops write loops on TRVs that round differently from their reported step.
    """
    if actual is None:
        return False
    if within(actual, desired, normalize_step(step) / 2):
        return True
    return accepted is not None and same_value(actual, accepted)
