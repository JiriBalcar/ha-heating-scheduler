import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatDuration,
  formatTemp,
  formatUntil,
  nextText,
  reasonText,
  roomTemperature,
  toCelsius,
  zonedParts,
  zonedToUtc,
  type FormatContext,
} from "../src/format";
import { translator } from "../src/i18n";
import type { HomeAssistant, RoomData, TargetData } from "../src/types";

const cs: FormatContext = { lang: "cs", decimalSeparator: ",", hour12: false, timeZone: "Europe/Prague" };
const en: FormatContext = { lang: "en", decimalSeparator: ".", hour12: false, timeZone: "Europe/Prague" };
// Monday 2026-10-05 12:00 in Prague (CEST, UTC+2).
const NOW = new Date("2026-10-05T10:00:00Z");

describe("temperatures", () => {
  it("formats with the decimal separator", () => {
    expect(formatTemp(21.5, cs)).toBe("21,5 °C");
    expect(formatTemp(21, en)).toBe("21.0 °C");
    expect(formatTemp(null, en)).toBe("—");
  });
});

describe("time zones", () => {
  it("maps wall time to UTC across DST", () => {
    expect(zonedToUtc(2026, 10, 5, 6, 0, "Europe/Prague").toISOString()).toBe("2026-10-05T04:00:00.000Z");
    expect(zonedToUtc(2026, 12, 1, 6, 0, "Europe/Prague").toISOString()).toBe("2026-12-01T05:00:00.000Z");
    expect(zonedToUtc(2026, 10, 25, 12, 0, "Europe/Prague").toISOString()).toBe("2026-10-25T11:00:00.000Z");
  });
  it("reads wall-clock parts", () => {
    expect(zonedParts(NOW, "Europe/Prague")).toEqual({
      year: 2026, month: 10, day: 5, hour: 12, minute: 0, weekday: 0,
    });
  });
});

describe("durations", () => {
  it("are short", () => {
    expect([30, 60, 90, 240].map(formatDuration)).toEqual(["30 min", "1 h", "1 h 30 min", "4 h"]);
  });
});

describe("until", () => {
  it("uses time, weekday or date", () => {
    expect(formatUntil("2026-10-05T20:00:00Z", NOW, cs)).toBe("22:00");
    expect(formatUntil("2026-10-06T04:00:00Z", NOW, cs)).toBe("zítra 06:00");
    expect(formatUntil("2026-10-06T04:00:00Z", NOW, en)).toBe("tomorrow 06:00");
    expect(formatUntil("2026-10-07T04:00:00Z", NOW, cs)).toBe("středy 06:00");
    expect(formatUntil("2026-10-07T04:00:00Z", NOW, en)).toBe("Wed 06:00");
    expect(formatUntil("2026-10-12T10:00:00Z", NOW, cs)).toBe("12. 10. 12:00");
    expect(formatUntil("2026-10-12T10:00:00Z", NOW, en)).toBe("12 Oct 12:00");
  });
  it("formats a full date", () => {
    expect(formatDateTime("2026-10-12T10:00:00Z", cs)).toBe("po 12. 10. 12:00");
    expect(formatDateTime("2026-10-12T10:00:00Z", { ...en, hour12: true })).toBe("Mon 12 Oct 12:00 PM");
  });
});

describe("reason and next", () => {
  const t = translator("en");
  const plan: TargetData = {
    mode: "night",
    temperature: 18,
    source: "plan",
    valid_until: "2026-10-06T04:00:00Z",
    next: { mode: "comfort", temperature: 21, source: "plan" },
  };
  it("describes the plan", () => {
    expect(reasonText(plan, NOW, en, t)).toBe("Plan: Night until tomorrow 06:00");
    expect(nextText(plan, NOW, en, t)).toBe("until tomorrow 06:00 → Warm 21.0 °C");
  });
  it("shows a holiday end with its date", () => {
    const vacation: TargetData = { ...plan, mode: "frost", temperature: 7, source: "vacation" };
    expect(reasonText(vacation, NOW, en, t)).toBe("Holiday until Tue 6 Oct 06:00");
  });
  it("names the part of the house that is away", () => {
    const away: TargetData = { mode: "away", temperature: 16, source: "house_away", valid_until: null, next: null };
    expect(reasonText(away, NOW, en, t)).toBe("House: Away");
    expect(reasonText(away, NOW, en, t, "1st floor")).toBe("1st floor: Away");
  });
  it("says that an open window keeps the heating off until Frost guard", () => {
    const open: TargetData = { mode: "window", temperature: null, source: "window", valid_until: "2026-10-05T11:00:00Z", next: null };
    expect(reasonText(open, NOW, en, t)).toBe("Window open: off until 13:00");
    expect(reasonText({ ...open, temperature: 7, valid_until: null }, NOW, en, t)).toBe("Window open");
  });
  it("has no next text without a change", () => {
    expect(nextText({ ...plan, valid_until: null, next: null }, NOW, en, t)).toBeNull();
  });
});

describe("room temperature", () => {
  const room = {
    trvs: ["climate.a", "climate.b"],
    temperature_entity: null,
    current_temperature: 19,
  } as unknown as RoomData;
  const state = (value: string, attributes: Record<string, unknown> = {}) => ({
    entity_id: "x", state: value, attributes, last_changed: "", last_updated: "",
  });
  it("averages the valves", () => {
    const hass = {
      states: {
        "climate.a": state("heat", { current_temperature: 20 }),
        "climate.b": state("heat", { current_temperature: 21.1 }),
      },
    } as unknown as HomeAssistant;
    expect(roomTemperature(room, hass)).toBe(20.6);
  });
  it("converts Fahrenheit readings to Celsius", () => {
    const hass = {
      config: { time_zone: "America/New_York", unit_system: { temperature: "°F" } },
      states: {
        "climate.a": state("heat", { current_temperature: 68 }),
        "climate.b": state("heat", { current_temperature: 68 }),
        "sensor.t": state("71.6", { unit_of_measurement: "°F" }),
      },
    } as unknown as HomeAssistant;
    expect(roomTemperature(room, hass)).toBe(20);
    expect(roomTemperature({ ...room, temperature_entity: "sensor.t" }, hass)).toBe(22);
    expect(toCelsius(300.15, "K")).toBeCloseTo(27, 5);
  });

  it("prefers the chosen sensor and falls back", () => {
    const hass = {
      states: {
        "sensor.t": state("22.34"),
        "climate.a": state("unavailable"),
        "climate.b": state("unavailable"),
      },
    } as unknown as HomeAssistant;
    expect(roomTemperature({ ...room, temperature_entity: "sensor.t" }, hass)).toBe(22.3);
    expect(roomTemperature(room, hass)).toBe(19);
  });
});
