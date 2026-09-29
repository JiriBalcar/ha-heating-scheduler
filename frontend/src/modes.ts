// Colours and icons of modes. Colours carry white text with WCAG AA contrast
// in light and dark themes; they are never used without an icon and a word.
import {
  mdiBagSuitcase,
  mdiHandBackRight,
  mdiHomeExportOutline,
  mdiHomeThermometerOutline,
  mdiLeaf,
  mdiPower,
  mdiRadiatorOff,
  mdiSnowflake,
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
} from "@mdi/js";
import type { HouseMode, Mode, Snapshot, TargetMode, RoomData } from "./types";

export const MODE_COLORS: Record<TargetMode, string> = {
  comfort: "#bf360c",
  eco: "#2e7d32",
  night: "#3949ab",
  away: "#546e7a",
  frost: "#006978",
  off: "#616161",
  manual: "#8e24aa",
};

export const MODE_ICONS: Record<TargetMode, string> = {
  comfort: mdiWhiteBalanceSunny,
  eco: mdiLeaf,
  night: mdiWeatherNight,
  away: mdiHomeExportOutline,
  frost: mdiSnowflake,
  off: mdiRadiatorOff,
  manual: mdiHandBackRight,
};

export const HOUSE_COLORS: Record<HouseMode, string> = {
  auto: "#1565c0",
  away: MODE_COLORS.away,
  vacation: "#00695c",
  off: MODE_COLORS.off,
};

export const HOUSE_ICONS: Record<HouseMode, string> = {
  auto: mdiHomeThermometerOutline,
  away: mdiHomeExportOutline,
  vacation: mdiBagSuitcase,
  off: mdiPower,
};

/** Effective temperatures of a room: its set over the house temperatures. */
export function roomTemperatures(room: RoomData, snapshot: Snapshot): Partial<Record<Mode, number>> {
  const house = snapshot.temp_sets.find((set) => set.id === "house");
  const own = snapshot.temp_sets.find((set) => set.id === room.temp_set_id);
  return { ...(house?.temperatures ?? {}), ...(own && own.id !== "house" ? own.temperatures : {}) };
}

export function houseTemperature(snapshot: Snapshot, mode: Mode): number | undefined {
  return snapshot.temp_sets.find((set) => set.id === "house")?.temperatures[mode];
}
