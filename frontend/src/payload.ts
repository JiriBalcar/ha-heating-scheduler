// Helpers that build websocket payloads.
import type { RoomData } from "./types";

/** The fields `room/save` expects, optionally changed. */
export function roomPayload(room: RoomData, patch: Partial<RoomData> = {}) {
  const merged = { ...room, ...patch };
  return {
    id: merged.id,
    name: merged.name,
    trvs: merged.trvs,
    plan_id: merged.plan_id,
    temp_set_id: merged.temp_set_id,
    temperature_entity: merged.temperature_entity,
    area_id: merged.area_id,
  };
}

/** `base`, or `base 2`, `base 3`, … if the name is taken (case-insensitive). */
export function uniqueName(base: string, taken: string[]): string {
  const used = new Set(taken.map((name) => name.trim().toLowerCase()));
  if (!used.has(base.trim().toLowerCase())) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}
