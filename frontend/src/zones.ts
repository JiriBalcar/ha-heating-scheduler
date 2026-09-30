// Zones: parts of the house with their own mode and holiday.
import type { HouseData, HouseMode, RoomData, Snapshot, ZoneData } from "./types";

/** The zone of a room; the first zone if the room's zone is unknown. */
export function zoneOf(snapshot: Snapshot, room: RoomData): ZoneData {
  return snapshot.zones.find((zone) => zone.id === room.zone_id) ?? snapshot.zones[0]!;
}

/** The effective mode shared by every zone, or null while the zones differ. */
export function commonMode(snapshot: Snapshot): HouseMode | null {
  const modes = new Set(snapshot.zones.map((zone) => zone.house.effective));
  return modes.size === 1 ? [...modes][0]! : null;
}

/** The house state of the whole house: the zones' state when they all agree, else null. */
export function wholeHouse(snapshot: Snapshot): HouseData | null {
  const [first, ...others] = snapshot.zones;
  if (!first) return null;
  const same = others.every((zone) => JSON.stringify(zone.house) === JSON.stringify(first.house));
  return same ? first.house : null;
}

/** Rooms of a zone, in room order. Rooms of an unknown zone count as the first zone's. */
export function roomsOf(snapshot: Snapshot, zone: ZoneData): RoomData[] {
  return snapshot.rooms.filter((room) => zoneOf(snapshot, room).id === zone.id);
}
