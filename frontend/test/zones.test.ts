import { describe, expect, it } from "vitest";
import type { HouseData, HouseMode, RoomData, Snapshot, ZoneData } from "../src/types";
import { commonMode, instead, moveWithin, offeredModes, roomsOf, wholeHouse, zoneOf } from "../src/zones";

const AUTO: HouseData = { mode: "auto", effective: "auto", vacation: null };
const AWAY: HouseData = { mode: "away", effective: "away", vacation: null };

const ALL: HouseMode[] = ["auto", "away", "vacation", "frost", "off"];

function zone(id: string, house: HouseData, modes: HouseMode[] = ALL, replacements = {}): ZoneData {
  return { id, name: id, house, modes, replacements, rooms: [] };
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

  it("counts a zone that runs its replacement as in the whole house's mode", () => {
    // Upstairs has no Away and no Holiday: Normal for Away, Frost guard on holiday.
    const replacements: Partial<Record<HouseMode, HouseMode>> = { away: "auto", vacation: "frost" };
    const upstairs = (house: HouseData) => zone("up", house, ["auto", "frost", "off"], replacements);
    expect(instead(upstairs(AUTO), "away")).toBe("auto");
    expect(instead(upstairs(AUTO), "off")).toBe("off");
    expect(commonMode(snapshot([zone("down", AWAY), upstairs(AUTO)]))).toBe("away");
    expect(wholeHouse(snapshot([zone("down", AWAY), upstairs(AUTO)]))).toEqual(AWAY);

    const holiday = { start: "2026-10-10T06:00:00Z", end: "2026-10-12T10:00:00Z", mode: "frost" as const, active: true };
    const down: HouseData = { mode: "auto", effective: "vacation", vacation: { ...holiday, replacement: null } };
    const up: HouseData = { mode: "auto", effective: "frost", vacation: { ...holiday, replacement: "frost" } };
    expect(commonMode(snapshot([zone("down", down), upstairs(up)]))).toBe("vacation");
    expect(wholeHouse(snapshot([zone("down", down), upstairs(up)]))).toEqual(down);
    // A planned holiday of the whole house is one plan, replaced or not.
    const plannedDown: HouseData = { mode: "auto", effective: "auto", vacation: { ...holiday, active: false, replacement: null } };
    const plannedUp: HouseData = { mode: "auto", effective: "auto", vacation: { ...holiday, active: false, replacement: "frost" } };
    expect(wholeHouse(snapshot([zone("down", plannedDown), upstairs(plannedUp)]))).toEqual(plannedDown);
  });

  it("offers a zone's modes on its tile, and every mode for the whole house", () => {
    const up = zone("up", AUTO, ["auto", "frost", "off"], { away: "auto", vacation: "frost" });
    const data = snapshot([zone("down", AUTO), up]);
    expect(offeredModes(data, up)).toEqual(["auto", "frost", "off"]);
    expect(offeredModes(data, null)).toEqual(ALL);
    // With one zone, the whole house is that zone.
    expect(offeredModes(snapshot([up]), null)).toEqual(["auto", "frost", "off"]);
  });

  it("lists the rooms of a zone in room order", () => {
    const rooms = [room("living", "down"), room("bed", "up"), room("kitchen", "down"), room("x", "gone")];
    const data = snapshot([zone("down", AUTO), zone("up", AUTO)], rooms);
    expect(roomsOf(data, data.zones[0]!).map((item) => item.id)).toEqual(["living", "kitchen", "x"]);
    expect(roomsOf(data, data.zones[1]!).map((item) => item.id)).toEqual(["bed"]);
  });

  it("moves a room within its zone and leaves the other rooms in place", () => {
    const order = ["living", "bed", "kitchen", "bath"];
    const down = ["living", "kitchen"];
    expect(moveWithin(order, down, "kitchen", -1)).toEqual(["kitchen", "bed", "living", "bath"]);
    expect(moveWithin(order, down, "living", 1)).toEqual(["kitchen", "bed", "living", "bath"]);
    expect(moveWithin(order, down, "living", -1)).toBeNull();
    expect(moveWithin(order, down, "kitchen", 1)).toBeNull();
    expect(moveWithin(order, down, "bed", 1)).toBeNull();
  });
});
