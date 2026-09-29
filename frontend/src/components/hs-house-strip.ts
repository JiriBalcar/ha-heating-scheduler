import { LitElement, css, html, nothing } from "lit";
import { mdiHomeImportOutline } from "@mdi/js";
import { formatContext, formatDateTime, formatTemp } from "../format";
import { languageOf, translator } from "../i18n";
import { HOUSE_COLORS, HOUSE_ICONS, houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import { HOUSE_MODES, type HomeAssistant, type HouseMode, type Snapshot } from "../types";
import { define } from "./define";
import { confirmDialog } from "./hs-dialog";
import "./hs-icon";
import { openVacationDialog } from "./hs-vacation-dialog";

/** The house mode: Normal / Away / Holiday / Off, and what is planned. */
export class HsHouseStrip extends LitElement {
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
      .wrap {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h2 {
        font-size: 17px;
        font-weight: 600;
      }
      .modes {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .mode {
        min-height: 72px;
        padding: 6px 4px;
        flex-direction: column;
        gap: 4px;
        font-size: 16px;
        --hs-icon-size: 28px;
      }
      .mode[aria-pressed="true"] {
        color: #fff;
        border-color: transparent;
      }
      .banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border-radius: 14px;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }
      .banner span {
        flex: 1 1 220px;
      }
      .banner .btn {
        flex: 1 1 220px;
        background: #fff;
        color: #1f1f1f;
        border-color: #fff;
      }
      .planned {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        font-size: 17px;
      }
      .planned span {
        flex: 1 1 220px;
      }
      @media (max-width: 380px) {
        .mode {
          font-size: 14px;
        }
      }
    `,
  ];

  private get t() {
    return translator(languageOf(this.hass));
  }

  private async setMode(mode: HouseMode) {
    const t = this.t;
    const snapshot = this.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    if (mode === snapshot.house.effective) return;
    if (mode === "vacation") {
      await openVacationDialog(this, this.hass, snapshot);
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

  private banner() {
    const t = this.t;
    const house = this.snapshot.house;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    let text: string;
    if (house.effective === "vacation") {
      const end = house.vacation?.end;
      text = end
        ? t("house.banner.vacation", { until: formatDateTime(end, ctx) })
        : t("house.banner.vacation_open");
    } else if (house.effective === "away") {
      text = t("house.banner.away");
    } else {
      text = t("house.banner.off");
    }
    const button = house.effective === "off" ? t("house.heating_on") : t("house.home_again");
    return html`
      <div class="banner" role="status" style="background:${HOUSE_COLORS[house.effective]}">
        <span>${text}</span>
        <button class="btn" ?disabled=${this.busy} @click=${() => this.send("house_mode/set", { mode: "auto" })}>
          <hs-icon .path=${mdiHomeImportOutline}></hs-icon>${button}
        </button>
      </div>
    `;
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
    return html`
      <div class="planned">
        <span>${text}</span>
        <button class="btn small" ?disabled=${this.busy} @click=${this.cancelPlanned}>
          ${t("house.cancel_planned")}
        </button>
      </div>
    `;
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const effective = this.snapshot.house.effective;
    return html`
      <section class="card wrap" aria-label=${t("house.title")}>
        <h2 class="muted">${t("house.title")}</h2>
        <div class="modes" role="group" aria-label=${t("house.title")}>
          ${HOUSE_MODES.map((mode) => {
            const active = mode === effective;
            return html`<button
              class="btn mode"
              aria-pressed=${active ? "true" : "false"}
              style=${active ? `background:${HOUSE_COLORS[mode]}` : ""}
              ?disabled=${this.busy}
              @click=${() => this.setMode(mode)}
            >
              <hs-icon .path=${HOUSE_ICONS[mode]}></hs-icon>${t(`house.${mode}`)}
            </button>`;
          })}
        </div>
        ${effective !== "auto" ? this.banner() : nothing} ${this.planned()}
      </section>
    `;
  }
}

define("hs-house-strip", HsHouseStrip);
