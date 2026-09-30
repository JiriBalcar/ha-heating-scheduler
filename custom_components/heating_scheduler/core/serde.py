"""Convert the model to and from JSON-compatible dicts, and migrate stored data."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from datetime import datetime, time, timedelta
import math
import re
from typing import Any, cast

from .model import (
    HOUSE_ID,
    HOUSE_MODES,
    Config,
    HouseMode,
    HouseState,
    Mode,
    Override,
    OverrideOrigin,
    Plan,
    Room,
    RuntimeState,
    Settings,
    Slot,
    TempSet,
    Vacation,
    Zone,
)
from .validation import ValidationError

# 2.1: the house mode and holiday moved into zones (1.1 had one house state).
CONFIG_VERSION = 2
CONFIG_MINOR_VERSION = 2
STATE_VERSION = 2
STATE_MINOR_VERSION = 1

_TIME_PATTERN = re.compile(r"^(?P<hour>[01]\d|2[0-3]):(?P<minute>[0-5]\d)$")

type JsonDict = dict[str, Any]


def _invalid(message: str) -> ValidationError:
    return ValidationError("invalid", message)


def _get(data: Mapping[str, Any], key: str, kind: type | tuple[type, ...]) -> Any:
    if not isinstance(data, Mapping):
        raise _invalid("expected an object")
    if key not in data:
        raise _invalid(f"missing {key!r}")
    value = data[key]
    if not isinstance(value, kind) or (kind is int and isinstance(value, bool)):
        raise _invalid(f"{key!r} has a wrong type")
    return value


def _opt(data: Mapping[str, Any], key: str, kind: type | tuple[type, ...]) -> Any:
    if data.get(key) is None:
        return None
    return _get(data, key, kind)


def _enum[E](factory: Callable[[str], E], value: Any, what: str) -> E:
    try:
        return factory(value)
    except ValueError as err:
        raise _invalid(f"unknown {what}: {value!r}") from err


def _number(data: Mapping[str, Any], key: str) -> float:
    value = float(_get(data, key, (int, float)))
    if not math.isfinite(value):
        raise _invalid(f"{key!r} is not a finite number")
    return value


def time_to_str(value: time) -> str:
    """Format a slot time as HH:MM."""
    return f"{value.hour:02d}:{value.minute:02d}"


def time_from_str(value: Any) -> time:
    """Parse HH:MM."""
    match = _TIME_PATTERN.fullmatch(value) if isinstance(value, str) else None
    if match is None:
        raise _invalid(f"invalid time {value!r}")
    return time(int(match.group("hour")), int(match.group("minute")))


def datetime_to_str(value: datetime) -> str:
    """Format an aware datetime as ISO 8601."""
    return value.isoformat()


def datetime_from_str(value: Any) -> datetime:
    """Parse an aware ISO 8601 datetime."""
    if not isinstance(value, str):
        raise _invalid("a datetime must be a string")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as err:
        raise _invalid(f"invalid datetime {value!r}") from err
    if parsed.tzinfo is None:
        raise ValidationError("naive_datetime", "a datetime must include a time zone")
    return parsed


def plan_to_dict(plan: Plan) -> JsonDict:
    """Serialize a plan."""
    return {
        "id": plan.id,
        "name": plan.name,
        "days": [
            [{"start": time_to_str(slot.start), "mode": slot.mode.value} for slot in day]
            for day in plan.days
        ],
    }


def plan_from_dict(data: Mapping[str, Any]) -> Plan:
    """Parse a plan. Structure only; see `validation.validate_plan` for rules."""
    days_data = _get(data, "days", list)
    days: list[tuple[Slot, ...]] = []
    for day in days_data:
        if not isinstance(day, list):
            raise _invalid("a day must be a list of slots")
        days.append(
            tuple(
                Slot(
                    start=time_from_str(_get(slot, "start", str)),
                    mode=_enum(Mode, _get(slot, "mode", str), "mode"),
                )
                for slot in day
            )
        )
    return Plan(id=_get(data, "id", str), name=_get(data, "name", str), days=tuple(days))


def temp_set_to_dict(temp_set: TempSet) -> JsonDict:
    """Serialize a temperature set."""
    return {
        "id": temp_set.id,
        "name": temp_set.name,
        "temperatures": {mode.value: value for mode, value in temp_set.temperatures.items()},
    }


def temp_set_from_dict(data: Mapping[str, Any]) -> TempSet:
    """Parse a temperature set."""
    raw = _get(data, "temperatures", dict)
    temperatures = {
        _enum(Mode, key, "mode"): _number(raw, key) for key in cast(dict[str, Any], raw)
    }
    return TempSet(
        id=_get(data, "id", str), name=_get(data, "name", str), temperatures=temperatures
    )


def room_to_dict(room: Room) -> JsonDict:
    """Serialize a room."""
    return {
        "id": room.id,
        "name": room.name,
        "trvs": list(room.trvs),
        "plan_id": room.plan_id,
        "temp_set_id": room.temp_set_id,
        "temperature_entity": room.temperature_entity,
        "area_id": room.area_id,
        "zone_id": room.zone_id,
    }


def room_from_dict(data: Mapping[str, Any]) -> Room:
    """Parse a room."""
    trvs = _get(data, "trvs", list)
    if not all(isinstance(item, str) for item in trvs):
        raise _invalid("trvs must be entity ids")
    return Room(
        id=_get(data, "id", str),
        name=_get(data, "name", str),
        trvs=tuple(trvs),
        plan_id=_get(data, "plan_id", str),
        temp_set_id=_get(data, "temp_set_id", str),
        temperature_entity=_opt(data, "temperature_entity", str),
        area_id=_opt(data, "area_id", str),
        zone_id=_get(data, "zone_id", str),
    )


def vacation_to_dict(vacation: Vacation) -> JsonDict:
    """Serialize a vacation."""
    return {
        "start": datetime_to_str(vacation.start),
        "end": None if vacation.end is None else datetime_to_str(vacation.end),
        "mode": vacation.mode.value,
        "replacement": None if vacation.replacement is None else vacation.replacement.value,
    }


def vacation_from_dict(data: Mapping[str, Any]) -> Vacation:
    """Parse a vacation."""
    end = data.get("end")
    replacement = _opt(data, "replacement", str)
    return Vacation(
        start=datetime_from_str(_get(data, "start", str)),
        end=None if end is None else datetime_from_str(end),
        mode=_enum(Mode, _get(data, "mode", str), "vacation mode"),
        replacement=None if replacement is None else _enum(HouseMode, replacement, "house mode"),
    )


def house_to_dict(house: HouseState) -> JsonDict:
    """Serialize the house state."""
    return {
        "mode": house.mode.value,
        "vacation": None if house.vacation is None else vacation_to_dict(house.vacation),
    }


def house_from_dict(data: Mapping[str, Any]) -> HouseState:
    """Parse the house state."""
    vacation = _opt(data, "vacation", dict)
    return HouseState(
        mode=_enum(HouseMode, _get(data, "mode", str), "house mode"),
        vacation=None if vacation is None else vacation_from_dict(vacation),
    )


def zone_to_dict(zone: Zone) -> JsonDict:
    """Serialize a zone. Its modes keep the order of HOUSE_MODES."""
    return {
        "id": zone.id,
        "name": zone.name,
        "house": house_to_dict(zone.house),
        "modes": [mode.value for mode in HOUSE_MODES if mode in zone.modes],
        "replacements": {key.value: value.value for key, value in zone.replacements.items()},
    }


def zone_from_dict(data: Mapping[str, Any]) -> Zone:
    """Parse a zone. Without `modes` (before 2.2), it offers every mode."""
    modes = _opt(data, "modes", list)
    replacements = _opt(data, "replacements", dict) or {}
    return Zone(
        id=_get(data, "id", str),
        name=_get(data, "name", str),
        house=house_from_dict(_get(data, "house", dict)),
        modes=frozenset(HOUSE_MODES)
        if modes is None
        else frozenset(_enum(HouseMode, mode, "house mode") for mode in modes),
        replacements={
            _enum(HouseMode, key, "house mode"): _enum(HouseMode, value, "house mode")
            for key, value in replacements.items()
        },
    )


def _minutes(value: timedelta) -> int:
    return int(value.total_seconds() // 60)


def settings_to_dict(settings: Settings) -> JsonDict:
    """Serialize settings. Durations are stored in minutes."""
    return {
        "max_override_minutes": _minutes(settings.max_override),
        "safety_interval_minutes": _minutes(settings.safety_interval),
        "mismatch_alert_minutes": _minutes(settings.mismatch_alert),
        "vacation_mode": settings.vacation_mode.value,
        "dry_run": settings.dry_run,
        "boost_minutes": _minutes(settings.boost),
    }


def settings_from_dict(data: Mapping[str, Any]) -> Settings:
    """Parse settings."""
    return Settings(
        max_override=timedelta(minutes=_get(data, "max_override_minutes", int)),
        safety_interval=timedelta(minutes=_get(data, "safety_interval_minutes", int)),
        mismatch_alert=timedelta(minutes=_get(data, "mismatch_alert_minutes", int)),
        vacation_mode=_enum(Mode, _get(data, "vacation_mode", str), "vacation mode"),
        dry_run=_get(data, "dry_run", bool),
        # Added after 2.1; older stores use the default.
        boost=timedelta(minutes=_opt(data, "boost_minutes", int) or 60),
    )


def config_to_dict(config: Config) -> JsonDict:
    """Serialize the whole configuration."""
    return {
        "revision": config.revision,
        "rooms": [room_to_dict(room) for room in config.rooms.values()],
        "plans": [plan_to_dict(plan) for plan in config.plans.values()],
        "temp_sets": [temp_set_to_dict(item) for item in config.temp_sets.values()],
        "zones": [zone_to_dict(zone) for zone in config.zones.values()],
        "settings": settings_to_dict(config.settings),
    }


def config_from_dict(data: Mapping[str, Any]) -> Config:
    """Parse the whole configuration. Structure only; see `validation.validate_config`."""
    rooms = [room_from_dict(item) for item in _get(data, "rooms", list)]
    plans = [plan_from_dict(item) for item in _get(data, "plans", list)]
    temp_sets = [temp_set_from_dict(item) for item in _get(data, "temp_sets", list)]
    zones = [zone_from_dict(item) for item in _get(data, "zones", list)]
    return Config(
        rooms={room.id: room for room in rooms},
        plans={plan.id: plan for plan in plans},
        temp_sets={item.id: item for item in temp_sets},
        zones={zone.id: zone for zone in zones},
        settings=settings_from_dict(_get(data, "settings", dict)),
        revision=_get(data, "revision", int),
    )


def override_to_dict(override: Override) -> JsonDict:
    """Serialize a manual change."""
    return {
        "temperature": override.temperature,
        "until": datetime_to_str(override.until),
        "created": datetime_to_str(override.created),
        "origin": override.origin.value,
        "entity_id": override.entity_id,
    }


def override_from_dict(data: Mapping[str, Any]) -> Override:
    """Parse a manual change."""
    temperature = None if data.get("temperature") is None else _number(data, "temperature")
    return Override(
        temperature=temperature,
        until=datetime_from_str(_get(data, "until", str)),
        created=datetime_from_str(_get(data, "created", str)),
        origin=_enum(OverrideOrigin, _get(data, "origin", str), "origin"),
        entity_id=_opt(data, "entity_id", str),
    )


def state_to_dict(state: RuntimeState) -> JsonDict:
    """Serialize runtime state."""
    return {
        "overrides": {key: override_to_dict(item) for key, item in state.overrides.items()},
        "house_modes": {key: mode.value for key, mode in state.house_modes.items()},
        "boost_until": None if state.boost_until is None else datetime_to_str(state.boost_until),
        "zone_boosts": {key: datetime_to_str(end) for key, end in state.zone_boosts.items()},
        "room_boosts": {key: datetime_to_str(end) for key, end in state.room_boosts.items()},
    }


def _boost_ends(data: Mapping[str, Any], key: str) -> dict[str, datetime]:
    """Parse the boost ends of zones or rooms; invalid ones are dropped."""
    ends: dict[str, datetime] = {}
    for item, value in (_opt(data, key, dict) or {}).items():
        try:
            ends[item] = datetime_from_str(value)
        except ValidationError:
            continue
    return ends


def state_from_dict(data: Mapping[str, Any]) -> RuntimeState:
    """Parse runtime state. Invalid overrides are dropped, they are only runtime data."""
    raw = _get(data, "overrides", dict)
    overrides: dict[str, Override] = {}
    for key, item in raw.items():
        try:
            overrides[key] = override_from_dict(item)
        except ValidationError:
            continue
    house_modes: dict[str, HouseMode] = {}
    for key, value in (_opt(data, "house_modes", dict) or {}).items():
        try:
            house_modes[key] = _enum(HouseMode, value, "house mode")
        except ValidationError:
            continue
    boost_until: datetime | None = None
    try:
        raw_boost = _opt(data, "boost_until", str)
        boost_until = None if raw_boost is None else datetime_from_str(raw_boost)
    except ValidationError:
        pass
    return RuntimeState(
        overrides=overrides,
        house_modes=house_modes,
        boost_until=boost_until,
        zone_boosts=_boost_ends(data, "zone_boosts"),
        room_boosts=_boost_ends(data, "room_boosts"),
    )


def migrate_config(
    old_major: int, old_minor: int, data: JsonDict, zone_name: str = "House"
) -> JsonDict:
    """Migrate stored configuration data to the current version, one step per version.

    1.x -> 2.1: the house state becomes the first zone, named `zone_name`, with every room.
    2.1 -> 2.2: nothing changes; a zone stored without `modes` offers every mode.
    """
    if old_major > CONFIG_VERSION:
        raise ValueError(f"configuration version {old_major} is newer than this integration")
    del old_minor
    if old_major < 2:
        house = data.get("house")
        data = {key: value for key, value in data.items() if key != "house"}
        data["zones"] = [{"id": HOUSE_ID, "name": zone_name, "house": house}]
        data["rooms"] = [{**room, "zone_id": HOUSE_ID} for room in data.get("rooms", [])]
    return data


def migrate_state(old_major: int, old_minor: int, data: JsonDict) -> JsonDict:
    """Migrate stored runtime state to the current version.

    1.x -> 2.1: the last effective house mode becomes the mode of the first zone.
    """
    if old_major > STATE_VERSION:
        raise ValueError(f"state version {old_major} is newer than this integration")
    del old_minor
    if old_major < 2:
        mode = data.get("house_mode")
        data = {key: value for key, value in data.items() if key != "house_mode"}
        data["house_modes"] = {} if mode is None else {HOUSE_ID: mode}
    return data
