"""Pure transformations of the configuration (add, change, delete, reorder)."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import replace

from .model import HOUSE_ID, Config, HouseState, Plan, Room, Settings, TempSet, Zone
from .validation import ValidationError


def rooms_using_plan(config: Config, plan_id: str) -> list[str]:
    """Return the ids of rooms that follow `plan_id`."""
    return [room.id for room in config.rooms.values() if room.plan_id == plan_id]


def rooms_using_temp_set(config: Config, temp_set_id: str) -> list[str]:
    """Return the ids of rooms that use `temp_set_id`."""
    return [room.id for room in config.rooms.values() if room.temp_set_id == temp_set_id]


def put_room(config: Config, room: Room) -> Config:
    """Add `room`, or replace the room with the same id (keeping its position)."""
    return replace(config, rooms={**config.rooms, room.id: room})


def delete_room(config: Config, room_id: str) -> Config:
    """Remove a room."""
    if room_id not in config.rooms:
        raise ValidationError("not_found", f"unknown room {room_id!r}", id=room_id)
    return replace(config, rooms={k: v for k, v in config.rooms.items() if k != room_id})


def reorder_rooms(config: Config, order: Sequence[str]) -> Config:
    """Return `config` with rooms in `order`, which must list every room once."""
    if sorted(order) != sorted(config.rooms) or len(set(order)) != len(order):
        raise ValidationError("invalid_order", "the order must list every room once")
    return replace(config, rooms={room_id: config.rooms[room_id] for room_id in order})


def put_plan(config: Config, plan: Plan) -> Config:
    """Add `plan`, or replace the plan with the same id."""
    return replace(config, plans={**config.plans, plan.id: plan})


def delete_plan(config: Config, plan_id: str) -> Config:
    """Remove a plan. Rooms that used it follow the house plan."""
    if plan_id == HOUSE_ID:
        raise ValidationError("house_protected", "the house plan cannot be deleted")
    if plan_id not in config.plans:
        raise ValidationError("not_found", f"unknown plan {plan_id!r}", id=plan_id)
    rooms = {
        key: replace(room, plan_id=HOUSE_ID) if room.plan_id == plan_id else room
        for key, room in config.rooms.items()
    }
    plans = {key: plan for key, plan in config.plans.items() if key != plan_id}
    return replace(config, rooms=rooms, plans=plans)


def put_temp_set(config: Config, temp_set: TempSet) -> Config:
    """Add `temp_set`, or replace the set with the same id."""
    return replace(config, temp_sets={**config.temp_sets, temp_set.id: temp_set})


def delete_temp_set(config: Config, temp_set_id: str) -> Config:
    """Remove a temperature set. Rooms that used it use the house temperatures."""
    if temp_set_id == HOUSE_ID:
        raise ValidationError("house_protected", "the house temperatures cannot be deleted")
    if temp_set_id not in config.temp_sets:
        raise ValidationError("not_found", f"unknown set {temp_set_id!r}", id=temp_set_id)
    rooms = {
        key: replace(room, temp_set_id=HOUSE_ID) if room.temp_set_id == temp_set_id else room
        for key, room in config.rooms.items()
    }
    sets = {key: item for key, item in config.temp_sets.items() if key != temp_set_id}
    return replace(config, rooms=rooms, temp_sets=sets)


def put_settings(config: Config, settings: Settings) -> Config:
    """Replace the settings."""
    return replace(config, settings=settings)


def rooms_in_zone(config: Config, zone_id: str) -> list[str]:
    """Return the ids of rooms in `zone_id`."""
    return [room.id for room in config.rooms.values() if room.zone_id == zone_id]


def put_zone(config: Config, zone: Zone) -> Config:
    """Add `zone`, or replace the zone with the same id (keeping its position)."""
    return replace(config, zones={**config.zones, zone.id: zone})


def delete_zone(config: Config, zone_id: str) -> Config:
    """Remove a zone. Its rooms move to the first zone that remains."""
    if zone_id not in config.zones:
        raise ValidationError("not_found", f"unknown zone {zone_id!r}", id=zone_id)
    zones = {key: zone for key, zone in config.zones.items() if key != zone_id}
    if not zones:
        raise ValidationError("last_zone", "the last zone cannot be deleted")
    first = next(iter(zones))
    rooms = {
        key: replace(room, zone_id=first) if room.zone_id == zone_id else room
        for key, room in config.rooms.items()
    }
    return replace(config, rooms=rooms, zones=zones)


def reorder_zones(config: Config, order: Sequence[str]) -> Config:
    """Return `config` with zones in `order`, which must list every zone once."""
    if sorted(order) != sorted(config.zones) or len(set(order)) != len(order):
        raise ValidationError("invalid_order", "the order must list every zone once")
    return replace(config, zones={zone_id: config.zones[zone_id] for zone_id in order})


def put_zone_house(config: Config, zone_id: str, house: HouseState) -> Config:
    """Replace the house state of one zone."""
    zone = config.zones.get(zone_id)
    if zone is None:
        raise ValidationError("not_found", f"unknown zone {zone_id!r}", id=zone_id)
    return put_zone(config, replace(zone, house=house))
