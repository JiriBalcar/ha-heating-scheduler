"""Small builders shared by core and Home Assistant tests."""

from __future__ import annotations

from datetime import UTC, datetime, time
from zoneinfo import ZoneInfo

from custom_components.heating_scheduler.core.config_ops import put_zone_house
from custom_components.heating_scheduler.core.model import (
    DAYS_PER_WEEK,
    DEFAULT_TEMPERATURES,
    Config,
    HouseState,
    Mode,
    Plan,
    Slot,
)

PRAGUE = ZoneInfo("Europe/Prague")
TEMPS: dict[Mode, float] = dict(DEFAULT_TEMPERATURES)

# A normal week: Monday 2026-10-05 .. Sunday 2026-10-11 (CEST, UTC+2).
MONDAY = (2026, 10, 5)


def utc(
    year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: int = 0
) -> datetime:
    """Return an aware UTC datetime."""
    return datetime(year, month, day, hour, minute, second, tzinfo=UTC)


def prague(year: int, month: int, day: int, hour: int = 0, minute: int = 0) -> datetime:
    """Return an aware Europe/Prague datetime (first occurrence if ambiguous)."""
    return datetime(year, month, day, hour, minute, tzinfo=PRAGUE)


def slots(*items: tuple[str, Mode]) -> tuple[Slot, ...]:
    """Build slots from ("HH:MM", mode) pairs."""
    result = []
    for start, mode in items:
        hour, minute = start.split(":")
        result.append(Slot(time(int(hour), int(minute)), mode))
    return tuple(result)


def week(*days: tuple[Slot, ...], plan_id: str = "house", name: str = "House plan") -> Plan:
    """Build a plan from 7 days of slots."""
    assert len(days) == DAYS_PER_WEEK
    return Plan(id=plan_id, name=name, days=tuple(days))


def uniform(*items: tuple[str, Mode], plan_id: str = "house", name: str = "House plan") -> Plan:
    """Build a plan with the same slots every day."""
    day = slots(*items)
    return Plan(id=plan_id, name=name, days=tuple(day for _ in range(DAYS_PER_WEEK)))


# The default house plan: night, warm 06:00-22:00.
STANDARD = uniform(("00:00", Mode.NIGHT), ("06:00", Mode.COMFORT), ("22:00", Mode.NIGHT))


def house_of(config: Config) -> HouseState:
    """Return the house state of the first zone (tests with one zone)."""
    return next(iter(config.zones.values())).house


def with_house(config: Config, house: HouseState) -> Config:
    """Return `config` with the house state of its first zone replaced."""
    return put_zone_house(config, next(iter(config.zones)), house)
