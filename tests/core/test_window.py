"""Open windows: the signals of a room, the drop detector, and resolve() with an open window."""

from __future__ import annotations

from datetime import timedelta

import pytest

from custom_components.heating_scheduler.core.model import (
    HouseMode,
    HouseState,
    Mode,
    OpenWindow,
    Override,
    OverrideOrigin,
    Room,
    RoomBoost,
    RuntimeState,
    Settings,
    Source,
    Target,
    TargetMode,
)
from custom_components.heating_scheduler.core.resolve import resolve
from custom_components.heating_scheduler.core.serde import (
    migrate_state,
    room_from_dict,
    room_to_dict,
    settings_from_dict,
    settings_to_dict,
    state_from_dict,
    state_to_dict,
)
from custom_components.heating_scheduler.core.validation import (
    ValidationError,
    validate_room,
    validate_settings,
)
from custom_components.heating_scheduler.core.window import (
    DropDetector,
    DropRules,
    WindowSignals,
    is_open_state,
    merge_signal,
    window_open_at,
)
from tests.builders import PRAGUE, STANDARD, TEMPS, prague

NOON = prague(2026, 10, 5, 12)
DELAY = timedelta(seconds=30)


def window(since_minutes: float = 0, limit_minutes: float = 60) -> OpenWindow:
    since = NOON + timedelta(minutes=since_minutes)
    return OpenWindow(since, since + timedelta(minutes=limit_minutes))


@pytest.mark.parametrize(
    ("state", "expected"),
    [
        ("on", True),
        ("open", True),
        ("external_open", True),
        ("Open", True),
        ("off", False),
        ("closed", False),
        ("unavailable", False),
        ("unknown", False),
        (None, False),
    ],
)
def test_open_states(state: str | None, expected: bool) -> None:
    assert is_open_state(state) is expected


def test_contact_counts_after_the_delay_valve_and_drop_at_once() -> None:
    assert window_open_at(WindowSignals(), DELAY) is None
    assert window_open_at(WindowSignals(contact=NOON), DELAY) == NOON + DELAY
    assert window_open_at(WindowSignals(valve=NOON), DELAY) == NOON
    assert window_open_at(WindowSignals(drop=NOON), DELAY) == NOON
    # The earliest signal wins.
    later = NOON + timedelta(seconds=10)
    assert window_open_at(WindowSignals(contact=NOON, valve=later), DELAY) == later
    assert window_open_at(WindowSignals(contact=NOON, drop=NOON + DELAY * 2), DELAY) == NOON + DELAY


def test_merge_signal_keeps_the_stored_instant_until_the_sensors_say_closed() -> None:
    earlier = NOON - timedelta(minutes=40)
    # Open: the earlier of the stored instant and the sensor's last change.
    assert merge_signal(None, [("on", NOON), ("off", earlier)]) == (NOON, NOON)
    assert merge_signal(earlier, [("on", NOON)]) == (earlier, earlier)
    assert merge_signal(NOON, [("on", earlier)]) == (earlier, earlier)
    # Closed: every sensor known and none open.
    assert merge_signal(earlier, [("off", NOON), ("closed", NOON)]) == (None, None)
    assert merge_signal(earlier, []) == (None, None)
    # Not known (starting, offline, missing): not open, but the instant is kept.
    assert merge_signal(earlier, [("unavailable", NOON)]) == (None, earlier)
    assert merge_signal(earlier, [("off", NOON), ("unknown", NOON)]) == (None, earlier)
    assert merge_signal(earlier, [(None, NOON)]) == (None, earlier)


def test_drop_detector_restored_after_a_restart() -> None:
    detector = DropDetector()
    detector.restore(NOON)
    assert detector.since(NOON + timedelta(minutes=10)) == NOON
    assert detector.ends() == NOON + timedelta(minutes=30)
    # The first sample becomes the lowest; a rise above it closes.
    detector.add(NOON + timedelta(minutes=10), 18.0)
    detector.add(NOON + timedelta(minutes=12), 18.2)
    assert detector.since(NOON + timedelta(minutes=12)) == NOON
    detector.add(NOON + timedelta(minutes=14), 18.3)
    assert detector.since(NOON + timedelta(minutes=14)) is None


def test_open_window_times_in_the_state_store() -> None:
    state = RuntimeState(
        windows={
            "living": WindowSignals(contact=NOON, drop=NOON + DELAY),
            "bedroom": WindowSignals(valve=NOON),
        }
    )
    assert state_from_dict(state_to_dict(state)) == state
    # 2.1 had no windows; broken instants are dropped.
    old = {key: value for key, value in state_to_dict(state).items() if key != "windows"}
    assert state_from_dict(migrate_state(2, 1, old)) == RuntimeState()
    broken = {**state_to_dict(state), "windows": {"living": {"contact": "yesterday"}, "x": 3}}
    assert state_from_dict(broken).windows == {}


def test_drop_detector_opens_on_a_fast_drop_and_closes_when_the_room_warms() -> None:
    detector = DropDetector()
    detector.add(NOON, 21.0)
    detector.add(NOON + timedelta(minutes=2), 20.5)
    assert detector.since(NOON + timedelta(minutes=2)) is None
    opened = NOON + timedelta(minutes=4)
    detector.add(opened, 19.9)
    assert detector.since(opened) == opened
    assert detector.ends() == opened + timedelta(minutes=30)
    detector.add(opened + timedelta(minutes=3), 19.0)
    detector.add(opened + timedelta(minutes=6), 19.2)  # less than 0.3 above the lowest
    assert detector.since(opened + timedelta(minutes=6)) == opened
    detector.add(opened + timedelta(minutes=8), 19.3)
    assert detector.since(opened + timedelta(minutes=8)) is None


def test_drop_detector_ignores_a_slow_drop() -> None:
    detector = DropDetector()
    for minute in range(0, 60, 2):
        detector.add(NOON + timedelta(minutes=minute), 21.0 - minute * 0.05)
        assert detector.since(NOON + timedelta(minutes=minute)) is None


def test_drop_detector_closes_after_the_hold() -> None:
    detector = DropDetector()
    detector.add(NOON, 21.0)
    detector.add(NOON + timedelta(minutes=1), 19.5)
    assert detector.since(NOON + timedelta(minutes=29)) is not None
    assert detector.since(NOON + timedelta(minutes=31)) is None
    # The next sample starts over: one sample cannot drop.
    detector.add(NOON + timedelta(minutes=31), 18.0)
    assert detector.since(NOON + timedelta(minutes=31)) is None


def test_drop_detector_follows_its_rules() -> None:
    rules = DropRules(degrees=0.5, period=timedelta(minutes=2), rise=1.0, hold=timedelta(hours=1))
    detector = DropDetector(rules)
    detector.add(NOON, 21.0)
    detector.add(NOON + timedelta(minutes=3), 20.4)  # the first sample is too old
    assert detector.since(NOON + timedelta(minutes=3)) is None
    opened = NOON + timedelta(minutes=4)
    detector.add(opened, 19.9)
    assert detector.since(opened) == opened
    detector.add(opened + timedelta(minutes=40), 20.8)  # less than 1.0 above the lowest
    assert detector.since(opened + timedelta(minutes=40)) == opened
    assert detector.ends() == opened + timedelta(hours=1)
    settings = Settings(
        window_drop_degrees=0.5,
        window_drop_period=timedelta(minutes=2),
        window_drop_rise=1.0,
        window_drop_hold=timedelta(hours=1),
    )
    assert DropRules.of(settings) == rules
    assert DropRules.of(Settings()) == DropRules()


def test_open_window_turns_heating_off_until_the_limit_then_frost_guard() -> None:
    target = resolve(NOON, HouseState(), STANDARD, TEMPS, None, PRAGUE, window=window())
    assert target.mode is TargetMode.WINDOW
    assert target.temperature is None
    assert target.source is Source.WINDOW
    assert target.valid_until == NOON + timedelta(hours=1)
    assert target.next == Target(TargetMode.WINDOW, TEMPS[Mode.FROST], Source.WINDOW)

    later = NOON + timedelta(hours=2)
    target = resolve(later, HouseState(), STANDARD, TEMPS, None, PRAGUE, window=window())
    assert target.temperature == TEMPS[Mode.FROST]
    assert target.valid_until is None  # stays open in the forecast


def test_window_that_counts_only_after_the_delay_is_the_next_change() -> None:
    target = resolve(NOON, HouseState(), STANDARD, TEMPS, None, PRAGUE, window=window(0.5))
    assert target.source is Source.PLAN
    assert target.valid_until == NOON + timedelta(seconds=30)
    assert target.next == Target(TargetMode.WINDOW, None, Source.WINDOW)


def test_window_beats_boost_and_manual_change_but_not_house_modes() -> None:
    until = NOON + timedelta(hours=1)
    override = Override(23.0, until, NOON, OverrideOrigin.USER)
    boost = RoomBoost(until, 35.0)
    target = resolve(NOON, HouseState(), STANDARD, TEMPS, override, PRAGUE, boost, window=window())
    assert target.source is Source.WINDOW
    away = resolve(NOON, HouseState(HouseMode.AWAY), STANDARD, TEMPS, None, PRAGUE, window=window())
    assert away.source is Source.HOUSE_AWAY


def test_room_and_settings_round_trip_and_old_stores() -> None:
    room = Room(
        "living",
        "Living room",
        ("climate.trv",),
        window_sensors=("binary_sensor.window",),
        valve_window_sensors=("sensor.trv_window_open",),
        window_drop=True,
    )
    assert room_from_dict(room_to_dict(room)) == room
    old = {key: value for key, value in room_to_dict(room).items() if "window" not in key}
    assert room_from_dict(old) == Room("living", "Living room", ("climate.trv",))

    settings = Settings(
        window_delay=timedelta(seconds=90),
        window_limit=timedelta(hours=2),
        window_drop_degrees=1.5,
        window_drop_period=timedelta(minutes=10),
        window_drop_rise=0.5,
        window_drop_hold=timedelta(minutes=45),
    )
    assert settings_from_dict(settings_to_dict(settings)) == settings
    stored = {k: v for k, v in settings_to_dict(Settings()).items() if "window" not in k}
    assert settings_from_dict(stored) == Settings()
    no_delay = {**settings_to_dict(Settings()), "window_delay_seconds": 0}
    assert settings_from_dict(no_delay).window_delay == timedelta(0)


def test_validation_of_window_sensors_and_settings() -> None:
    validate_room(Room("r", "R", window_sensors=("binary_sensor.a", "input_boolean.b")))
    validate_room(Room("r", "R", valve_window_sensors=("sensor.trv_window",)))
    with pytest.raises(ValidationError) as err:
        validate_room(Room("r", "R", window_sensors=("sensor.a",)))
    assert err.value.code == "invalid_entity"
    with pytest.raises(ValidationError) as err:
        validate_room(
            Room(
                "r",
                "R",
                window_sensors=("binary_sensor.a",),
                valve_window_sensors=("binary_sensor.a",),
            )
        )
    assert err.value.code == "duplicate_window_sensor"
    with pytest.raises(ValidationError) as err:
        validate_settings(Settings(window_limit=timedelta(minutes=5)))
    assert err.value.code == "setting_range"
    with pytest.raises(ValidationError):
        validate_settings(Settings(window_delay=timedelta(minutes=11)))
    for bad in (
        Settings(window_drop_degrees=0.0),
        Settings(window_drop_degrees=float("nan")),
        Settings(window_drop_rise=5.0),
        Settings(window_drop_period=timedelta(hours=2)),
        Settings(window_drop_hold=timedelta(minutes=1)),
    ):
        with pytest.raises(ValidationError) as err:
            validate_settings(bad)
        assert err.value.code == "setting_range"
