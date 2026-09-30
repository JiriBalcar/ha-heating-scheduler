"""Tell our own writes (echoes) apart from manual setpoint changes on a TRV.

Home Assistant stamps every state write of an entity with the context of the last service
call for 5 seconds, also a knob change reported in that time. And a battery TRV can confirm
a write later, with a new context. So the context says nothing reliable; the value does:

- A report is an echo if it matches a write we sent that is not settled yet: the commanded
  value (the TRV may round it by one step), or, before the TRV confirmed, the value it had
  before (a stale report).
- Once the TRV confirmed a write, only the commanded value itself still counts as an echo.
  Any other change is a person (or another automation).
- While a write also switches the HVAC mode, TRVs report intermediate setpoints; every
  setpoint change counts as an echo until the TRV confirms.

Each TRV keeps a short list of such writes. A newer write does not cancel an older one:
the older command can still land late.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, replace
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
    """A write to one TRV that is not settled yet.

    `commanded` is None when the write only switched the TRV off. `hvac_mode` is the mode
    the write switches to, None when it only sets a temperature. A write is `superseded`
    when the TRV confirmed a later write; its command can still land late.
    """

    commanded: float | None
    previous: float | None
    until: datetime
    mode_switch: bool = False
    hvac_mode: str | None = None
    confirmed: bool = False
    superseded: bool = False


def classify_setpoint_change(
    *,
    old: float | None,
    new: float | None,
    pending: Sequence[PendingWrite],
    now: datetime,
    step: float | None,
) -> Change:
    """Classify a change of a TRV's target temperature from `old` to `new`."""
    if old is None or new is None or same_value(old, new):
        return Change.IGNORE
    size = normalize_step(step)
    for write in pending:
        if now > write.until:
            continue
        if write.commanded is not None:
            tolerance = size / 2 if write.confirmed else size
            if within(new, write.commanded, tolerance):
                return Change.ECHO
        if write.confirmed or write.superseded:
            # Only the commanded value of a settled or superseded write is still an echo.
            continue
        if write.mode_switch:
            return Change.ECHO
        if write.previous is not None and same_value(new, write.previous):
            return Change.ECHO
    return Change.MANUAL


def _confirms(
    write: PendingWrite, reported: float | None, hvac_mode: str | None, size: float
) -> bool:
    """Return True if a report shows that the TRV applied `write`."""
    if write.hvac_mode is not None and hvac_mode != write.hvac_mode:
        # A mode switch is applied only once the TRV reports the new mode.
        return False
    if write.commanded is None:
        return write.hvac_mode is not None
    if reported is None:
        return False
    # Exactly our value, or our value rounded by the TRV (then it must have moved).
    moved = write.previous is None or not same_value(reported, write.previous)
    return within(reported, write.commanded, size / 2) or (
        moved and within(reported, write.commanded, size)
    )


def settle_pending(
    pending: Sequence[PendingWrite],
    *,
    reported: float | None,
    hvac_mode: str | None,
    now: datetime,
    step: float | None,
) -> list[PendingWrite]:
    """Update pending writes after a TRV report (oldest first in, oldest first out).

    Expired writes are dropped. A write is confirmed when the TRV reports its mode and
    value. Older writes are then superseded but kept until they expire: their command can
    still land late, and that must be recognised as ours, not as a person.
    """
    size = normalize_step(step)
    result: list[PendingWrite] = []
    for write in pending:
        if now > write.until:
            continue
        if write.confirmed or not _confirms(write, reported, hvac_mode, size):
            result.append(write)
            continue
        result = [
            item if item.confirmed or item.superseded else replace(item, superseded=True)
            for item in result
        ]
        result.append(replace(write, confirmed=True))
    return result
