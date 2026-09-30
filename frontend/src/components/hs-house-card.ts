import { LitElement, css, html, nothing } from "lit";
import { formatContext, formatDateTime } from "../format";
import { showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { HOUSE_COLORS, HOUSE_ICONS, MIXED_ICON } from "../modes";
import { baseStyles } from "../styles";
import {
  type HomeAssistant,
  type HouseData,
  type HouseMode,
  type Snapshot,
  type ZoneData,
} from "../types";
import { commonMode, offeredModes, wholeHouse } from "../zones";
import { define } from "./define";
import { chooseHouseMode } from "./house-actions";
import "./hs-house-dialog";

/**
 * The house mode as an HA tile: Normal / Away / Holiday / Off, as icons only, like HA's alarm modes.
 * A tap on the tile opens the house dialog with big buttons and their names, like HA's alarm panel
 * dialog. Hints (back to Normal, a planned holiday)
 * are shown once above the tiles (hs-house-hints), so every tile has one height.
 * With a `zone`, the tile shows and sets that zone; without one, the whole house (every zone).
 */
export class HsHouseCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    zone: { attribute: false },
    fixed: { type: Boolean },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare zone: ZoneData | null;
  /** The dashboard's grid gives the tile a fixed height: HA's fixed info height, like its tile. */
  declare fixed: boolean;
  declare busy: boolean;

  constructor() {
    super();
    this.zone = null;
    this.fixed = false;
    this.busy = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
        height: 100%;
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
        --control-select-thickness: var(--feature-height, 42px);
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
    // The selector shows what the house really does, also while a question is open.
    select.value = this.effective ?? undefined;
    // Holiday again opens the holiday dialog, to change the dates.
    if (mode !== this.effective || mode === "vacation") {
      await this.run(() => chooseHouseMode(this, this.hass, this.snapshot, this.zone, mode));
    }
    select.value = this.effective ?? undefined;
    this.requestUpdate();
  }

  private openDialog() {
    showDialog(this, "hs-house-dialog", { zoneId: this.zone?.id ?? null, snapshot: this.snapshot });
  }

  private iconAction(event: Event) {
    event.stopPropagation();
    this.openDialog();
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
    const vacation = house.vacation;
    if (vacation?.active && vacation.replacement) {
      // A zone without Holiday runs its replacement for the holiday's dates.
      const mode = t(`house.${vacation.replacement}`);
      return vacation.end
        ? t("house.banner.replaced", { mode, until: formatDateTime(vacation.end, ctx) })
        : t("house.banner.replaced_open", { mode });
    }
    if (house.effective === "vacation") {
      const end = house.vacation?.end;
      return end ? t("house.banner.vacation", { until: formatDateTime(end, ctx) }) : t("house.banner.vacation_open");
    }
    if (house.effective === "away") return t(this.zone ? "house.banner.away_zone" : "house.banner.away");
    if (house.effective === "frost") return t(this.zone ? "house.banner.frost_zone" : "house.banner.frost");
    if (house.effective === "off") return t(this.zone ? "house.banner.off_zone" : "house.banner.off");
    return t("house.auto");
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const effective = this.effective;
    const options = offeredModes(this.snapshot, this.zone).map((mode) => ({
      value: mode,
      label: t(`house.${mode}`),
      path: HOUSE_ICONS[mode],
    }));
    const color = effective ? HOUSE_COLORS[effective] : "var(--state-inactive-color, #9e9e9e)";
    const name = this.zone ? this.zone.name : t("house.title");
    return html`
      <ha-card style="--tile-color:${color}">
        <ha-tile-container
          .interactive=${true}
          .actionHandlerOptions=${{}}
          .fixedInfoHeight=${this.fixed}
          @action=${this.openDialog}
        >
          <ha-tile-icon
            slot="icon"
            .iconPath=${effective ? HOUSE_ICONS[effective] : MIXED_ICON}
            .interactive=${true}
            .actionHandlerOptions=${{}}
            @action=${this.iconAction}
          ></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${name}</span>
            <span slot="secondary">${this.status()}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-select
              .options=${options}
              .value=${effective ?? undefined}
              hide-option-label
              .label=${name}
              .disabled=${this.busy}
              @value-changed=${this.selected}
            ></ha-control-select>
          </div>
        </ha-tile-container>
      </ha-card>
    `;
  }
}

define("hs-house-card", HsHouseCard);
