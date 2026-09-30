"""Base entities and device handling."""

from __future__ import annotations

from collections.abc import Callable, Iterable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import DOMAIN, SIGNAL_ROOMS_CHANGED, SIGNAL_UPDATE, SIGNAL_ZONES_CHANGED, VERSION
from .core.model import Room, RoomTarget, Zone
from .engine import HeatingEngine

HOUSE_DEVICE = "house"


def house_device_info() -> DeviceInfo:
    """Return the device of house-wide entities."""
    return DeviceInfo(
        identifiers={(DOMAIN, HOUSE_DEVICE)},
        translation_key="house",
        manufacturer="Heating Scheduler",
        model="House",
        sw_version=VERSION,
        entry_type=DeviceEntryType.SERVICE,
    )


def room_device_info(room: Room) -> DeviceInfo:
    """Return the device of a room."""
    return DeviceInfo(
        identifiers={(DOMAIN, room.id)},
        name=room.name,
        manufacturer="Heating Scheduler",
        model="Room",
        sw_version=VERSION,
        entry_type=DeviceEntryType.SERVICE,
    )


@callback
def async_sync_devices(hass: HomeAssistant, entry: ConfigEntry, engine: HeatingEngine) -> None:
    """Create, rename, move and remove room devices to match the configuration.

    The area of a room device follows the room's `area_id` when it is set, and when it
    changes (also to none). A device area set by hand in Home Assistant for a room that
    never had an `area_id` is left alone.
    """
    registry = dr.async_get(hass)
    rooms = engine.config.rooms
    synced = engine.device_areas
    for room in rooms.values():
        device = registry.async_get_or_create(
            config_entry_id=entry.entry_id, **room_device_info(room)
        )
        changes: dict[str, str | None] = {}
        if device.name != room.name:
            changes["name"] = room.name
        if room.id in synced:
            area_changed = synced[room.id] != room.area_id
        else:
            area_changed = room.area_id is not None
        if area_changed and device.area_id != room.area_id:
            changes["area_id"] = room.area_id
        synced[room.id] = room.area_id
        if changes:
            registry.async_update_device(device.id, **changes)  # type: ignore[arg-type]
    for room_id in list(synced):
        if room_id not in rooms:
            del synced[room_id]
    for device in dr.async_entries_for_config_entry(registry, entry.entry_id):
        room_ids = {value for domain, value in device.identifiers if domain == DOMAIN}
        if room_ids and HOUSE_DEVICE not in room_ids and not room_ids & set(rooms):
            registry.async_remove_device(device.id)


@callback
def async_add_room_entities(
    hass: HomeAssistant,
    entry: ConfigEntry,
    engine: HeatingEngine,
    async_add_entities: AddConfigEntryEntitiesCallback,
    factory: Callable[[HeatingEngine, str], Iterable[Entity]],
) -> None:
    """Add entities for every room now and for rooms added later."""
    known: set[str] = set()

    @callback
    def add_new_rooms() -> None:
        new = [room_id for room_id in engine.config.rooms if room_id not in known]
        known.intersection_update(engine.config.rooms)
        known.update(new)
        entities = [entity for room_id in new for entity in factory(engine, room_id)]
        if entities:
            async_add_entities(entities)

    add_new_rooms()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ROOMS_CHANGED, add_new_rooms))


def zone_unique_id(zone_id: str, key: str) -> str:
    """Return the unique id of a zone's entity."""
    return f"zone_{zone_id}_{key}"


@callback
def async_add_zone_entities(
    hass: HomeAssistant,
    entry: ConfigEntry,
    engine: HeatingEngine,
    async_add_entities: AddConfigEntryEntitiesCallback,
    domain: str,
    key: str,
    factory: Callable[[HeatingEngine, str], Entity],
) -> None:
    """Add an entity per zone while there are two or more zones, and remove those of removed
    zones. With one zone, the entity of the whole house covers it."""
    registry = er.async_get(hass)
    known: set[str] = set()

    @callback
    def sync_zones() -> None:
        zones = engine.config.zones
        wanted = set(zones) if len(zones) > 1 else set()
        for zone_id in known - wanted:
            entity_id = registry.async_get_entity_id(domain, DOMAIN, zone_unique_id(zone_id, key))
            if entity_id is not None:
                registry.async_remove(entity_id)
        known.intersection_update(wanted)
        added = [zone_id for zone_id in zones if zone_id in wanted and zone_id not in known]
        known.update(added)
        if added:
            async_add_entities([factory(engine, zone_id) for zone_id in added])

    sync_zones()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ZONES_CHANGED, sync_zones))


class HeatingEntity(Entity):
    """An entity that updates whenever the engine notifies."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, engine: HeatingEngine) -> None:
        """Store the engine."""
        self._engine = engine

    async def async_added_to_hass(self) -> None:
        """Listen for engine updates."""
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_UPDATE, self._handle_engine_update)
        )

    @callback
    def _handle_engine_update(self) -> None:
        self.async_write_ha_state()


class RoomEntity(HeatingEntity):
    """An entity of one room."""

    def __init__(self, engine: HeatingEngine, room_id: str, key: str) -> None:
        """Create the entity for `room_id`."""
        super().__init__(engine)
        self._room_id = room_id
        self._attr_unique_id = f"{room_id}_{key}"
        self._attr_device_info = room_device_info(engine.config.rooms[room_id])

    @property
    def room(self) -> Room | None:
        """Return the room, or None if it was removed."""
        return self._engine.config.rooms.get(self._room_id)

    @property
    def target(self) -> RoomTarget | None:
        """Return the current target of the room."""
        return self._engine.targets.get(self._room_id)

    @property
    def available(self) -> bool:
        """Return True while the room exists and has a target."""
        return self.room is not None and self.target is not None

    @callback
    def _handle_engine_update(self) -> None:
        if self.room is not None:
            self.async_write_ha_state()


class ZoneEntity(HeatingEntity):
    """An entity of one zone, on the house device; its name holds the zone's name."""

    def __init__(self, engine: HeatingEngine, zone_id: str, key: str) -> None:
        """Create the entity for `zone_id`."""
        super().__init__(engine)
        self.zone_id = zone_id
        self._attr_unique_id = zone_unique_id(zone_id, key)
        self._attr_device_info = house_device_info()
        self._attr_translation_placeholders = {"zone": engine.config.zones[zone_id].name}

    @property
    def zone(self) -> Zone | None:
        """Return the zone, or None once it is deleted."""
        return self._engine.config.zones.get(self.zone_id)

    @property
    def available(self) -> bool:
        """Return True while the zone exists."""
        return self.zone is not None

    @callback
    def _handle_engine_update(self) -> None:
        zone = self.zone
        if zone is not None and self._attr_translation_placeholders != {"zone": zone.name}:
            self._attr_translation_placeholders = {"zone": zone.name}
            # HA caches the name, and new placeholders do not clear it (only a new _attr_name
            # does, in the same way). Without this, a renamed zone keeps its old name.
            self.__dict__.pop("name", None)
        super()._handle_engine_update()
