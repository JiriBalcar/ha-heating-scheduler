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
)
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import DOMAIN, SIGNAL_UPDATE
from .core.config_ops import (
    delete_plan,
    delete_room,
    delete_temp_set,
    put_plan,
    put_room,
    put_settings,
    put_temp_set,
    reorder_rooms,
    rooms_using_plan,
    rooms_using_temp_set,
)
from .core.model import HOUSE_ID, HouseMode, Mode, Room
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


def snapshot(engine: HeatingEngine) -> dict[str, Any]:
    """Return everything the UI shows, as JSON-compatible data."""
    config = engine.config
    now = dt_util.utcnow()
    house = config.house
    vacation = house.vacation
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
        "house": {
            "mode": house.mode.value,
            "effective": house.effective_mode(now).value,
            "vacation": None
            if vacation is None
            else {
                "start": datetime_to_str(vacation.start),
                "end": None if vacation.end is None else datetime_to_str(vacation.end),
                "mode": vacation.mode.value,
                "active": house.vacation_active(now),
            },
        },
        "settings": settings_to_dict(config.settings),
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
    room = Room(
        id=room_id,
        name=data["name"].strip(),
        trvs=tuple(data["trvs"]),
        plan_id=data["plan_id"],
        temp_set_id=data["temp_set_id"],
        temperature_entity=data.get("temperature_entity") or None,
        area_id=data.get("area_id") or None,
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
    }
)
@async_response
@_guarded
async def ws_house_mode_set(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Select a house mode."""
    await engine.async_set_house_mode(HouseMode(msg["mode"]))
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command(
    {
        vol.Required("type"): f"{PREFIX}vacation/set",
        vol.Optional("start"): vol.Any(None, str),
        vol.Optional("end"): vol.Any(None, str),
        vol.Optional("mode"): vol.Any(None, vol.In([Mode.FROST.value, Mode.AWAY.value])),
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
    )
    connection.send_result(msg["id"], {"revision": engine.config.revision})


@websocket_command({vol.Required("type"): f"{PREFIX}vacation/cancel"})
@async_response
@_guarded
async def ws_vacation_cancel(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], engine: HeatingEngine
) -> None:
    """Cancel the vacation."""
    await engine.async_cancel_vacation()
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
    connection.send_result(
        msg["id"],
        {"climates": climates, "temperature_entities": temperatures, "areas": area_list},
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
        ws_log,
        ws_reconcile,
        ws_candidates,
    ):
        async_register_command(hass, command)
