"""Domain model: modes, plans, temperature sets, rooms, zones, house state, overrides."""

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
    BOOST = "boost"
    WINDOW = "window"


class HouseMode(StrEnum):
    """House-wide mode. VACATION is only ever effective, never selected directly."""

    AUTO = "auto"
    AWAY = "away"
    VACATION = "vacation"
    FROST = "frost"
    OFF = "off"


# Every house mode, in the order the UI offers them.
HOUSE_MODES: tuple[HouseMode, ...] = tuple(HouseMode)
# The modes that are selected as such; a holiday has dates.
SELECTABLE_HOUSE_MODES: tuple[HouseMode, ...] = (
    HouseMode.AUTO,
    HouseMode.AWAY,
    HouseMode.FROST,
    HouseMode.OFF,
)


class Source(StrEnum):
    """Why a room has its current target."""

    PLAN = "plan"
    MANUAL = "manual"
    HOUSE_AWAY = "house_away"
    VACATION = "vacation"
    HOUSE_FROST = "house_frost"
    HOUSE_OFF = "house_off"
    BOOST = "boost"
    WINDOW = "window"


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
    """A room: its TRVs and which plan and temperature set it uses.

    Open windows: `window_sensors` are contact sensors, `valve_window_sensors` report the
    valves' own open-window detection, `window_drop` detects a fast temperature drop. A room uses
    at most one of them.
    """

    id: str
    name: str
    trvs: tuple[str, ...] = ()
    plan_id: str = HOUSE_ID
    temp_set_id: str = HOUSE_ID
    temperature_entity: str | None = None
    area_id: str | None = None
    zone_id: str = HOUSE_ID
    window_sensors: tuple[str, ...] = ()
    valve_window_sensors: tuple[str, ...] = ()
    window_drop: bool = False


@dataclass(frozen=True, slots=True)
class Vacation:
    """A vacation window. `end` None means open-ended.

    `replacement`: in a zone that does not offer Holiday, the mode the zone runs instead
    during the holiday's dates (a holiday of the whole house).
    """

    start: datetime
    end: datetime | None
    mode: Mode = Mode.FROST
    replacement: HouseMode | None = None


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
            assert self.vacation is not None
            return self.vacation.replacement or HouseMode.VACATION
        return self.mode


@dataclass(frozen=True, slots=True)
class Zone:
    """A part of the house, e.g. a floor, with its own house mode and holiday.

    `modes`: the house modes the zone offers (always Normal). `replacements`: for each mode it
    does not offer, the mode it runs instead when the whole house gets that mode.
    """

    id: str
    name: str
    house: HouseState = field(default_factory=HouseState)
    modes: frozenset[HouseMode] = frozenset(HOUSE_MODES)
    replacements: Mapping[HouseMode, HouseMode] = field(default_factory=dict)

    def instead(self, mode: HouseMode) -> HouseMode:
        """Return `mode` if the zone offers it, else the mode the zone runs instead."""
        return mode if mode in self.modes else self.replacements.get(mode, HouseMode.AUTO)


@dataclass(frozen=True, slots=True)
class Override:
    """A manual change for a whole room. `temperature` None means heating off."""

    temperature: float | None
    until: datetime
    created: datetime
    origin: OverrideOrigin
    entity_id: str | None = None


@dataclass(frozen=True, slots=True)
class WindowSignals:
    """Since when each open-window signal of a room says open; None while it says closed.

    `contact`: its contact sensors, `valve`: the valves' own detection, `drop`: a fast drop of
    the room temperature.
    """

    contact: datetime | None = None
    valve: datetime | None = None
    drop: datetime | None = None


@dataclass(frozen=True, slots=True)
class RuntimeState:
    """State that changes while running: overrides, the last effective mode of each zone, the
    ends of running boosts (rooms at their valves' maximum), and since when the open-window
    signals of each room say open (`windows`, so a restart keeps the delay and the limit). The
    whole house, each zone and each room have boosts of their own; a room heats at full while any
    of them covers it."""

    overrides: Mapping[str, Override] = field(default_factory=dict)
    house_modes: Mapping[str, HouseMode] = field(default_factory=dict)
    boost_until: datetime | None = None
    zone_boosts: Mapping[str, datetime] = field(default_factory=dict)
    room_boosts: Mapping[str, datetime] = field(default_factory=dict)
    windows: Mapping[str, WindowSignals] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RoomBoost:
    """A boost for one room: the highest temperature its valves take, until `until`."""

    until: datetime
    temperature: float


@dataclass(frozen=True, slots=True)
class OpenWindow:
    """An open window in a room: heating off since `since`, at Frost guard from `limit`."""

    since: datetime
    limit: datetime


@dataclass(frozen=True, slots=True)
class Settings:
    """Global settings."""

    max_override: timedelta = timedelta(hours=4)
    safety_interval: timedelta = timedelta(minutes=5)
    mismatch_alert: timedelta = timedelta(minutes=20)
    vacation_mode: Mode = Mode.FROST
    dry_run: bool = False
    boost: timedelta = timedelta(hours=1)
    # A contact sensor counts after `window_delay`; after `window_limit` open, Frost guard.
    window_delay: timedelta = timedelta(seconds=30)
    window_limit: timedelta = timedelta(hours=1)
    # Temperature drop: open when the room falls `window_drop_degrees` within
    # `window_drop_period`; closed when it rises `window_drop_rise` above its lowest value, or
    # after `window_drop_hold`.
    window_drop_degrees: float = 1.0
    window_drop_period: timedelta = timedelta(minutes=5)
    window_drop_rise: float = 0.3
    window_drop_hold: timedelta = timedelta(minutes=30)


def _default_zones() -> dict[str, Zone]:
    return {HOUSE_ID: Zone(HOUSE_ID, "House")}


@dataclass(frozen=True, slots=True)
class Config:
    """Everything the user configures. Dict order is display order. There is always a zone."""

    rooms: Mapping[str, Room]
    plans: Mapping[str, Plan]
    temp_sets: Mapping[str, TempSet]
    zones: Mapping[str, Zone] = field(default_factory=_default_zones)
    settings: Settings = field(default_factory=Settings)
    revision: int = 0

    def zone_of(self, room: Room) -> Zone:
        """Return the zone of `room`; the first zone if the room's zone is unknown."""
        return self.zones.get(room.zone_id) or next(iter(self.zones.values()))

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
