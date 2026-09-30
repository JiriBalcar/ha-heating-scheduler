import { LitElement, css, html, nothing } from "lit";
import { formatContext, formatDateTime, formatTemp } from "../format";
import { languageOf, translator } from "../i18n";
import { HOUSE_COLORS, HOUSE_ICONS, houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import { HOUSE_MODES, type HomeAssistant, type HouseMode, type Snapshot } from "../types";
import { define } from "./define";
import { confirmDialog } from "./hs-dialog";
import { openHolidayDialog } from "./hs-holiday-dialog";

/** The house mode as an HA tile: Normal / Away / Holiday / Off, and what is planned. */
export class HsHouseCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare busy: boolean;

  constructor() {
    super();
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
    `,
  ];

  private get t() {
    return translator(languageOf(this.hass));
  }

  private async selected(event: CustomEvent<{ value: HouseMode }>) {
    const mode = event.detail.value;
    const select = event.currentTarget as HTMLElement & { value?: string };
    await this.setMode(mode);
    // The selector shows what the house really does until the new state arrives.
    select.value = this.snapshot.house.effective;
    this.requestUpdate();
  }

  private async setMode(mode: HouseMode) {
    const t = this.t;
    const snapshot = this.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    if (mode === snapshot.house.effective) return;
    if (mode === "vacation") {
      openHolidayDialog(this, snapshot);
      return;
    }
    if (mode === "away") {
      const temp = formatTemp(houseTemperature(snapshot, "away"), ctx);
      const ok = await confirmDialog(this, {
        heading: t("house.away"),
        message: t("house.confirm.away", { temp }),
        confirm: t("house.confirm.away_button"),
        cancel: t("common.cancel"),
      });
      if (!ok) return;
    }
    if (mode === "off") {
      const ok = await confirmDialog(this, {
        heading: t("house.off"),
        message: t("house.confirm.off"),
        confirm: t("house.confirm.off_button"),
        cancel: t("common.cancel"),
        danger: true,
      });
      if (!ok) return;
    }
    await this.send("house_mode/set", { mode });
  }

  private async cancelPlanned() {
    const t = this.t;
    const ok = await confirmDialog(this, {
      heading: t("house.vacation"),
      message: t("house.confirm.cancel_vacation"),
      confirm: t("house.confirm.cancel_vacation_button"),
      cancel: t("common.back"),
    });
    if (ok) await this.send("vacation/cancel", {});
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

  /** The secondary line: what the house does now. */
  private status(): string {
    const t = this.t;
    const house = this.snapshot.house;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    if (house.effective === "vacation") {
      const end = house.vacation?.end;
      return end ? t("house.banner.vacation", { until: formatDateTime(end, ctx) }) : t("house.banner.vacation_open");
    }
    if (house.effective === "away") return t("house.banner.away");
    if (house.effective === "off") return t("house.banner.off");
    return t("house.auto");
  }

  private back() {
    const t = this.t;
    const effective = this.snapshot.house.effective;
    if (effective === "auto") return nothing;
    return html`<ha-alert alert-type="info" narrow>
      ${effective === "off" ? t("house.banner.off") : t("house.back_hint")}
      <ha-button
        slot="action"
        appearance="plain"
        ?disabled=${this.busy}
        @click=${() => this.send("house_mode/set", { mode: "auto" })}
      >
        ${effective === "off" ? t("house.heating_on") : t("house.home_again")}
      </ha-button>
    </ha-alert>`;
  }

  private planned() {
    const vacation = this.snapshot.house.vacation;
    if (!vacation || vacation.active) return nothing;
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const from = formatDateTime(vacation.start, ctx);
    const text = vacation.end
      ? t("house.planned", { from, to: formatDateTime(vacation.end, ctx) })
      : t("house.planned_open", { from });
    return html`<ha-alert alert-type="info" narrow>
      ${text}
      <ha-button slot="action" appearance="plain" ?disabled=${this.busy} @click=${this.cancelPlanned}>
        ${t("house.cancel_planned")}
      </ha-button>
    </ha-alert>`;
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const effective = this.snapshot.house.effective;
    const options = HOUSE_MODES.map((mode) => ({
      value: mode,
      label: t(`house.${mode}`),
      path: HOUSE_ICONS[mode],
    }));
    return html`
      <ha-card style="--tile-color:${HOUSE_COLORS[effective]}">
        <ha-tile-container>
          <ha-tile-icon slot="icon" .iconPath=${HOUSE_ICONS[effective]}></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${t("house.title")}</span>
            <span slot="secondary">${this.status()}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-select
              .options=${options}
              .value=${effective}
              .label=${t("house.title")}
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
