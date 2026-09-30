import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { formatContext, formatDateTime, plannedText } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
import type { HomeAssistant, HouseData, Snapshot, ZoneData } from "../types";
import { wholeHouse } from "../zones";
import { define } from "./define";
import { hint, hintStyles } from "./hint";
import { cancelPlannedHoliday, sendHouseCommand } from "./house-actions";

/**
 * What the house needs from the user, once above the tiles instead of in every tile: back to Normal
 * after Away, Holiday or Off, and a planned holiday. With `zone`, only that zone; without it, the
 * whole house, or each zone while the zones differ. Hidden when there is nothing to say.
 */
export class HsHouseHints extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    zone: { attribute: false },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare zone: ZoneData | null;
  declare busy: boolean;
  private shown: TemplateResult[] = [];

  constructor() {
    super();
    this.zone = null;
    this.busy = false;
  }

  static override styles = [
    hintStyles,
    css`
      :host {
        display: grid;
        gap: var(--ha-space-2, 8px);
      }
      :host([hidden]) {
        display: none;
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  private async run(action: () => Promise<void>) {
    this.busy = true;
    try {
      await action();
    } finally {
      this.busy = false;
    }
  }

  /** The hints of one part of the house; `zone` null is the whole house (every zone at once). */
  private hints(house: HouseData, zone: ZoneData | null): TemplateResult[] {
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const out: TemplateResult[] = [];
    const effective = house.effective;
    if (effective !== "auto") {
      const end = house.vacation?.end;
      const until = end ? formatDateTime(end, ctx) : "";
      const name = zone?.name ?? "";
      let text: string;
      if (effective === "vacation") {
        text = zone
          ? t(end ? "hints.vacation_zone" : "hints.vacation_open_zone", { zone: name, until })
          : t(end ? "hints.vacation" : "hints.vacation_open", { until });
      } else if (effective === "off") {
        text = zone ? t("hints.off_zone", { zone: name }) : t("hints.off");
      } else {
        text = zone ? t("hints.away_zone", { zone: name }) : t("hints.away");
      }
      out.push(
        hint(
          text,
          effective === "off" ? t("house.heating_on") : t("house.home_again"),
          () => this.run(() => sendHouseCommand(this, this.hass, "house_mode/set", { mode: "auto", zone_id: zone?.id })),
          this.busy,
        ),
      );
    }
    const vacation = house.vacation;
    if (vacation && !vacation.active) {
      const from = formatDateTime(vacation.start, ctx);
      const text = !zone
        ? plannedText(vacation, ctx, t)
        : vacation.end
          ? t("hints.planned_zone", { zone: zone.name, from, to: formatDateTime(vacation.end, ctx) })
          : t("hints.planned_open_zone", { zone: zone.name, from });
      out.push(
        hint(text, t("house.cancel_planned"), () => this.run(() => cancelPlannedHoliday(this, this.hass, zone)), this.busy),
      );
    }
    return out;
  }

  protected override willUpdate(_changed: PropertyValues<this>): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.hass) {
      this.shown = [];
    } else if (this.zone) {
      // With one zone, the zone is the whole house.
      this.shown = this.hints(this.zone.house, snapshot.zones.length > 1 ? this.zone : null);
    } else {
      const whole = wholeHouse(snapshot);
      this.shown = whole ? this.hints(whole, null) : snapshot.zones.flatMap((zone) => this.hints(zone.house, zone));
    }
    this.hidden = this.shown.length === 0;
  }

  override render() {
    return this.shown.length ? html`${this.shown}` : nothing;
  }
}

define("hs-house-hints", HsHouseHints);
