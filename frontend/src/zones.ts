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

/**
 * `order` with `id` swapped with its neighbour in `group`, a part of `order` such as the rooms of
 * one zone: the one before it for `delta` -1, the one after it for +1. Null at either end.
 */
export function moveWithin(order: string[], group: string[], id: string, delta: -1 | 1): string[] | null {
  const index = group.indexOf(id);
  const other = index < 0 ? undefined : group[index + delta];
  if (other === undefined) return null;
  const result = [...order];
  const a = result.indexOf(id);
  const b = result.indexOf(other);
  [result[a], result[b]] = [result[b]!, result[a]!];
  return result;
}
