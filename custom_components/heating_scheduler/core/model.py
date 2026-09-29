"""Domain model: modes, plans, temperature sets, rooms, house state, overrides."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
from enum import StrEnum

HOUSE_ID = "house"
DAYS_PER_WEEK = 7
WORKDAYS: tuple[int, ...] = (0, 1, 2, 3, 4)
WEEKEND: tuple[int, ...] = (5, 6)

# Limits for temperatures that people enter (mode temperatures, manual changes from the app).
MIN_TEMPERATURE = 5.0
MAX_TEMPERATURE = 30.0


class Mode(StrEnum):
    """Mode of a plan slot. Every mode except OFF has a temperature."""

    COMFORT = "comfort"
    ECO = "eco"
    NIGHT = "night"
    AWAY = "away"
    FROST = "frost"
    OFF = "off"


TEMPERATURE_MODES: tuple[Mode, ...] = (
    Mode.COMFORT,
    Mode.ECO,
    Mode.NIGHT,
    Mode.AWAY,
    Mode.FROST,
)
VACATION_MODES: tuple[Mode, ...] = (Mode.FROST, Mode.AWAY)

DEFAULT_TEMPERATURES: Mapping[Mode, float] = {
    Mode.COMFORT: 21.0,
    Mode.ECO: 19.0,
    Mode.NIGHT: 18.0,
    Mode.AWAY: 16.0,
    Mode.FROST: 7.0,
}


class TargetMode(StrEnum):
    """Mode of a resolved room target: a plan mode, or a manual change."""

    COMFORT = "comfort"
    ECO = "eco"
    NIGHT = "night"
    AWAY = "away"
    FROST = "frost"
    OFF = "off"
    MANUAL = "manual"


class HouseMode(StrEnum):
    """House-wide mode. VACATION is only ever effective, never selected directly."""

    AUTO = "auto"
    AWAY = "away"
    VACATION = "vacation"
    OFF = "off"


SELECTABLE_HOUSE_MODES: tuple[HouseMode, ...] = (HouseMode.AUTO, HouseMode.AWAY, HouseMode.OFF)


class Source(StrEnum):
    """Why a room has its current target."""

    PLAN = "plan"
    MANUAL = "manual"
    HOUSE_AWAY = "house_away"
    VACATION = "vacation"
    HOUSE_OFF = "house_off"


class OverrideOrigin(StrEnum):
    """Where a manual change came from."""

    DEVICE = "device"  # setpoint changed on a TRV (knob, HA UI on the TRV, other automation)
    USER = "user"  # panel, card, service call, room climate entity


@dataclass(frozen=True, slots=True)
class Slot:
    """A plan slot: from `start` (local wall time) until the next slot, the room is in `mode`."""

    start: time
    mode: Mode


@dataclass(frozen=True, slots=True)
class Plan:
    """A weekly plan. `days[0]` is Monday.

    The time before the first slot of a day belongs to the last slot of an earlier day.
    """

    id: str
    name: str
    days: tuple[tuple[Slot, ...], ...]


@dataclass(frozen=True, slots=True)
class TempSet:
    """Temperatures per mode. The house set has all modes; other sets hold only changes."""

    id: str
    name: str
    temperatures: Mapping[Mode, float]


@dataclass(frozen=True, slots=True)
class Room:
    """A room: its TRVs and which plan and temperature set it uses."""

    id: str
    name: str
    trvs: tuple[str, ...] = ()
    plan_id: str = HOUSE_ID
    temp_set_id: str = HOUSE_ID
    temperature_entity: str | None = None
    area_id: str | None = None


@dataclass(frozen=True, slots=True)
class Vacation:
    """A vacation window. `end` None means open-ended."""

    start: datetime
    end: datetime | None
    mode: Mode = Mode.FROST


@dataclass(frozen=True, slots=True)
class HouseState:
    """The selected house mode plus an optional (active or planned) vacation.

    `mode` is never VACATION. During a vacation, `mode` keeps the mode that was selected
    before, so the house returns to it when the vacation ends.
    """

    mode: HouseMode = HouseMode.AUTO
    vacation: Vacation | None = None

    def vacation_active(self, at: datetime) -> bool:
        """Return True if the vacation covers the instant `at`."""
        vac = self.vacation
        return vac is not None and vac.start <= at and (vac.end is None or at < vac.end)

    def effective_mode(self, at: datetime) -> HouseMode:
        """Return the house mode in effect at `at`."""
        if self.vacation_active(at):
            return HouseMode.VACATION
        return self.mode


@dataclass(frozen=True, slots=True)
class Override:
    """A manual change for a whole room. `temperature` None means heating off."""

    temperature: float | None
    until: datetime
    created: datetime
    origin: OverrideOrigin
    entity_id: str | None = None


@dataclass(frozen=True, slots=True)
class Settings:
    """Global settings."""

    max_override: timedelta = timedelta(hours=4)
    safety_interval: timedelta = timedelta(minutes=5)
    mismatch_alert: timedelta = timedelta(minutes=20)
    vacation_mode: Mode = Mode.FROST
    dry_run: bool = False


@dataclass(frozen=True, slots=True)
class Config:
    """Everything the user configures. Dict order is display order."""

    rooms: Mapping[str, Room]
    plans: Mapping[str, Plan]
    temp_sets: Mapping[str, TempSet]
    house: HouseState = field(default_factory=HouseState)
    settings: Settings = field(default_factory=Settings)
    revision: int = 0

    @property
    def house_plan(self) -> Plan:
        """Return the house plan."""
        return self.plans[HOUSE_ID]

    @property
    def house_temps(self) -> TempSet:
        """Return the house temperature set."""
        return self.temp_sets[HOUSE_ID]


@dataclass(frozen=True, slots=True)
class Target:
    """What a room should have at one instant."""

    mode: TargetMode
    temperature: float | None
    source: Source


@dataclass(frozen=True, slots=True)
class Reason:
    """Structured explanation of a target. `text.render_reason` turns it into words."""

    source: Source
    mode: TargetMode
    until: datetime | None


@dataclass(frozen=True, slots=True)
class RoomTarget:
    """Result of `resolve()`."""

    mode: TargetMode
    temperature: float | None
    reason: Reason
    valid_until: datetime | None
    next: Target | None

    @property
    def source(self) -> Source:
        """Return the source of the target."""
        return self.reason.source
