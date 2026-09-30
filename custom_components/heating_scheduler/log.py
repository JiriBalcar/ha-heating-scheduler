"""Per-room log of writes, verifications and manual changes."""

from __future__ import annotations

from collections import deque
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Any

from .const import LOG_LIMIT
from .core.serde import datetime_from_str, datetime_to_str


class LogKind(StrEnum):
    """What happened."""

    WRITE = "write"  # a command was sent to a TRV
    VERIFIED = "verified"  # the TRV reported the commanded value
    RETRY = "retry"  # the TRV did not confirm in time; the command is sent again
    FAILED = "failed"  # all attempts failed
    DRY_RUN = "dry_run"  # a write that dry-run mode did not send
    MANUAL = "manual"  # a manual change on a TRV became a room override
    MANUAL_IGNORED = "manual_ignored"  # a manual change was undone (house mode wins)
    OVERRIDE_SET = "override_set"  # a manual change from the app, a service or voice
    OVERRIDE_CLEARED = "override_cleared"  # back to plan
    OVERRIDE_EXPIRED = "override_expired"
    UNAVAILABLE = "unavailable"
    AVAILABLE = "available"
    BOOST_STARTED = "boost_started"  # every room at its valves' maximum
    BOOST_ENDED = "boost_ended"


@dataclass(frozen=True, slots=True)
class LogEntry:
    """One log line. `source` and `mode` say why a value was sent."""

    at: datetime
    kind: LogKind
    entity_id: str | None = None
    value: float | None = None
    hvac_mode: str | None = None
    source: str | None = None
    mode: str | None = None
    detail: str | None = None

    def as_dict(self) -> dict[str, Any]:
        """Serialize the entry."""
        return {
            "at": datetime_to_str(self.at),
            "kind": self.kind.value,
            "entity_id": self.entity_id,
            "value": self.value,
            "hvac_mode": self.hvac_mode,
            "source": self.source,
            "mode": self.mode,
            "detail": self.detail,
        }

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> LogEntry:
        """Parse an entry."""
        value = data.get("value")
        return cls(
            at=datetime_from_str(data["at"]),
            kind=LogKind(data["kind"]),
            entity_id=data.get("entity_id"),
            value=None if value is None else float(value),
            hvac_mode=data.get("hvac_mode"),
            source=data.get("source"),
            mode=data.get("mode"),
            detail=data.get("detail"),
        )


class EventLog:
    """Bounded per-room log. `on_change` schedules a (delayed) save."""

    def __init__(self, on_change: Callable[[], None]) -> None:
        """Create an empty log."""
        self._rooms: dict[str, deque[LogEntry]] = {}
        self._on_change = on_change

    def add(self, room_id: str, entry: LogEntry) -> None:
        """Append an entry to the log of a room."""
        self._rooms.setdefault(room_id, deque(maxlen=LOG_LIMIT)).append(entry)
        self._on_change()

    def entries(self, room_id: str) -> list[LogEntry]:
        """Return the entries of a room, newest first."""
        return list(reversed(self._rooms.get(room_id, ())))

    def remove_room(self, room_id: str) -> None:
        """Forget the log of a removed room."""
        if self._rooms.pop(room_id, None) is not None:
            self._on_change()

    def as_dict(self) -> dict[str, Any]:
        """Serialize the log."""
        return {
            "rooms": {
                room_id: [entry.as_dict() for entry in entries]
                for room_id, entries in self._rooms.items()
            }
        }

    def load(self, data: Mapping[str, Any] | None) -> None:
        """Load a stored log. Broken entries are skipped."""
        self._rooms = {}
        if not data:
            return
        for room_id, entries in data.get("rooms", {}).items():
            bucket: deque[LogEntry] = deque(maxlen=LOG_LIMIT)
            for item in entries:
                try:
                    bucket.append(LogEntry.from_dict(item))
                except KeyError, ValueError, TypeError:
                    continue
            self._rooms[room_id] = bucket
