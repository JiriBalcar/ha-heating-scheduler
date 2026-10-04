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

# States of window entities that mean open. A binary sensor is "on" when open; valves report
# their own detection also as a sensor with words (e.g. Danfoss Ally: "open", "external_open").
OPEN_STATES = frozenset({"on", "open", "opened", "true", "detected", "external_open"})

# Temperature drop: the room counts as open when its temperature falls by DROP_DEGREES within
# DROP_PERIOD. It counts as closed again when the temperature rises DROP_RISE above the lowest
# value since then, or after DROP_HOLD.
DROP_DEGREES = 1.0
DROP_PERIOD = timedelta(minutes=5)
DROP_RISE = 0.3
DROP_HOLD = timedelta(minutes=30)


def is_open_state(state: str | None) -> bool:
    """Return True if an entity state means that a window is open."""
    return state is not None and state.strip().lower() in OPEN_STATES


@dataclass(frozen=True, slots=True)
class WindowSignals:
    """Since when each signal of a room says open; None while it says closed."""

    contact: datetime | None = None
    valve: datetime | None = None
    drop: datetime | None = None


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


class DropDetector:
    """Detects an open window from a fast drop of the room temperature."""

    def __init__(
        self,
        degrees: float = DROP_DEGREES,
        period: timedelta = DROP_PERIOD,
        rise: float = DROP_RISE,
        hold: timedelta = DROP_HOLD,
    ) -> None:
        """Create a detector with no samples."""
        self._degrees = degrees
        self._period = period
        self._rise = rise
        self._hold = hold
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

    def since(self, now: datetime) -> datetime | None:
        """Return since when the window is open, or None."""
        if self._since is None or now >= self._since + self._hold:
            return None
        return self._since

    def ends(self) -> datetime | None:
        """Return when an open window found by the drop counts as closed at the latest."""
        return None if self._since is None else self._since + self._hold
