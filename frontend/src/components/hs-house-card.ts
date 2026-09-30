import { LitElement, css, html, nothing } from "lit";
import { formatContext, formatDateTime, plannedText } from "../format";
import { showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { HOUSE_COLORS, HOUSE_ICONS, MIXED_ICON } from "../modes";
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
import { hint, hintStyles } from "./hint";
import { cancelPlannedHoliday, chooseHouseMode, sendHouseCommand } from "./house-actions";
import "./hs-house-dialog";

/**
 * The house mode as an HA tile: Normal / Away / Holiday / Off, and what is planned. A tap on the
 * tile opens the house dialog with big buttons, like HA's alarm panel dialog.
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
    hintStyles,
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

  private async run(action: () => Promise<void>) {
    this.busy = true;
    try {
      await action();
    } finally {
      this.busy = false;
    }
  }

  private async selected(event: CustomEvent<{ value: HouseMode }>) {
    const select = event.currentTarget as HTMLElement & { value?: string };
    const mode = event.detail.value;
    if (mode !== this.effective) await this.run(() => chooseHouseMode(this, this.hass, this.snapshot, this.zone, mode));
    // The selector shows what the house really does until the new state arrives.
    select.value = this.effective ?? undefined;
    this.requestUpdate();
  }

  private openDialog() {
    showDialog(this, "hs-house-dialog", { zoneId: this.zone?.id ?? null, snapshot: this.snapshot });
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
    return hint(
      effective === "off" ? t("house.off_hint") : t("house.back_hint"),
      effective === "off" ? t("house.heating_on") : t("house.home_again"),
      () => this.run(() => sendHouseCommand(this, this.hass, "house_mode/set", { mode: "auto", zone_id: this.zone?.id })),
      this.busy,
    );
  }

  private planned() {
    const vacation = this.house?.vacation;
    if (!vacation || vacation.active) return nothing;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    return hint(
      plannedText(vacation, ctx, this.t),
      this.t("house.cancel_planned"),
      () => this.run(() => cancelPlannedHoliday(this, this.hass, this.zone)),
      this.busy,
    );
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
    const name = this.zone ? this.zone.name : t("house.title");
    return html`
      <ha-card style="--tile-color:${color}">
        <ha-tile-container .interactive=${true} .actionHandlerOptions=${{}} @action=${this.openDialog}>
          <ha-tile-icon slot="icon" .iconPath=${effective ? HOUSE_ICONS[effective] : MIXED_ICON}></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${name}</span>
            <span slot="secondary">${this.status()}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-select
              .options=${options}
              .value=${effective ?? undefined}
              .label=${name}
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
