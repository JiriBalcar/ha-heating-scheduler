"""Health issues of rooms: unavailable TRVs, failed writes, persistent mismatches."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import StrEnum
from typing import Any

from .core.serde import datetime_to_str

# A TRV that is missing or unavailable this long becomes an issue. This hides the few
# seconds after a Home Assistant start, before Zigbee2MQTT has published its entities.
UNAVAILABLE_GRACE = timedelta(minutes=2)


class IssueKind(StrEnum):
    """Kinds of health issues, in plain language in the UI."""

    UNAVAILABLE = "unavailable"
    WRITE_FAILED = "write_failed"
    MISMATCH = "mismatch"


@dataclass(frozen=True, slots=True)
class Issue:
    """One health issue of one TRV."""

    kind: IssueKind
    entity_id: str
    since: datetime | None

    def as_dict(self) -> dict[str, Any]:
        """Serialize the issue."""
        return {
            "kind": self.kind.value,
            "entity_id": self.entity_id,
            "since": None if self.since is None else datetime_to_str(self.since),
        }
