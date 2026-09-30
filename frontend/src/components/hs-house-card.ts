import { LitElement, css, html, nothing } from "lit";
import { formatContext, formatDateTime, formatTemp } from "../format";
import { languageOf, translator } from "../i18n";
import { HOUSE_COLORS, HOUSE_ICONS, houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import {
  HOUSE_MODES,
  type HomeAssistant,
  type HouseData,
  type HouseMode,
  type Snapshot,
  type ZoneData,
} from "../types";
import { commonMode, wholeHouse } from "../zones";
import { define } from "./define";
import { confirmDialog } from "./hs-dialog";
import { openHolidayDialog } from "./hs-holiday-dialog";

/**
 * The house mode as an HA tile: Normal / Away / Holiday / Off, and what is planned.
 * With a `zone`, the tile shows and sets that zone; without one, the whole house (every zone).
 */
export class HsHouseCard extends LitElement {
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

  constructor() {
    super();
    this.zone = null;
    this.busy = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      ha-card {
        height: 100%;
      }
      ha-tile-icon {
        --tile-icon-color: var(--tile-color);
      }
      .features {
        display: grid;
        gap: var(--ha-card-feature-gap, 12px);
      }
      ha-control-select {
        --control-select-color: var(--tile-color);
        --control-select-padding: 0;
        --control-select-thickness: 56px;
        --control-select-border-radius: var(--ha-border-radius-lg, 12px);
        --control-select-button-border-radius: var(--ha-border-radius-lg, 12px);
      }
      ha-alert {
        display: block;
      }
      /* The alert's own action slot makes the button as narrow as its longest word, and its narrow
         layout puts a short text at the right. The text and the button share one wrapping row instead. */
      .hint {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
      }
      .hint ha-button {
        margin-inline-start: auto;
      }
    `,
  ];

  private get t() {
    return translator(languageOf(this.hass));
  }

  /** The effective mode of this tile, or null while the zones differ. */
  private get effective(): HouseMode | null {
    return this.zone ? this.zone.house.effective : commonMode(this.snapshot);
  }

  /** The house state of this tile, or null while the zones differ. */
  private get house(): HouseData | null {
    return this.zone ? this.zone.house : wholeHouse(this.snapshot);
  }

  private get zoneId(): string | undefined {
    return this.zone?.id ?? undefined;
  }

  private async selected(event: CustomEvent<{ value: HouseMode }>) {
    const select = event.currentTarget as HTMLElement & { value?: string };
    await this.setMode(event.detail.value);
    // The selector shows what the house really does until the new state arrives.
    select.value = this.effective ?? undefined;
    this.requestUpdate();
  }

  private async setMode(mode: HouseMode) {
    const t = this.t;
    const snapshot = this.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    const zone = this.zone;
    if (mode === this.effective) return;
    if (mode === "vacation") {
      openHolidayDialog(this, snapshot, zone);
      return;
    }
    if (mode === "away") {
      const temp = formatTemp(houseTemperature(snapshot, "away"), ctx);
      const ok = await confirmDialog(this, {
        heading: t("house.away"),
        message: zone
          ? t("house.confirm.away_zone", { zone: zone.name, temp })
          : t("house.confirm.away", { temp }),
        confirm: t("house.confirm.away_button"),
        cancel: t("common.cancel"),
      });
      if (!ok) return;
    }
    if (mode === "off") {
      const ok = await confirmDialog(this, {
        heading: t("house.off"),
        message: zone ? t("house.confirm.off_zone", { zone: zone.name }) : t("house.confirm.off"),
        confirm: t("house.confirm.off_button"),
        cancel: t("common.cancel"),
        danger: true,
      });
      if (!ok) return;
    }
    await this.send("house_mode/set", { mode, zone_id: this.zoneId });
  }

  private async cancelPlanned() {
    const t = this.t;
    const ok = await confirmDialog(this, {
      heading: t("house.vacation"),
      message: t("house.confirm.cancel_vacation"),
      confirm: t("house.confirm.cancel_vacation_button"),
      cancel: t("common.back"),
    });
    if (ok) await this.send("vacation/cancel", { zone_id: this.zoneId });
  }

  private async send(command: string, data: Record<string, unknown>) {
    this.busy = true;
    try {
      await storeFor(this.hass).call(command, data);
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  /** The secondary line: what this part of the house does now. */
  private status(): string {
    const t = this.t;
    const house = this.house;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    if (!house) {
      // The zones differ: "1. patro: Pryč · 2. patro: Normálně"
      return this.snapshot.zones.map((zone) => `${zone.name}: ${t(`house.${zone.house.effective}`)}`).join(" · ");
    }
    if (house.effective === "vacation") {
      const end = house.vacation?.end;
      return end ? t("house.banner.vacation", { until: formatDateTime(end, ctx) }) : t("house.banner.vacation_open");
    }
    if (house.effective === "away") return t(this.zone ? "house.banner.away_zone" : "house.banner.away");
    if (house.effective === "off") return t(this.zone ? "house.banner.off_zone" : "house.banner.off");
    return t("house.auto");
  }

  private back() {
    const t = this.t;
    const effective = this.effective;
    if (effective === null || effective === "auto") return nothing;
    return this.hint(
      effective === "off" ? t("house.off_hint") : t("house.back_hint"),
      effective === "off" ? t("house.heating_on") : t("house.home_again"),
      () => this.send("house_mode/set", { mode: "auto", zone_id: this.zoneId }),
    );
  }

  private planned() {
    const vacation = this.house?.vacation;
    if (!vacation || vacation.active) return nothing;
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const from = formatDateTime(vacation.start, ctx);
    const text = vacation.end
      ? t("house.planned", { from, to: formatDateTime(vacation.end, ctx) })
      : t("house.planned_open", { from });
    return this.hint(text, t("house.cancel_planned"), () => this.cancelPlanned());
  }

  private hint(text: string, action: string, onAction: () => void) {
    return html`<ha-alert alert-type="info">
      <div class="hint">
        <span>${text}</span>
        <ha-button appearance="plain" ?disabled=${this.busy} @click=${onAction}>${action}</ha-button>
      </div>
    </ha-alert>`;
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const effective = this.effective;
    const options = HOUSE_MODES.map((mode) => ({
      value: mode,
      label: t(`house.${mode}`),
      path: HOUSE_ICONS[mode],
    }));
    const color = effective ? HOUSE_COLORS[effective] : "var(--state-inactive-color, #9e9e9e)";
    return html`
      <ha-card style="--tile-color:${color}">
        <ha-tile-container>
          <ha-tile-icon slot="icon" .iconPath=${HOUSE_ICONS[effective ?? "auto"]}></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${this.zone ? this.zone.name : t("house.title")}</span>
            <span slot="secondary">${this.status()}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-select
              .options=${options}
              .value=${effective ?? undefined}
              .label=${this.zone ? this.zone.name : t("house.title")}
              .disabled=${this.busy}
              @value-changed=${this.selected}
            ></ha-control-select>
            ${this.back()} ${this.planned()}
          </div>
        </ha-tile-container>
      </ha-card>
    `;
  }
}

define("hs-house-card", HsHouseCard);
