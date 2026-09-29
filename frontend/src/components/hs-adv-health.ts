import { LitElement, css, html, nothing } from "lit";
import { mdiRefresh } from "@mdi/js";
import { formatContext, formatDateTime, formatTemp } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot, TrvStatus } from "../types";
import { define } from "./define";
import "./hs-icon";

const PHASE_COLORS: Record<TrvStatus["phase"], string> = {
  idle: "#2e7d32",
  writing: "#1565c0",
  waiting: "#616161",
  failed: "#c62828",
};

/** Every valve: wanted and actual setpoint, phase, last write, errors. */
export class HsAdvHealth extends LitElement {
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
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .room {
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      h3 {
        font-size: 20px;
      }
      .valve {
        border-top: 1px solid var(--divider-color, #e0e0e0);
        padding-top: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 6px 16px;
        font-size: 16px;
      }
      .valve .name {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 17px;
      }
      .phase {
        color: #fff;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 14px;
      }
      .error {
        grid-column: 1 / -1;
        color: var(--error-color, #c62828);
      }
      dt {
        font-size: 14px;
      }
      dd {
        margin: 0;
        font-weight: 600;
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  private async check() {
    this.busy = true;
    try {
      await storeFor(this.hass).call("reconcile");
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const allOk = this.snapshot.rooms.every((room) => room.issues.length === 0);
    const name = (id: string) => {
      const friendly = this.hass.states[id]?.attributes.friendly_name;
      return typeof friendly === "string" ? friendly : id;
    };
    return html`
      <button class="btn primary" ?disabled=${this.busy} @click=${this.check}>
        <hs-icon .path=${mdiRefresh}></hs-icon>${t("adv.health.check_now")}
      </button>
      ${allOk ? html`<p>${t("adv.health.all_ok")}</p>` : nothing}
      ${this.snapshot.rooms.map(
        (room) => html`<section class="card room">
          <h3>${room.name}</h3>
          ${room.trv_status.length === 0 ? html`<span class="muted">${t("adv.rooms.none_trvs")}</span>` : nothing}
          ${room.trv_status.map(
            (trv) => html`<dl class="valve">
              <div class="name">
                ${name(trv.entity_id)}
                <span class="phase" style="background:${PHASE_COLORS[trv.phase]}">
                  ${t(`adv.health.phase.${trv.phase}`)}
                </span>
              </div>
              <div><dt class="muted">${t("adv.health.wanted")}</dt><dd>${formatTemp(trv.desired, ctx)}</dd></div>
              <div><dt class="muted">${t("adv.health.valve")}</dt><dd>${formatTemp(trv.setpoint, ctx)}</dd></div>
              <div><dt class="muted">${t("adv.health.mode")}</dt><dd>${trv.hvac_mode ?? "—"}</dd></div>
              <div>
                <dt class="muted">${t("adv.health.last_write")}</dt>
                <dd>${trv.last_write ? formatDateTime(trv.last_write, ctx) : "—"}</dd>
              </div>
              ${room.issues
                .filter((issue) => issue.entity_id === trv.entity_id)
                .map((issue) => html`<div class="error">${t(`health.${issue.kind}`, { name: name(trv.entity_id) })}</div>`)}
              ${trv.last_error ? html`<div class="error">${t("adv.health.error")}: ${trv.last_error}</div>` : nothing}
            </dl>`,
          )}
        </section>`,
      )}
    `;
  }
}

define("hs-adv-health", HsAdvHealth);
