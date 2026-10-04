// Number, time and date formatting in the user's language and the house's time zone.
import type { Lang, Translate } from "./i18n";
import type { HomeAssistant, RoomData, Snapshot, TargetData, TargetMode, VacationData } from "./types";

export interface FormatContext {
  lang: Lang;
  decimalSeparator: string;
  hour12: boolean;
  timeZone: string;
}

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function separatorOf(locale: string | undefined): string {
  const parts = new Intl.NumberFormat(locale).formatToParts(1.5);
  return parts.find((part) => part.type === "decimal")?.value ?? ".";
}

function hour12Of(locale: string | undefined): boolean {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12";
}

/** Build the formatting context from the user's Home Assistant profile settings. */
export function formatContext(
  hass: HomeAssistant,
  lang: Lang,
  snapshot?: Pick<Snapshot, "time_zone"> | null,
): FormatContext {
  const locale = hass.locale;
  let decimalSeparator: string;
  switch (locale?.number_format) {
    case "comma_decimal":
    case "none":
      decimalSeparator = lang === "cs" && locale?.number_format === "none" ? "," : ".";
      break;
    case "decimal_comma":
    case "space_comma":
      decimalSeparator = ",";
      break;
    case "system":
      decimalSeparator = separatorOf(undefined);
      break;
    default:
      decimalSeparator = separatorOf(lang);
  }
  let hour12: boolean;
  switch (locale?.time_format) {
    case "12":
      hour12 = true;
      break;
    case "24":
      hour12 = false;
      break;
    case "system":
      hour12 = hour12Of(undefined);
      break;
    default:
      hour12 = hour12Of(lang);
  }
  // Plans run in the house's time zone, so the UI always shows house time.
  const timeZone = snapshot?.time_zone ?? hass.config?.time_zone ?? browserTimeZone();
  return { lang, decimalSeparator, hour12, timeZone };
}

/** "21,5" with one decimal. */
export function formatNumber(value: number, ctx: FormatContext): string {
  return value.toFixed(1).replace(".", ctx.decimalSeparator);
}

/** "21,5 °C", or "—" for missing values. */
export function formatTemp(value: number | null | undefined, ctx: FormatContext): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${formatNumber(value, ctx)} °C`;
}

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Monday
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** Wall-clock parts of an instant in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

function offsetAt(instant: number, timeZone: string): number {
  const p = zonedParts(new Date(instant), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(instant / 60000) * 60000;
}

/** The instant of a wall-clock time in `timeZone`. */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let instant = guess - offsetAt(guess, timeZone);
  const second = offsetAt(instant, timeZone);
  if (second !== guess - instant) instant = guess - second;
  return new Date(instant);
}

/** "06:00" (or "6:00 AM"). */
export function formatClock(date: Date, ctx: FormatContext): string {
  const p = zonedParts(date, ctx.timeZone);
  if (!ctx.hour12) return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  const suffix = p.hour < 12 ? "AM" : "PM";
  const hour = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${hour}:${String(p.minute).padStart(2, "0")} ${suffix}`;
}

// Czech uses the genitive after "do" (until): "do pondělí 06:00".
const WEEKDAYS_UNTIL: Record<Lang, string[]> = {
  cs: ["pondělí", "úterý", "středy", "čtvrtka", "pátku", "soboty", "neděle"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
const TOMORROW: Record<Lang, string> = { cs: "zítra", en: "tomorrow" };
const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  cs: ["po", "út", "st", "čt", "pá", "so", "ne"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDay(p: ZonedParts, lang: Lang): string {
  return lang === "cs" ? `${p.day}. ${p.month}.` : `${p.day} ${MONTHS_EN[p.month - 1]}`;
}

/** The end of a period, relative to now: "06:00", "pondělí 06:00" or "12. 10. 06:00". */
export function formatUntil(iso: string, now: Date, ctx: FormatContext): string {
  const until = new Date(iso);
  const clock = formatClock(until, ctx);
  const p = zonedParts(until, ctx.timeZone);
  // Calendar days in the house's time zone: "17:35" alone would read as today's.
  const days = dayNumber(p) - dayNumber(zonedParts(now, ctx.timeZone));
  if (days <= 0) return clock;
  if (days === 1) return `${TOMORROW[ctx.lang]} ${clock}`;
  if (days < 7) return `${WEEKDAYS_UNTIL[ctx.lang][p.weekday]} ${clock}`;
  return `${formatDay(p, ctx.lang)} ${clock}`;
}

function dayNumber(p: ZonedParts): number {
  return Math.round(Date.UTC(p.year, p.month - 1, p.day) / (24 * 3600 * 1000));
}

/** A full date with weekday: "po 12. 10. 14:00" / "Mon 12 Oct 14:00". */
export function formatDateTime(iso: string, ctx: FormatContext): string {
  const date = new Date(iso);
  const p = zonedParts(date, ctx.timeZone);
  return `${WEEKDAYS_SHORT[ctx.lang][p.weekday]} ${formatDay(p, ctx.lang)} ${formatClock(date, ctx)}`;
}

/** The name of a mode, e.g. "Warm". */
export function modeLabel(mode: TargetMode, t: Translate): string {
  return t(`mode.${mode}`);
}

/**
 * "Plan: Night until 06:00", "Holiday until 12. 10. 12:00", ...
 * With `zone` (the name of the room's part of the house), "1. patro: Away" and not "House: Away".
 */
export function reasonText(
  target: TargetData,
  now: Date,
  ctx: FormatContext,
  t: Translate,
  zone?: string,
): string {
  const base =
    target.source === "plan"
      ? t("reason.plan", { mode: modeLabel(target.mode, t) })
      : target.source === "house_away" && zone
        ? t("reason.zone_away", { zone })
        : target.source === "house_frost" && zone
          ? t("reason.zone_frost", { zone })
          : t(`reason.${target.source}`);
  if (!target.valid_until) return base;
  // An open window: "Window open: off until 13:00" (then Frost guard).
  if (target.source === "window") return t("reason.window_until", { until: formatUntil(target.valid_until, now, ctx) });
  // A holiday end is always shown with its date: "until 12:00" alone is ambiguous there.
  const until =
    target.source === "vacation"
      ? formatDateTime(target.valid_until, ctx)
      : formatUntil(target.valid_until, now, ctx);
  return `${base} ${t("room.until", { until })}`;
}

/** "Holiday planned: Sat 10 Oct 08:00 – Sun 18 Oct 12:00", for a holiday that has not started. */
export function plannedText(vacation: VacationData, ctx: FormatContext, t: Translate): string {
  const from = formatDateTime(vacation.start, ctx);
  return vacation.end
    ? t("house.planned", { from, to: formatDateTime(vacation.end, ctx) })
    : t("house.planned_open", { from });
}

/** "until 22:00 → Night 18,0 °C", or null when nothing changes soon. */
export function nextText(target: TargetData, now: Date, ctx: FormatContext, t: Translate): string | null {
  if (!target.valid_until || !target.next) return null;
  const next = target.next;
  const label =
    next.temperature === null
      ? modeLabel(next.mode, t)
      : `${modeLabel(next.mode, t)} ${formatTemp(next.temperature, ctx)}`;
  return t("room.until_next", { until: formatUntil(target.valid_until, now, ctx), next: label });
}

/** Convert a temperature in `unit` ("°C", "°F", "K") to °C. */
export function toCelsius(value: number, unit: string | undefined): number {
  if (unit === "°F") return ((value - 32) * 5) / 9;
  if (unit === "K") return value - 273.15;
  return value;
}

/** The temperature to show for a room in °C, live from Home Assistant states. */
export function roomTemperature(room: RoomData, hass: HomeAssistant): number | null {
  const haUnit = hass.config?.unit_system?.temperature;
  const value = (raw: unknown, unit: string | undefined): number | null => {
    const number = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
    return Number.isFinite(number) ? toCelsius(number, unit) : null;
  };
  if (room.temperature_entity) {
    const state = hass.states[room.temperature_entity];
    if (state && state.state !== "unavailable" && state.state !== "unknown") {
      const reading = room.temperature_entity.startsWith("climate.")
        ? value(state.attributes.current_temperature, haUnit)
        : value(state.state, (state.attributes.unit_of_measurement as string | undefined) ?? haUnit);
      if (reading !== null) return Math.round(reading * 10) / 10;
    }
  }
  const readings = room.trvs
    .map((id) => hass.states[id])
    .filter((state) => state && state.state !== "unavailable" && state.state !== "unknown")
    .map((state) => value(state.attributes.current_temperature, haUnit))
    .filter((reading): reading is number => reading !== null);
  if (readings.length) {
    return Math.round((readings.reduce((sum, v) => sum + v, 0) / readings.length) * 10) / 10;
  }
  return room.current_temperature;
}

/** "30 min", "1 h", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
