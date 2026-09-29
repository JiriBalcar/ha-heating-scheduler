"""Tell our own writes (echoes) apart from manual setpoint changes on a TRV.

Home Assistant keeps the context of a service call on an entity for 5 seconds only.
A battery TRV can confirm a write later, with a new context. So a change is an echo if
the context is ours, or if it matches a write that is still pending.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum

from .setpoint import normalize_step, same_value, within


class Change(StrEnum):
    """Classification of a setpoint change reported by a TRV."""

    IGNORE = "ignore"  # no usable change
    ECHO = "echo"  # caused by our own write
    MANUAL = "manual"  # a person or another automation changed the setpoint


@dataclass(frozen=True, slots=True)
class PendingWrite:
    """A setpoint write to one TRV that is not settled yet."""

    commanded: float
    previous: float | None
    until: datetime


def classify_setpoint_change(
    *,
    old: float | None,
    new: float | None,
    own_context: bool,
    pending: PendingWrite | None,
    now: datetime,
    step: float | None,
) -> Change:
    """Classify a change of a TRV's target temperature from `old` to `new`."""
    if old is None or new is None or same_value(old, new):
        return Change.IGNORE
    if own_context:
        return Change.ECHO
    if pending is not None and now <= pending.until:
        # A late confirmation, possibly rounded by the TRV.
        if within(new, pending.commanded, normalize_step(step)):
            return Change.ECHO
        # A stale report of the value before our write.
        if pending.previous is not None and same_value(new, pending.previous):
            return Change.ECHO
    return Change.MANUAL
