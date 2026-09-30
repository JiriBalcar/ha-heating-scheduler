// Changing the mode of the whole house or of a zone, with the questions that the house tile and the
// house dialog ask first.
import { formatContext, formatTemp } from "../format";
import { languageOf, translator } from "../i18n";
import { houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import type { HomeAssistant, HouseMode, Snapshot, ZoneData } from "../types";
import { confirmDialog } from "./hs-dialog";
import { openHolidayDialog } from "./hs-holiday-dialog";

/** Send a command; an error becomes a toast. */
export async function sendHouseCommand(
  host: HTMLElement,
  hass: HomeAssistant,
  command: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await storeFor(hass).call(command, data);
  } catch (error) {
    toast(host, errorText(error, translator(languageOf(hass))));
  }
}

/**
 * Switch `zone`, or every zone for null, to `mode`. Away and Off ask first; Holiday opens the
 * holiday dialog.
 */
export async function chooseHouseMode(
  host: HTMLElement,
  hass: HomeAssistant,
  snapshot: Snapshot,
  zone: ZoneData | null,
  mode: HouseMode,
): Promise<void> {
  const t = translator(languageOf(hass));
  if (mode === "vacation") {
    openHolidayDialog(host, snapshot, zone);
    return;
  }
  if (mode === "away") {
    const temp = formatTemp(houseTemperature(snapshot, "away"), formatContext(hass, languageOf(hass), snapshot));
    const ok = await confirmDialog(host, {
      heading: t("house.away"),
      message: zone ? t("house.confirm.away_zone", { zone: zone.name, temp }) : t("house.confirm.away", { temp }),
      confirm: t("house.confirm.away_button"),
      cancel: t("common.cancel"),
    });
    if (!ok) return;
  }
  if (mode === "off") {
    const ok = await confirmDialog(host, {
      heading: t("house.off"),
      message: zone ? t("house.confirm.off_zone", { zone: zone.name }) : t("house.confirm.off"),
      confirm: t("house.confirm.off_button"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
  }
  await sendHouseCommand(host, hass, "house_mode/set", { mode, zone_id: zone?.id });
}

/** Ask, then cancel the planned holiday of `zone`, or of every zone for null. */
export async function cancelPlannedHoliday(host: HTMLElement, hass: HomeAssistant, zone: ZoneData | null): Promise<void> {
  const t = translator(languageOf(hass));
  const ok = await confirmDialog(host, {
    heading: t("house.vacation"),
    message: t("house.confirm.cancel_vacation"),
    confirm: t("house.confirm.cancel_vacation_button"),
    cancel: t("common.back"),
  });
  if (ok) await sendHouseCommand(host, hass, "vacation/cancel", { zone_id: zone?.id });
}
