// Zones: parts of the house with their own mode and holiday.
import { HOUSE_MODES, type HouseData, type HouseMode, type RoomData, type Snapshot, type ZoneData } from "./types";

/** The zone of a room; the first zone if the room's zone is unknown. */
export function zoneOf(snapshot: Snapshot, room: RoomData): ZoneData {
  return snapshot.zones.find((zone) => zone.id === room.zone_id) ?? snapshot.zones[0]!;
}

/** `mode` if the zone offers it, else the mode the zone runs instead, as the integration decides. */
export function instead(zone: ZoneData, mode: HouseMode): HouseMode {
  return zone.modes.includes(mode) ? mode : (zone.replacements[mode] ?? "auto");
}

/** The modes a tile offers: its zone's; for the whole house every mode, or its one zone's. */
export function offeredModes(snapshot: Snapshot, zone: ZoneData | null): HouseMode[] {
  const own = zone ?? (snapshot.zones.length === 1 ? snapshot.zones[0]! : null);
  return own ? HOUSE_MODES.filter((mode) => own.modes.includes(mode)) : [...HOUSE_MODES];
}

/**
 * The mode of the whole house, or null while the zones differ. A zone that runs its replacement
 * for a mode it does not offer counts as in that mode.
 */
export function commonMode(snapshot: Snapshot): HouseMode | null {
  return HOUSE_MODES.find((mode) => snapshot.zones.every((zone) => zone.house.effective === instead(zone, mode))) ?? null;
}

/**
 * The house state of the whole house: the state of the zones that run its mode themselves, when
 * they agree, else null. Whether a holiday is replaced in a zone does not count.
 */
export function wholeHouse(snapshot: Snapshot): HouseData | null {
  const mode = commonMode(snapshot);
  if (mode === null) return null;
  const own = snapshot.zones.filter((zone) => zone.modes.includes(mode));
  const [first, ...others] = own.length > 0 ? own : snapshot.zones;
  if (!first) return null;
  const key = (house: HouseData) =>
    JSON.stringify({ ...house, vacation: house.vacation && { ...house.vacation, replacement: null } });
  return others.every((zone) => key(zone.house) === key(first.house)) ? first.house : null;
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
