"""Open windows: when a room counts as open, and the temperature-drop detector.

A room has up to three signals:
- contact sensors: open after the window has been open for the delay in the settings;
- the valve's own detection (an entity of the valve): open at once, the valve has waited;
- a fast drop of the room temperature (`DropDetector`): open at once.

The room counts as open from the earliest instant any signal says so.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime, timedelta
import math

from .model import Settings, WindowSignals

__all__ = [
    "DropDetector",
    "DropRules",
    "WindowSignals",
    "is_open_state",
    "merge_signal",
    "window_open_at",
]

# States that say nothing about the window: Home Assistant is starting, or the sensor is offline.
UNKNOWN_STATES = frozenset({"unavailable", "unknown"})

# States of window entities that mean open. A binary sensor is "on" when open; valves report
# their own detection also as a sensor with words (e.g. Danfoss Ally: "open", "external_open").
OPEN_STATES = frozenset({"on", "open", "opened", "true", "detected", "external_open"})


def is_open_state(state: str | None) -> bool:
    """Return True if an entity state means that a window is open."""
    return state is not None and state.strip().lower() in OPEN_STATES


def merge_signal(
    stored: datetime | None, states: list[tuple[str | None, datetime]]
) -> tuple[datetime | None, datetime | None]:
    """Combine the stored open-since instant of a signal with the states of its entities.

    `states` holds (state, last_changed) of each entity; a missing entity has state None.
    Returns (since when the signal says open now, what to store). Open: since the stored instant
    or the earliest `last_changed` of an open entity, whichever is earlier; a restart or an
    entity that was offline does not start the delay and the limit again. Closed (every entity
    known and none open): nothing. Not known (an entity is missing or offline, none open): not
    open now, but the stored instant is kept until the entities say closed.
    """
    opened = [changed for state, changed in states if is_open_state(state)]
    if opened:
        since = min(opened) if stored is None else min(stored, *opened)
        return since, since
    known = all(state is not None and state not in UNKNOWN_STATES for state, _ in states)
    return None, None if known else stored


def window_open_at(signals: WindowSignals, delay: timedelta) -> datetime | None:
    """Return the instant from which the room counts as open, None while every signal is closed.

    The instant can be in the future: a contact sensor counts only after `delay`.
    """
    instants = [
        instant
        for instant in (
            None if signals.contact is None else signals.contact + delay,
            signals.valve,
            signals.drop,
        )
        if instant is not None
    ]
    return min(instants, default=None)


@dataclass(frozen=True, slots=True)
class DropRules:
    """The room counts as open when its temperature falls by `degrees` within `period`. It
    counts as closed again when the temperature rises `rise` above the lowest value since then,
    or after `hold`."""

    degrees: float = 1.0
    period: timedelta = timedelta(minutes=5)
    rise: float = 0.3
    hold: timedelta = timedelta(minutes=30)

    @classmethod
    def of(cls, settings: Settings) -> DropRules:
        """Return the rules in the settings."""
        return cls(
            settings.window_drop_degrees,
            settings.window_drop_period,
            settings.window_drop_rise,
            settings.window_drop_hold,
        )


class DropDetector:
    """Detects an open window from a fast drop of the room temperature."""

    def __init__(self, rules: DropRules | None = None) -> None:
        """Create a detector with no samples."""
        self.rules = rules = rules or DropRules()
        self._degrees = rules.degrees
        self._period = rules.period
        self._rise = rules.rise
        self._hold = rules.hold
        self._samples: deque[tuple[datetime, float]] = deque()
        self._since: datetime | None = None
        self._lowest = 0.0

    def add(self, at: datetime, temperature: float) -> None:
        """Add a temperature sample (°C). Samples must come in time order."""
        if self._since is not None:
            if at < self._since + self._hold and temperature < self._lowest + self._rise:
                self._lowest = min(self._lowest, temperature)
                return
            # Closed: the room warms up again, or the window was open long enough.
            self._since = None
            self._samples.clear()
        self._samples.append((at, temperature))
        while self._samples and self._samples[0][0] < at - self._period:
            self._samples.popleft()
        highest = max(value for _, value in self._samples)
        if highest - temperature >= self._degrees:
            self._since = at
            self._lowest = temperature
            self._samples.clear()

    def restore(self, since: datetime) -> None:
        """Count as open since `since`, as stored before a restart; the lowest temperature is
        not known, so the first sample after it becomes the lowest."""
        if self._since is None:
            self._since = since
            self._lowest = math.inf
            self._samples.clear()

    def since(self, now: datetime) -> datetime | None:
        """Return since when the window is open, or None."""
        if self._since is None or now >= self._since + self._hold:
            return None
        return self._since

    def ends(self) -> datetime | None:
        """Return when an open window found by the drop counts as closed at the latest."""
        return None if self._since is None else self._since + self._hold
