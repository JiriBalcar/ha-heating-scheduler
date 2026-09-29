"""Property tests: the resolved target is constant until `valid_until`, then changes."""

from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from hypothesis import HealthCheck, given, settings, strategies as st

from custom_components.heating_scheduler.core.model import (
    DAYS_PER_WEEK,
    HouseMode,
    HouseState,
    Mode,
    Override,
    OverrideOrigin,
    Plan,
    Slot,
    Target,
    Vacation,
)
from custom_components.heating_scheduler.core.resolve import resolve
from tests.builders import TEMPS

ZONES = [
    ZoneInfo("Europe/Prague"),
    ZoneInfo("America/New_York"),
    ZoneInfo("Australia/Lord_Howe"),
    ZoneInfo("UTC"),
]

quarter_hours = st.integers(min_value=0, max_value=95).map(lambda q: time(q // 4, (q % 4) * 15))
modes = st.sampled_from(list(Mode))


@st.composite
def plans(draw: st.DrawFn) -> Plan:
    days = []
    for _ in range(DAYS_PER_WEEK):
        starts = sorted(draw(st.sets(quarter_hours, max_size=5)))
        days.append(tuple(Slot(start, draw(modes)) for start in starts))
    if not any(days):
        days[0] = (Slot(time(0), draw(modes)),)
    return Plan(id="house", name="Random", days=tuple(days))


instants = st.datetimes(
    min_value=datetime(2026, 1, 1),
    max_value=datetime(2028, 12, 31),
    timezones=st.just(UTC),
)


@st.composite
def houses(draw: st.DrawFn, now: datetime) -> HouseState:
    mode = draw(st.sampled_from([HouseMode.AUTO, HouseMode.AUTO, HouseMode.AWAY, HouseMode.OFF]))
    if not draw(st.booleans()):
        return HouseState(mode)
    start = now + timedelta(minutes=draw(st.integers(min_value=-3000, max_value=3000)))
    length = draw(st.one_of(st.none(), st.integers(min_value=1, max_value=20000)))
    end = None if length is None else start + timedelta(minutes=length)
    return HouseState(mode, Vacation(start, end, draw(st.sampled_from([Mode.FROST, Mode.AWAY]))))


@st.composite
def scenarios(
    draw: st.DrawFn,
) -> tuple[datetime, HouseState, Plan, Override | None, ZoneInfo]:
    now = draw(instants)
    override = None
    if draw(st.booleans()):
        minutes = draw(st.integers(min_value=-600, max_value=600))
        temperature = draw(st.one_of(st.none(), st.sampled_from([17.5, 21.0, 24.0])))
        override = Override(
            temperature=temperature,
            until=now + timedelta(minutes=minutes),
            created=now - timedelta(hours=1),
            origin=OverrideOrigin.DEVICE,
        )
    return now, draw(houses(now)), draw(plans()), override, draw(st.sampled_from(ZONES))


def _target(now: datetime, *args: object) -> Target:
    result = resolve(now, *args)  # type: ignore[arg-type]
    return Target(result.mode, result.temperature, result.source)


@settings(max_examples=300, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(scenarios())
def test_target_is_constant_until_valid_until(
    scenario: tuple[datetime, HouseState, Plan, Override | None, ZoneInfo],
) -> None:
    now, house, plan, override, tz = scenario
    result = resolve(now, house, plan, TEMPS, override, tz)
    current = Target(result.mode, result.temperature, result.source)
    if result.valid_until is None:
        assert result.next is None
        probes = [now + timedelta(hours=hours) for hours in (1, 25, 100)]
    else:
        assert result.valid_until > now
        span = result.valid_until - now
        probes = [now + span / 2, result.valid_until - timedelta(seconds=1)]
        after = _target(result.valid_until, house, plan, TEMPS, override, tz)
        assert after == result.next
        assert after != current
    for probe in probes:
        if probe > now:
            assert _target(probe, house, plan, TEMPS, override, tz) == current
