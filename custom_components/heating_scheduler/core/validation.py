"""Validation of configuration parts. Errors carry a code that the UI translates."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timedelta
import math
import re
from typing import Any

from .model import (
    DAYS_PER_WEEK,
    HOUSE_ID,
    HOUSE_MODES,
    MAX_TEMPERATURE,
    MIN_TEMPERATURE,
    SELECTABLE_HOUSE_MODES,
    TEMPERATURE_MODES,
    VACATION_MODES,
    Config,
    HouseMode,
    HouseState,
    Plan,
    Room,
    Settings,
    TempSet,
    Zone,
)

MAX_NAME_LENGTH = 60
MAX_SLOTS_PER_DAY = 48
MAX_TRVS_PER_ROOM = 10
MAX_WINDOW_SENSORS = 10
# Contact sensors may also be helpers; a valve's own detection can be a sensor with words.
WINDOW_SENSOR_DOMAINS = ("binary_sensor", "input_boolean")
VALVE_WINDOW_DOMAINS = ("binary_sensor", "sensor")

_ID_PATTERN = re.compile(r"^[a-z0-9_]{1,40}$")
_ENTITY_ID_PATTERN = re.compile(r"^(?P<domain>[a-z0-9_]+)\.[a-z0-9_]+$")

SETTINGS_LIMITS: Mapping[str, tuple[timedelta, timedelta]] = {
    "max_override": (timedelta(minutes=15), timedelta(hours=24)),
    "safety_interval": (timedelta(minutes=1), timedelta(minutes=60)),
    "mismatch_alert": (timedelta(minutes=5), timedelta(hours=24)),
    "boost": (timedelta(minutes=15), timedelta(hours=4)),
    "window_delay": (timedelta(0), timedelta(minutes=10)),
    "window_limit": (timedelta(minutes=15), timedelta(hours=24)),
    "window_drop_period": (timedelta(minutes=1), timedelta(minutes=60)),
    "window_drop_hold": (timedelta(minutes=5), timedelta(hours=4)),
}
# Temperature differences in °C.
DEGREE_LIMITS: Mapping[str, tuple[float, float]] = {
    "window_drop_degrees": (0.2, 5.0),
    "window_drop_rise": (0.1, 3.0),
}


class ValidationError(ValueError):
    """Invalid configuration. `code` is stable and translated by the UI."""

    def __init__(self, code: str, message: str = "", **details: Any) -> None:
        """Create an error with a code, a developer message and details."""
        super().__init__(message or code)
        self.code = code
        self.details = details


def _check_id(value: str, what: str) -> None:
    if not _ID_PATTERN.fullmatch(value):
        raise ValidationError("invalid_id", f"invalid {what} id: {value!r}", id=value)


def _check_name(value: str, what: str) -> None:
    if not value.strip():
        raise ValidationError("name_required", f"{what} name is empty")
    if len(value) > MAX_NAME_LENGTH:
        raise ValidationError("name_too_long", f"{what} name is too long", name=value)


def check_entity_id(value: str, domains: tuple[str, ...]) -> None:
    """Raise if `value` is not an entity id in one of `domains`."""
    match = _ENTITY_ID_PATTERN.fullmatch(value)
    if match is None or match.group("domain") not in domains:
        raise ValidationError("invalid_entity", f"invalid entity id: {value!r}", entity_id=value)


def check_temperature(value: float, what: str = "temperature") -> None:
    """Raise if a temperature entered by a person is outside the allowed range."""
    if not math.isfinite(value) or not MIN_TEMPERATURE <= value <= MAX_TEMPERATURE:
        raise ValidationError(
            "temperature_range",
            f"{what} must be between {MIN_TEMPERATURE} and {MAX_TEMPERATURE}",
            value=value,
        )


def validate_plan(plan: Plan) -> None:
    """Raise ValidationError if `plan` is not usable."""
    _check_id(plan.id, "plan")
    _check_name(plan.name, "plan")
    if len(plan.days) != DAYS_PER_WEEK:
        raise ValidationError("plan_days", "a plan needs exactly 7 days")
    for index, slots in enumerate(plan.days):
        if len(slots) > MAX_SLOTS_PER_DAY:
            raise ValidationError("too_many_slots", "too many slots in a day", day=index)
        previous = None
        for slot in slots:
            start = slot.start
            if start.tzinfo is not None or start.second or start.microsecond:
                raise ValidationError("slot_time", "slot times use whole minutes", day=index)
            if previous is not None and start <= previous:
                raise ValidationError("slot_order", "slot times must increase", day=index)
            previous = start
    if not any(plan.days):
        raise ValidationError("plan_empty", "a plan needs at least one slot")


def validate_temp_set(temp_set: TempSet, *, complete: bool) -> None:
    """Raise ValidationError if `temp_set` is not usable.

    `complete` requires a temperature for every mode (the house set).
    """
    _check_id(temp_set.id, "temperature set")
    _check_name(temp_set.name, "temperature set")
    for mode, value in temp_set.temperatures.items():
        if mode not in TEMPERATURE_MODES:
            raise ValidationError("mode_without_temperature", f"{mode} has no temperature")
        check_temperature(value, f"{mode} temperature")
    if complete and set(temp_set.temperatures) != set(TEMPERATURE_MODES):
        raise ValidationError("temperatures_incomplete", "the house needs every temperature")


def validate_room(room: Room) -> None:
    """Raise ValidationError if `room` is not usable on its own."""
    _check_id(room.id, "room")
    _check_name(room.name, "room")
    if len(room.trvs) > MAX_TRVS_PER_ROOM:
        raise ValidationError("too_many_trvs", "too many TRVs in a room")
    if len(set(room.trvs)) != len(room.trvs):
        raise ValidationError("duplicate_trv", "a TRV is listed twice")
    for entity_id in room.trvs:
        check_entity_id(entity_id, ("climate",))
    if room.temperature_entity is not None:
        check_entity_id(room.temperature_entity, ("sensor", "climate", "input_number", "number"))
    for sensors, domains in (
        (room.window_sensors, WINDOW_SENSOR_DOMAINS),
        (room.valve_window_sensors, VALVE_WINDOW_DOMAINS),
    ):
        if len(sensors) > MAX_WINDOW_SENSORS:
            raise ValidationError("too_many_window_sensors", "too many window sensors in a room")
        for entity_id in sensors:
            check_entity_id(entity_id, domains)
    windows = room.window_sensors + room.valve_window_sensors
    if len(set(windows)) != len(windows):
        raise ValidationError("duplicate_window_sensor", "a window sensor is listed twice")


def validate_settings(settings: Settings) -> None:
    """Raise ValidationError if a setting is outside its limits."""
    for name, (low, high) in SETTINGS_LIMITS.items():
        value: timedelta = getattr(settings, name)
        if not low <= value <= high:
            raise ValidationError("setting_range", f"{name} is out of range", setting=name)
    for name, (low_degrees, high_degrees) in DEGREE_LIMITS.items():
        degrees: float = getattr(settings, name)
        if not math.isfinite(degrees) or not low_degrees <= degrees <= high_degrees:
            raise ValidationError("setting_range", f"{name} is out of range", setting=name)
    if settings.vacation_mode not in VACATION_MODES:
        raise ValidationError("vacation_mode", "vacation uses frost or away")


def _check_aware(value: datetime, what: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValidationError("naive_datetime", f"{what} must include a time zone")


def validate_house(house: HouseState) -> None:
    """Raise ValidationError if the house state is inconsistent."""
    if house.mode not in SELECTABLE_HOUSE_MODES:
        raise ValidationError("house_mode", "the selected house mode cannot be vacation")
    if house.vacation is not None and house.vacation.replacement not in (
        None,
        *SELECTABLE_HOUSE_MODES,
    ):
        raise ValidationError("house_mode", "a holiday is replaced by a mode without dates")
    vacation = house.vacation
    if vacation is None:
        return
    _check_aware(vacation.start, "vacation start")
    if vacation.end is not None:
        _check_aware(vacation.end, "vacation end")
        if vacation.end <= vacation.start:
            raise ValidationError("vacation_order", "vacation must end after it starts")
    if vacation.mode not in VACATION_MODES:
        raise ValidationError("vacation_mode", "vacation uses frost or away")


def validate_zone(zone: Zone) -> None:
    """Raise ValidationError if `zone` is not usable on its own.

    A zone offers Normal; every mode it does not offer has a replacement among its modes
    without dates; its house state uses only modes it offers.
    """
    _check_id(zone.id, "zone")
    _check_name(zone.name, "zone")
    validate_house(zone.house)
    if HouseMode.AUTO not in zone.modes:
        raise ValidationError("zone_modes", "every zone offers Normal")
    missing = [mode for mode in HOUSE_MODES if mode not in zone.modes]
    if set(zone.replacements) != set(missing):
        raise ValidationError("zone_modes", "each mode a zone does not offer needs a replacement")
    for replacement in zone.replacements.values():
        if replacement not in zone.modes or replacement not in SELECTABLE_HOUSE_MODES:
            raise ValidationError("zone_modes", "a replacement is a mode the zone offers")
    house = zone.house
    if house.mode not in zone.modes:
        raise ValidationError("zone_modes", "the zone's mode is one it offers")
    vacation = house.vacation
    offers_holiday = HouseMode.VACATION in zone.modes
    if vacation is not None and (vacation.replacement is None) != offers_holiday:
        raise ValidationError("zone_modes", "a holiday in a zone without Holiday is replaced")
    if vacation is not None and vacation.replacement not in (None, *zone.modes):
        raise ValidationError("zone_modes", "a holiday's replacement is a mode the zone offers")


def _check_unique_names(names: list[str], what: str) -> None:
    seen: set[str] = set()
    for name in names:
        key = name.strip().casefold()
        if key in seen:
            raise ValidationError("duplicate_name", f"two {what} have the same name", name=name)
        seen.add(key)


def validate_config(config: Config) -> None:
    """Raise ValidationError if `config` is not consistent."""
    if HOUSE_ID not in config.plans:
        raise ValidationError("house_plan_missing", "the house plan is missing")
    if HOUSE_ID not in config.temp_sets:
        raise ValidationError("house_temps_missing", "the house temperatures are missing")
    for key, plan in config.plans.items():
        if key != plan.id:
            raise ValidationError("id_mismatch", "plan key and id differ", id=plan.id)
        validate_plan(plan)
    for key, temp_set in config.temp_sets.items():
        if key != temp_set.id:
            raise ValidationError("id_mismatch", "set key and id differ", id=temp_set.id)
        validate_temp_set(temp_set, complete=key == HOUSE_ID)
    if not config.zones:
        raise ValidationError("zones_missing", "there must be at least one zone")
    for key, zone in config.zones.items():
        if key != zone.id:
            raise ValidationError("id_mismatch", "zone key and id differ", id=zone.id)
        validate_zone(zone)
    owners: dict[str, str] = {}
    for key, room in config.rooms.items():
        if key != room.id:
            raise ValidationError("id_mismatch", "room key and id differ", id=room.id)
        validate_room(room)
        if room.plan_id not in config.plans:
            raise ValidationError("unknown_plan", "the room uses an unknown plan", id=room.plan_id)
        if room.temp_set_id not in config.temp_sets:
            raise ValidationError(
                "unknown_temp_set", "the room uses an unknown set", id=room.temp_set_id
            )
        if room.zone_id not in config.zones:
            raise ValidationError("unknown_zone", "the room is in an unknown zone", id=room.zone_id)
        for entity_id in room.trvs:
            if entity_id in owners:
                raise ValidationError(
                    "trv_in_two_rooms",
                    "a TRV can belong to one room only",
                    entity_id=entity_id,
                    room=owners[entity_id],
                )
            owners[entity_id] = room.id
    _check_unique_names([room.name for room in config.rooms.values()], "rooms")
    _check_unique_names([plan.name for plan in config.plans.values()], "plans")
    _check_unique_names([item.name for item in config.temp_sets.values()], "temperature sets")
    _check_unique_names([zone.name for zone in config.zones.values()], "zones")
    validate_settings(config.settings)
