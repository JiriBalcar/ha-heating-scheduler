import { describe, expect, it } from "vitest";
import type { HouseData, RoomData, Snapshot, ZoneData } from "../src/types";
import { commonMode, roomsOf, wholeHouse, zoneOf } from "../src/zones";

const AUTO: HouseData = { mode: "auto", effective: "auto", vacation: null };
const AWAY: HouseData = { mode: "away", effective: "away", vacation: null };

function zone(id: string, house: HouseData): ZoneData {
  return { id, name: id, house, rooms: [] };
}

function room(id: string, zone_id: string): RoomData {
  return { id, name: id, zone_id } as RoomData;
}

function snapshot(zones: ZoneData[], rooms: RoomData[] = []): Snapshot {
  return { zones, rooms } as unknown as Snapshot;
}

describe("zones", () => {
  it("finds the zone of a room, or the first zone", () => {
    const data = snapshot([zone("down", AUTO), zone("up", AWAY)]);
    expect(zoneOf(data, room("bed", "up")).id).toBe("up");
    expect(zoneOf(data, room("attic", "gone")).id).toBe("down");
  });

  it("knows whether the zones agree", () => {
    expect(commonMode(snapshot([zone("down", AUTO), zone("up", AUTO)]))).toBe("auto");
    expect(commonMode(snapshot([zone("down", AUTO), zone("up", AWAY)]))).toBeNull();
    expect(wholeHouse(snapshot([zone("down", AWAY), zone("up", AWAY)]))).toEqual(AWAY);
    expect(wholeHouse(snapshot([zone("down", AUTO), zone("up", AWAY)]))).toBeNull();
  });

  it("lists the rooms of a zone in room order", () => {
    const rooms = [room("living", "down"), room("bed", "up"), room("kitchen", "down"), room("x", "gone")];
    const data = snapshot([zone("down", AUTO), zone("up", AUTO)], rooms);
    expect(roomsOf(data, data.zones[0]!).map((item) => item.id)).toEqual(["living", "kitchen", "x"]);
    expect(roomsOf(data, data.zones[1]!).map((item) => item.id)).toEqual(["bed"]);
  });
});
