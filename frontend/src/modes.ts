// Colours and icons of modes. Colours are HA theme colours; they always come with an icon and a word.
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
  comfort: "var(--deep-orange-color, #ff6f22)",
  eco: "var(--green-color, #4caf50)",
  night: "var(--indigo-color, #3f51b5)",
  away: "var(--blue-grey-color, #607d8b)",
  frost: "var(--cyan-color, #00bcd4)",
  off: "var(--grey-color, #9e9e9e)",
  manual: "var(--purple-color, #9c27b0)",
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
  auto: "var(--primary-color, #009ac7)",
  away: MODE_COLORS.away,
  vacation: "var(--teal-color, #009688)",
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
