// Pure plan-editing operations. A day is a sorted list of slots in minutes since
// midnight; the editor keeps a slot at 00:00 on every day, so each day stands alone.
import type { Mode, PlanData, SlotData } from "../types";

export const DAY_MINUTES = 1440;
export const SNAP = 15;

export interface Slot {
  start: number;
  mode: Mode;
}

export type Day = Slot[];

export interface Segment {
  index: number;
  start: number;
  end: number;
  mode: Mode;
}

export function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** "06:00"; 1440 is shown as "24:00". */
export function toHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function snap(minutes: number): number {
  return Math.round(minutes / SNAP) * SNAP;
}

/** Sort, keep the last slot of equal starts, merge equal neighbours, keep a slot at 00:00. */
export function normalize(day: Day): Day {
  const byStart = new Map<number, Mode>();
  for (const slot of day) byStart.set(slot.start, slot.mode);
  const sorted = [...byStart.entries()].sort((a, b) => a[0] - b[0]);
  const result: Day = [];
  for (const [start, mode] of sorted) {
    if (result.length && result[result.length - 1]!.mode === mode) continue;
    result.push({ start, mode });
  }
  if (result.length && result[0]!.start !== 0) result[0] = { start: 0, mode: result[0]!.mode };
  return result;
}

/** Give every day a 00:00 slot, taken from the last slot of an earlier day. */
export function materialize(days: Day[]): Day[] {
  const result = days.map((day) => [...day].sort((a, b) => a.start - b.start));
  const lastMode = (index: number): Mode | null => {
    for (let back = 1; back <= 7; back += 1) {
      const day = result[(index - back + 7) % 7]!;
      if (day.length) return day[day.length - 1]!.mode;
    }
    return null;
  };
  const carried = result.map((_day, index) => lastMode(index));
  return result.map((day, index) => {
    if (day.length && day[0]!.start === 0) return normalizeKeepZero(day);
    const mode = carried[index] ?? day[0]?.mode ?? "comfort";
    return normalizeKeepZero([{ start: 0, mode }, ...day]);
  });
}

function normalizeKeepZero(day: Day): Day {
  return normalize(day);
}

export function fromPlan(plan: Pick<PlanData, "days">): Day[] {
  return materialize(
    plan.days.map((day) => day.map((slot) => ({ start: toMinutes(slot.start), mode: slot.mode }))),
  );
}

export function toPlanDays(days: Day[]): SlotData[][] {
  return days.map((day) => day.map((slot) => ({ start: toHHMM(slot.start), mode: slot.mode })));
}

export function segments(day: Day): Segment[] {
  return day.map((slot, index) => ({
    index,
    start: slot.start,
    end: day[index + 1]?.start ?? DAY_MINUTES,
    mode: slot.mode,
  }));
}

export function segmentAt(day: Day, minute: number): Segment {
  const all = segments(day);
  return all.find((segment) => minute >= segment.start && minute < segment.end) ?? all[all.length - 1]!;
}

export function setMode(day: Day, index: number, mode: Mode): Day {
  return normalize(day.map((slot, i) => (i === index ? { ...slot, mode } : slot)));
}

/** Move the start of segment `index` (not the first), snapped and kept between its neighbours. */
export function moveBoundary(day: Day, index: number, minute: number): Day {
  if (index <= 0 || index >= day.length) return day;
  const low = day[index - 1]!.start + SNAP;
  const high = (day[index + 1]?.start ?? DAY_MINUTES) - SNAP;
  const start = Math.min(high, Math.max(low, snap(minute)));
  return day.map((slot, i) => (i === index ? { ...slot, start } : slot));
}

/** Where a new change can go inside a segment: the snapped minute, kept 15 min from its ends. */
export function splitPoint(segment: Segment, minute: number): number | null {
  if (segment.end - segment.start < 2 * SNAP) return null;
  return Math.min(segment.end - SNAP, Math.max(segment.start + SNAP, snap(minute)));
}

/** Add a change at `minute` to `mode`. Returns the new day and the index of the new segment. */
export function split(day: Day, minute: number, mode: Mode): { day: Day; index: number } {
  const segment = segmentAt(day, minute);
  const at = splitPoint(segment, minute);
  if (at === null) return { day, index: segment.index };
  const next: Day = [...day.slice(0, segment.index + 1), { start: at, mode }, ...day.slice(segment.index + 1)];
  if (mode === segment.mode) return { day: next, index: segment.index + 1 };
  const merged = normalize(next);
  return { day: merged, index: merged.findIndex((slot) => slot.start === at) };
}

/** Remove a segment: its neighbour (the earlier one, or the next for the first) takes its time. */
export function removeSegment(day: Day, index: number): Day {
  if (day.length <= 1 || index < 0 || index >= day.length) return day;
  if (index === 0) {
    const [, second, ...rest] = day;
    return normalize([{ start: 0, mode: second!.mode }, ...rest]);
  }
  return normalize(day.filter((_slot, i) => i !== index));
}

export function copyDay(days: Day[], from: number, to: number[]): Day[] {
  return days.map((day, index) => (to.includes(index) ? days[from]!.map((slot) => ({ ...slot })) : day));
}

export function sameDay(a: Day, b: Day): boolean {
  return a.length === b.length && a.every((slot, i) => slot.start === b[i]!.start && slot.mode === b[i]!.mode);
}

/** A sensible mode for a new change inside a segment of `mode`. */
export function alternativeMode(mode: Mode): Mode {
  switch (mode) {
    case "comfort":
      return "eco";
    case "night":
    case "eco":
    case "away":
    case "frost":
    case "off":
      return "comfort";
  }
}

export const WORKDAYS = [0, 1, 2, 3, 4];
export const WEEKEND = [5, 6];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
