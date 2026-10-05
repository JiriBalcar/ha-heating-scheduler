"""Websocket API for the panel and the card. Every input is validated here."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import replace
from datetime import timedelta
from functools import wraps
from typing import Any

from homeassistant.components.websocket_api import async_register_command
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.decorators import async_response, websocket_command
from homeassistant.components.websocket_api.messages import event_message
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import (
    area_registry as ar,
    device_registry as dr,
    entity_registry as er,
    floor_registry as fr,
)
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import DOMAIN, SIGNAL_UPDATE
from .core.config_ops import (
    delete_plan,
    delete_room,
    delete_temp_set,
    delete_zone,
    fit_zone,
    put_plan,
    put_room,
    put_settings,
    put_temp_set,
    put_zone,
    reorder_rooms,
    reorder_zones,
    rooms_in_zone,
    rooms_using_plan,
    rooms_using_temp_set,
)
from .core.model import HOUSE_ID, HOUSE_MODES, Config, HouseMode, HouseState, Mode, Room, Zone
from .core.overrides import ExpiryKind
from .core.schedule_ops import new_id, normalize_day
from .core.serde import (
    datetime_from_str,
    datetime_to_str,
    override_to_dict,
    plan_from_dict,
    plan_to_dict,
    room_to_dict,
    settings_from_dict,
    settings_to_dict,
    temp_set_from_dict,
    temp_set_to_dict,
)
from .core.validation import ValidationError
from .engine import HeatingEngine

type Handler = Callable[
    [HomeAssistant, ActiveConnection, dict[str, Any], HeatingEngine], Awaitable[None]
]

PREFIX = f"{DOMAIN}/"


def _loaded_engine(hass: HomeAssistant) -> HeatingEngine | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        return None
    engine: HeatingEngine = entries[0].runtime_data
    return engine


def _guarded(
    handler: Handler,
) -> Callable[[HomeAssistant, ActiveConnection, dict[str, Any]], Awaitable[None]]:
    """Resolve the engine and turn validation errors into websocket errors."""

    @wraps(handler)
    async def wrapper(
        hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]
    ) -> None:
        engine = _loaded_engine(hass)
        if engine is None:
            connection.send_error(msg["id"], "not_loaded", "Heating Scheduler is not loaded")
            return
        try:
            await handler(hass, connection, msg, engine)
        except ValidationError as err:
            connection.send_error(msg["id"], err.code, str(err))

    return wrapper


def _house(house: HouseState, now: Any) -> dict[str, Any]:
    """The mode and holiday of a zone."""
    vacation = house.vacation
    return {
        "mode": house.mode.value,
        "effective": house.effective_mode(now).value,
        "vacation": None
        if vacation is None
        else {
            "start": datetime_to_str(vacation.start),
            "end": None if vacation.end is None else datetime_to_str(vacation.end),
            "mode": vacation.mode.value,
            "replacement": None if vacation.replacement is None else vacation.replacement.value,
            "active": house.vacation_active(now),
        },
    }


def snapshot(engine: HeatingEngine) -> dict[str, Any]:
    """Return everything the UI shows, as JSON-compatible data."""
    config = engine.config
    now = dt_util.utcnow()
    rooms = []
    for room in config.rooms.values():
        target = engine.targets.get(room.id)
        override = engine.state.overrides.get(room.id)
        rooms.append(
            {
                **room_to_dict(room),
                "current_temperature": engine.room_temperature(room),
                "target": None
                if target is None
                else {
                    "mode": target.mode.value,
                    "temperature": target.temperature,
                    "source": target.source.value,
                    "valid_until": None
                    if target.valid_until is None
                    else datetime_to_str(target.valid_until),
                    "next": None
                    if target.next is None
                    else {
                        "mode": target.next.mode.value,
                        "temperature": target.next.temperature,
                        "source": target.next.source.value,
                    },
                },
                "override": None if override is None else override_to_dict(override),
                "window": None
                if (window := engine.windows.get(room.id)) is None
                else {
                    "since": datetime_to_str(window.since),
                    "limit": datetime_to_str(window.limit),
                },
                "issues": [issue.as_dict() for issue in engine.health.get(room.id, [])],
                "trv_status": [
                    engine.workers[entity_id].as_dict()
                    for entity_id in room.trvs
                    if entity_id in engine.workers
                ],
            }
        )
    return {
        "revision": config.revision,
        "time_zone": str(dt_util.get_default_time_zone()),
        "zones": [
            {
                "id": zone.id,
                "name": zone.name,
                "house": _house(zone.house, now),
                "modes": [mode.value for mode in HOUSE_MODES if mode in zone.modes],
                "replacements": {
                    key.value: value.value for key, value in zone.replacements.items()
                },
                "rooms": rooms_in_zone(config, zone.id),
            }
            for zone in config.zones.values()
        ],
        "settings": settings_to_dict(config.settings),
        "boost_until": None if engine.boost_until is None else datetime_to_str(engine.boost_until),
        "plans": [
            {**plan_to_dict(plan), "used_by": rooms_using_plan(config, plan.id)}
            for plan in config.plans.values()
        ],
        "temp_sets": [
            {**temp_set_to_dict(item), "used_by": rooms_using_temp_set(config, item.id)}
            for item in config.temp_sets.values()
        ],
        "rooms": rooms,
    }


@websocket_command({vol.Required("type"): f"{PREFIX}subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]) -> None:
    """Send the snapshot now and after every change."""
    last: dict[str, Any] = {}

    @callback
    def push() -> None:
        engine = _loaded_engine(hass)
        if engine is None:
            return
        data = snapshot(engine)
        if data != last.get("data"):
            last["data"] = data
            connection.send_message(event_message(msg["id"], data))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_UPDATE, push)
    connection.send_result(msg["id"])
    push()


def _zone_ids(msg: dict[str, Any]) -> list[str] | None:
    """The zone of a house command as a list, or None for every zone."""
    zone_id = msg.get("zone_id")
    return None if not zone_id else [zone_id]


def _check_trvs(hass: HomeAssistant, engine: HeatingEngine, trvs: list[str]) -> None:
    registry = er.async_get(hass)
    for entity_id in trvs:
        entry = registry.async_get(entity_id)
        if entry is not None and entry.platform == DOMAIN:
            raise ValidationError(
                "invalid_trv", "a room thermostat cannot be a TRV", entity_id=entity_id
            )


ROOM_SCHEMA = vol.Schema(
    {
        vol.Optional("id"): vol.Any(None, str),
        vol.Required("name"): str,
        vol.Required("trvs"): [str],
        vol.Optional("plan_id", default=HOUSE_ID): str,
        vol.Optional("temp_set_id", default=HOUSE_ID): str,
        vol.Optional("temperature_entity"): vol.Any(None, str),
        vol.Optional("area_id"): vol.Any(None, str),
        vol.Optional("zone_id"): vol.Any(None, str),
        vol.Optional("window_sensors", default=[]): [str],
        vol.Optional("valve_window_sensors", default=[]): [str],
        vol.Optional("window_drop", default=False): bool,
    }
)


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}room/save",
        vol.Required("revision"): int,
        vol.Required("room"): ROOM_SCHEMA,
    }
)
@async_response
@_guarded
async def ws_room_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Create or change a room."""
    data = msg["room"]
    room_id = data.get("id") or new_id("room", engine.config.rooms)
    if data.get("id") and room_id not in engine.config.rooms:
        raise ValidationError("not_found", f"unknown room {room_id!r}", id=room_id)
    _check_trvs(hass, engine, data["trvs"])
    existing = engine.config.rooms.get(room_id)
    zone_id = data.get("zone_id") or (
        existing.zone_id if existing is not None else next(iter(engine.config.zones))
    )
    room = Room(
        id=room_id,
        name=data["name"].strip(),
        trvs=tuple(data["trvs"]),
        plan_id=data["plan_id"],
        temp_set_id=data["temp_set_id"],
        temperature_entity=data.get("temperature_entity") or None,
        area_id=data.get("area_id") or None,
        zone_id=zone_id,
        window_sensors=tuple(data["window_sensors"]),
        valve_window_sensors=tuple(data["valve_window_sensors"]),
        window_drop=data["window_drop"],
    )
    await engine.async_apply_config(put_room(engine.config, room), msg["revision"])
    connection.send_result(msg["id"], {"room_id": room_id, "revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}room/delete",
        vol.Required("revision"): int,
        vol.Required("room_id"): str,
    }
)
@async_response
@_guarded
async def ws_room_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Delete a room."""
    await engine.async_apply_config(delete_room(engine.config, msg["room_id"]), msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}rooms/reorder",
        vol.Required("revision"): int,
        vol.Required("order"): [str],
    }
)
@async_response
@_guarded
async def ws_rooms_reorder(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Change the order of rooms."""
    await engine.async_apply_config(reorder_rooms(engine.config, msg["order"]), msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}plan/save",
        vol.Required("revision"): int,
        vol.Required("plan"): dict,
    }
)
@async_response
@_guarded
async def ws_plan_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Create or change a plan."""
    data = dict(msg["plan"])
    plan_id = data.get("id") or new_id("plan", engine.config.plans)
    if data.get("id") and plan_id not in engine.config.plans:
        raise ValidationError("not_found", f"unknown plan {plan_id!r}", id=plan_id)
    data["id"] = plan_id
    plan = plan_from_dict(data)
    plan = replace(
        plan, name=plan.name.strip(), days=tuple(normalize_day(day) for day in plan.days)
    )
    await engine.async_apply_config(put_plan(engine.config, plan), msg["revision"])
    connection.send_result(msg["id"], {"plan_id": plan_id, "revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}plan/delete",
        vol.Required("revision"): int,
        vol.Required("plan_id"): str,
    }
)
@async_response
@_guarded
async def ws_plan_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Delete a plan; its rooms follow the house plan."""
    await engine.async_apply_config(delete_plan(engine.config, msg["plan_id"]), msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}temp_set/save",
        vol.Required("revision"): int,
        vol.Required("temp_set"): dict,
    }
)
@async_response
@_guarded
async def ws_temp_set_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Create or change a temperature set (also the house temperatures)."""
    data = dict(msg["temp_set"])
    set_id = data.get("id") or new_id("temps", engine.config.temp_sets)
    if data.get("id") and set_id not in engine.config.temp_sets:
        raise ValidationError("not_found", f"unknown set {set_id!r}", id=set_id)
    data["id"] = set_id
    temp_set = temp_set_from_dict(data)
    temp_set = replace(temp_set, name=temp_set.name.strip())
    await engine.async_apply_config(put_temp_set(engine.config, temp_set), msg["revision"])
    connection.send_result(msg["id"], {"temp_set_id": set_id, "revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}temp_set/delete",
        vol.Required("revision"): int,
        vol.Required("temp_set_id"): str,
    }
)
@async_response
@_guarded
async def ws_temp_set_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Delete a temperature set; its rooms use the house temperatures."""
    config = delete_temp_set(engine.config, msg["temp_set_id"])
    await engine.async_apply_config(config, msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}settings/save",
        vol.Required("revision"): int,
        vol.Required("settings"): dict,
    }
)
@async_response
@_guarded
async def ws_settings_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Change the settings."""
    settings = settings_from_dict(msg["settings"])
    await engine.async_apply_config(put_settings(engine.config, settings), msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}override/set",
        vol.Required("room_id"): str,
        vol.Required("temperature"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("kind", default=ExpiryKind.NEXT_CHANGE.value): vol.In(
            [kind.value for kind in ExpiryKind]
        ),
        vol.Optional("minutes"): vol.All(int, vol.Range(min=1)),
        vol.Optional("until"): str,
    }
)
@async_response
@_guarded
async def ws_override_set(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Set a manual change for a room."""
    minutes = msg.get("minutes")
    until = msg.get("until")
    override = await engine.async_set_override(
        msg["room_id"],
        msg["temperature"],
        ExpiryKind(msg["kind"]),
        duration=None if minutes is None else timedelta(minutes=minutes),
        until=None if until is None else datetime_from_str(until),
    )
    connection.send_result(msg["id"], override_to_dict(override))


@websocket_command({vol.Required("type"): f"{PREFIX}override/clear", vol.Required("room_id"): str})
@async_response
@_guarded
async def ws_override_clear(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Go back to the plan in a room."""
    await engine.async_clear_override(msg["room_id"])
    connection.send_result(msg["id"])


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}house_mode/set",
        vol.Required("mode"): vol.In([mode.value for mode in HouseMode]),
        vol.Optional("zone_id"): vol.Any(None, str),
    }
)
@async_response
@_guarded
async def ws_house_mode_set(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Select a house mode for one zone, or for every zone."""
    await engine.async_set_house_mode(HouseMode(msg["mode"]), _zone_ids(msg))
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}vacation/set",
        vol.Optional("start"): vol.Any(None, str),
        vol.Optional("end"): vol.Any(None, str),
        vol.Optional("mode"): vol.Any(None, vol.In([Mode.FROST.value, Mode.AWAY.value])),
        vol.Optional("zone_id"): vol.Any(None, str),
    }
)
@async_response
@_guarded
async def ws_vacation_set(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Set an active or planned vacation."""
    start = msg.get("start")
    end = msg.get("end")
    mode = msg.get("mode")
    await engine.async_set_vacation(
        None if start is None else datetime_from_str(start),
        None if end is None else datetime_from_str(end),
        None if mode is None else Mode(mode),
        _zone_ids(msg),
    )
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {vol.Required("type"): f"{PREFIX}vacation/cancel", vol.Optional("zone_id"): vol.Any(None, str)}
)
@async_response
@_guarded
async def ws_vacation_cancel(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Cancel the vacation of one zone, or of every zone."""
    await engine.async_cancel_vacation(_zone_ids(msg))
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}zone/save",
        vol.Required("revision"): int,
        vol.Required("zone"): vol.Schema(
            {
                vol.Optional("id"): vol.Any(None, str),
                vol.Required("name"): str,
                vol.Optional("modes"): [vol.In([mode.value for mode in HouseMode])],
                vol.Optional("replacements"): {
                    vol.In([mode.value for mode in HouseMode]): vol.In(
                        [mode.value for mode in HouseMode]
                    )
                },
            }
        ),
    }
)
@async_response
@_guarded
async def ws_zone_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Create a zone, or change its name or modes.

    A zone that no longer offers its current mode switches to the mode's replacement.
    """
    data = msg["zone"]
    zone_id = data.get("id") or new_id("zone", engine.config.zones)
    existing = engine.config.zones.get(zone_id)
    if data.get("id") and existing is None:
        raise ValidationError("not_found", f"unknown zone {zone_id!r}", id=zone_id)
    zone = existing if existing is not None else Zone(zone_id, "", HouseState())
    zone = replace(zone, name=data["name"].strip())
    if "modes" in data:
        zone = replace(
            zone,
            modes=frozenset(HouseMode(mode) for mode in data["modes"]),
            replacements={
                HouseMode(key): HouseMode(value)
                for key, value in data.get("replacements", {}).items()
            },
        )
    await engine.async_apply_config(put_zone(engine.config, fit_zone(zone)), msg["revision"])
    connection.send_result(msg["id"], {"zone_id": zone_id, "revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}zone/delete",
        vol.Required("revision"): int,
        vol.Required("zone_id"): str,
    }
)
@async_response
@_guarded
async def ws_zone_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Delete a zone; its rooms move to the first zone that remains."""
    await engine.async_apply_config(delete_zone(engine.config, msg["zone_id"]), msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}zones/reorder",
        vol.Required("revision"): int,
        vol.Required("order"): [str],
    }
)
@async_response
@_guarded
async def ws_zones_reorder(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Change the order of zones."""
    await engine.async_apply_config(reorder_zones(engine.config, msg["order"]), msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


def zones_from_floors(config: Config, room_floors: dict[str, tuple[str, str]]) -> Config:
    """Put rooms into zones named after their Home Assistant floors.

    `room_floors` maps a room id to (floor id, floor name), in floor order. A zone with the
    floor's name is reused. Zones that this leaves empty are removed, but one zone stays.
    """
    by_name = {zone.name.strip().casefold(): zone.id for zone in config.zones.values()}
    before = {zone_id: set(rooms_in_zone(config, zone_id)) for zone_id in config.zones}
    for room_id, (_floor_id, floor_name) in room_floors.items():
        zone_id = by_name.get(floor_name.strip().casefold())
        if zone_id is None:
            zone_id = new_id("zone", config.zones)
            config = put_zone(config, Zone(zone_id, floor_name.strip()))
            by_name[floor_name.strip().casefold()] = zone_id
        config = put_room(config, replace(config.rooms[room_id], zone_id=zone_id))
    for zone_id, rooms in before.items():
        if rooms and not rooms_in_zone(config, zone_id) and len(config.zones) > 1:
            config = delete_zone(config, zone_id)
    return config


def _room_floors(hass: HomeAssistant, engine: HeatingEngine) -> dict[str, tuple[str, str]]:
    """Map rooms on a floor to (floor id, floor name), in floor order.

    HA keeps its floors in the order the user gives them on its Areas page.

    A room is in its own area, or else in the area of its first valve that has one.
    """
    areas = ar.async_get(hass)
    floors = fr.async_get(hass)
    entities = er.async_get(hass)
    devices = dr.async_get(hass)
    order = {floor.floor_id: index for index, floor in enumerate(floors.async_list_floors())}
    found: list[tuple[int, str, str, str]] = []
    for room in engine.config.rooms.values():
        area_id = room.area_id or next(
            (found_area for trv in room.trvs if (found_area := _area_of(trv, entities, devices))),
            None,
        )
        entry = areas.async_get_area(area_id) if area_id else None
        floor = floors.async_get_floor(entry.floor_id) if entry and entry.floor_id else None
        if floor is not None:
            found.append((order.get(floor.floor_id, 0), room.id, floor.floor_id, floor.name))
    found.sort(key=lambda item: item[0])
    return {room_id: (floor_id, name) for _, room_id, floor_id, name in found}


@websocket_command(
    {vol.Required("type"): f"{PREFIX}zones/from_floors", vol.Required("revision"): int}
)
@async_response
@_guarded
async def ws_zones_from_floors(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Put every room whose area is on a floor into a zone named after the floor."""
    config = zones_from_floors(engine.config, _room_floors(hass, engine))
    await engine.async_apply_config(config, msg["revision"])
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command({vol.Required("type"): f"{PREFIX}log", vol.Required("room_id"): str})
@async_response
@_guarded
async def ws_log(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Return the recent log of a room, newest first."""
    engine.room(msg["room_id"])
    entries = [entry.as_dict() for entry in engine.log.entries(msg["room_id"])]
    connection.send_result(msg["id"], {"entries": entries})


@websocket_command({vol.Required("type"): f"{PREFIX}boost/start"})
@async_response
@_guarded
async def ws_boost_start(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Start a boost for the length in the settings (ends Away, Holiday and Off)."""
    await engine.async_start_boost()
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command({vol.Required("type"): f"{PREFIX}boost/stop"})
@async_response
@_guarded
async def ws_boost_stop(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """End the boost."""
    await engine.async_stop_boost()
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command({vol.Required("type"): f"{PREFIX}reconcile"})
@async_response
@_guarded
async def ws_reconcile(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Reconcile every TRV now."""
    engine.reconcile_now()
    connection.send_result(msg["id"])


def _area_of(entity_id: str, entities: er.EntityRegistry, devices: dr.DeviceRegistry) -> str | None:
    entry = entities.async_get(entity_id)
    if entry is None:
        return None
    if entry.area_id is not None:
        return entry.area_id
    if entry.device_id is not None and (device := devices.async_get(entry.device_id)) is not None:
        return device.area_id
    return None


def _name(hass: HomeAssistant, entity_id: str) -> str:
    state = hass.states.get(entity_id)
    return entity_id if state is None else state.name


@websocket_command({vol.Required("type"): f"{PREFIX}candidates"})
@async_response
@_guarded
async def ws_candidates(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Return TRV and temperature entity candidates, and areas to pre-fill rooms."""
    entities = er.async_get(hass)
    devices = dr.async_get(hass)
    areas = ar.async_get(hass)
    ours = {
        entry.entity_id
        for entry in er.async_entries_for_config_entry(entities, engine.entry.entry_id)
    }
    owner = {trv: room.id for room in engine.config.rooms.values() for trv in room.trvs}
    climates = []
    for state in hass.states.async_all("climate"):
        if state.entity_id in ours:
            continue
        climates.append(
            {
                "entity_id": state.entity_id,
                "name": state.name,
                "area_id": _area_of(state.entity_id, entities, devices),
                "room_id": owner.get(state.entity_id),
            }
        )
    temperatures = []
    for state in hass.states.async_all("sensor"):
        if state.attributes.get("device_class") != "temperature":
            continue
        temperatures.append(
            {
                "entity_id": state.entity_id,
                "name": state.name,
                "area_id": _area_of(state.entity_id, entities, devices),
                "unit": state.attributes.get("unit_of_measurement"),
            }
        )
    # A valve's own open-window detection: its entities with "window" in the id (Zigbee2MQTT
    # and ZHA name them so). The switch that turns the detection on is not one of them.
    valve_devices = {
        entry.device_id
        for item in climates
        if (entry := entities.async_get(str(item["entity_id"]))) is not None and entry.device_id
    }
    valve_windows = [
        {"entity_id": entry.entity_id, "name": _name(hass, entry.entity_id)}
        for entry in entities.entities.values()
        if entry.device_id in valve_devices
        and entry.domain in ("binary_sensor", "sensor")
        and "window" in entry.entity_id
    ]
    area_list = []
    for area in areas.async_list_areas():
        area_climates = [item["entity_id"] for item in climates if item["area_id"] == area.id]
        if not area_climates:
            continue
        area_temps = [item["entity_id"] for item in temperatures if item["area_id"] == area.id]
        area_list.append(
            {
                "area_id": area.id,
                "name": area.name,
                "climates": area_climates,
                "temperature_entity": area_temps[0] if area_temps else None,
            }
        )
    floors: dict[str, dict[str, Any]] = {}
    for room_id, (floor_id, name) in _room_floors(hass, engine).items():
        floors.setdefault(floor_id, {"floor_id": floor_id, "name": name, "rooms": []})
        floors[floor_id]["rooms"].append(room_id)
    connection.send_result(
        msg["id"],
        {
            "climates": climates,
            "temperature_entities": temperatures,
            "valve_window_entities": valve_windows,
            "areas": area_list,
            "floors": list(floors.values()),
        },
    )


@callback
def async_setup_websocket(hass: HomeAssistant) -> None:
    """Register every websocket command."""
    for command in (
        ws_subscribe,
        ws_room_save,
        ws_room_delete,
        ws_rooms_reorder,
        ws_plan_save,
        ws_plan_delete,
        ws_temp_set_save,
        ws_temp_set_delete,
        ws_settings_save,
        ws_override_set,
        ws_override_clear,
        ws_house_mode_set,
        ws_vacation_set,
        ws_vacation_cancel,
        ws_boost_start,
        ws_boost_stop,
        ws_zone_save,
        ws_zone_delete,
        ws_zones_reorder,
        ws_zones_from_floors,
        ws_log,
        ws_reconcile,
        ws_candidates,
    ):
        async_register_command(hass, command)
