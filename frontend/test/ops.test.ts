import { describe, expect, it } from "vitest";
import {
  alternativeMode,
  copyDay,
  fromPlan,
  materialize,
  moveBoundary,
  normalize,
  removeSegment,
  sameDay,
  segmentAt,
  segments,
  setMode,
  snap,
  split,
  toHHMM,
  toMinutes,
  toPlanDays,
  type Day,
} from "../src/schedule/ops";

const standard: Day = [
  { start: 0, mode: "night" },
  { start: 360, mode: "comfort" },
  { start: 1320, mode: "night" },
];

describe("conversion", () => {
  it("converts times", () => {
    expect(toMinutes("06:30")).toBe(390);
    expect(toHHMM(390)).toBe("06:30");
    expect(toHHMM(1440)).toBe("24:00");
    expect(snap(367)).toBe(360);
    expect(snap(368)).toBe(375);
  });

  it("round-trips plan days", () => {
    const days = Array.from({ length: 7 }, () => standard);
    expect(fromPlan({ days: toPlanDays(days) })).toEqual(days);
  });
});

describe("materialize", () => {
  it("adds 00:00 from the previous day's last slot", () => {
    const days: Day[] = [
      [{ start: 360, mode: "comfort" }, { start: 1320, mode: "night" }],
      [{ start: 420, mode: "comfort" }, { start: 1200, mode: "eco" }],
      [],
      [{ start: 0, mode: "night" }],
      [{ start: 0, mode: "night" }],
      [{ start: 0, mode: "night" }],
      [{ start: 0, mode: "frost" }],
    ];
    const result = materialize(days);
    expect(result[0]![0]).toEqual({ start: 0, mode: "frost" }); // from Sunday
    expect(result[1]![0]).toEqual({ start: 0, mode: "night" }); // from Monday
    expect(result[2]).toEqual([{ start: 0, mode: "eco" }]); // empty day: Tuesday's last
    expect(result.every((day) => day[0]!.start === 0)).toBe(true);
  });
});

describe("normalize", () => {
  it("sorts, dedupes and merges", () => {
    expect(
      normalize([
        { start: 1320, mode: "night" },
        { start: 360, mode: "eco" },
        { start: 360, mode: "comfort" },
        { start: 480, mode: "comfort" },
        { start: 0, mode: "night" },
      ]),
    ).toEqual(standard);
  });
});

describe("segments", () => {
  it("covers the whole day", () => {
    expect(segments(standard)).toEqual([
      { index: 0, start: 0, end: 360, mode: "night" },
      { index: 1, start: 360, end: 1320, mode: "comfort" },
      { index: 2, start: 1320, end: 1440, mode: "night" },
    ]);
    expect(segmentAt(standard, 359).index).toBe(0);
    expect(segmentAt(standard, 360).index).toBe(1);
    expect(segmentAt(standard, 1439).index).toBe(2);
  });
});

describe("editing", () => {
  it("changes a mode and merges equal neighbours", () => {
    expect(setMode(standard, 1, "eco")[1]).toEqual({ start: 360, mode: "eco" });
    expect(setMode(standard, 1, "night")).toEqual([{ start: 0, mode: "night" }]);
  });

  it("moves a boundary with snapping and limits", () => {
    expect(moveBoundary(standard, 1, 397)[1]!.start).toBe(390);
    expect(moveBoundary(standard, 1, -50)[1]!.start).toBe(15);
    expect(moveBoundary(standard, 1, 2000)[1]!.start).toBe(1305);
    expect(moveBoundary(standard, 2, 1500)[2]!.start).toBe(1425);
    expect(moveBoundary(standard, 0, 100)).toBe(standard);
  });

  it("adds a change inside a segment", () => {
    const { day, index } = split(standard, 842, "eco");
    expect(day).toEqual([
      { start: 0, mode: "night" },
      { start: 360, mode: "comfort" },
      { start: 840, mode: "eco" },
      { start: 1320, mode: "night" },
    ]);
    expect(index).toBe(2);
    // Too close to the start: moved 15 min inside.
    expect(split(standard, 361, "eco").day[2]).toEqual({ start: 375, mode: "eco" });
    // A segment shorter than 30 min cannot be split.
    const tiny: Day = [{ start: 0, mode: "night" }, { start: 1425, mode: "eco" }];
    expect(split(tiny, 1430, "comfort").day).toEqual(tiny);
  });

  it("removes a segment", () => {
    expect(removeSegment(standard, 1)).toEqual([{ start: 0, mode: "night" }]);
    expect(removeSegment(standard, 0)).toEqual([
      { start: 0, mode: "comfort" },
      { start: 1320, mode: "night" },
    ]);
    const single: Day = [{ start: 0, mode: "eco" }];
    expect(removeSegment(single, 0)).toBe(single);
  });

  it("copies a day", () => {
    const other: Day = [{ start: 0, mode: "eco" }];
    const days = [standard, other, other, other, other, other, other];
    const copied = copyDay(days, 0, [5, 6]);
    expect(copied[5]).toEqual(standard);
    expect(copied[6]).toEqual(standard);
    expect(copied[1]).toBe(other);
    expect(sameDay(copied[5]!, standard)).toBe(true);
    expect(sameDay(copied[1]!, standard)).toBe(false);
  });

  it("suggests a different mode for a new change", () => {
    expect(alternativeMode("comfort")).toBe("eco");
    expect(alternativeMode("night")).toBe("comfort");
  });
});
