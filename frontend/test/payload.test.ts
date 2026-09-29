import { describe, expect, it } from "vitest";
import { roomPayload, uniqueName } from "../src/payload";
import type { RoomData } from "../src/types";

describe("payload helpers", () => {
  it("makes unique names", () => {
    expect(uniqueName("Ložnice", ["Obývák"])).toBe("Ložnice");
    expect(uniqueName("Ložnice", ["ložnice", "Ložnice 2"])).toBe("Ložnice 3");
  });

  it("builds a room payload with only the saved fields", () => {
    const room = {
      id: "r1",
      name: "Obývák",
      trvs: ["climate.a"],
      plan_id: "house",
      temp_set_id: "house",
      temperature_entity: null,
      area_id: "obyvak",
      current_temperature: 20,
      target: null,
      override: null,
      issues: [],
      trv_status: [],
    } as RoomData;
    expect(roomPayload(room, { plan_id: "p2" })).toEqual({
      id: "r1",
      name: "Obývák",
      trvs: ["climate.a"],
      plan_id: "p2",
      temp_set_id: "house",
      temperature_entity: null,
      area_id: "obyvak",
    });
  });
});
