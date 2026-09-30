import { LitElement, css, html, nothing } from "lit";
import { mdiRefresh } from "@mdi/js";
import { formatContext, formatDateTime, formatTemp } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot, TrvStatus } from "../types";
import { define } from "./define";

const PHASE_COLORS: Record<TrvStatus["phase"], string> = {
  idle: "var(--success-color, #43a047)",
  writing: "var(--info-color, #039be5)",
  waiting: "var(--disabled-color, #bdbdbd)",
  failed: "var(--error-color, #db4437)",
};

/** Every valve: wanted and actual setpoint, phase, last write, errors. */
/** The phase to show: an offline valve waits ("Nedostupná") even before it counts as a problem. */
function phase(trv: TrvStatus): TrvStatus["phase"] {
  return trv.available ? trv.phase : "waiting";
}

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
        gap: var(--ha-space-4, 16px);
      }
      .top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-4, 16px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      p {
        margin: 0;
      }
      .card-content {
        padding: 0 var(--ha-space-4, 16px) var(--ha-space-4, 16px);
      }
      .phase {
        display: inline-flex;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      ha-alert {
        display: block;
        margin: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
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
    // An offline valve is reported as a problem only after a while; the list shows it at once.
    const allOk = this.snapshot.rooms.every(
      (room) => room.issues.length === 0 && room.trv_status.every((trv) => trv.available),
    );
    // HVAC modes in HA's own words ("Topení"), as HA shows them for climate entities.
    const hvacMode = (mode: string | null) =>
      mode ? this.hass.localize?.(`component.climate.entity_component._.state.${mode}`) || mode : "—";
    const name = (id: string) => {
      const friendly = this.hass.states[id]?.attributes.friendly_name;
      return typeof friendly === "string" ? friendly : id;
    };
    return html`
      <div class="top">
        <ha-button .disabled=${this.busy} .loading=${this.busy} @click=${this.check}>
          <ha-svg-icon slot="start" .path=${mdiRefresh}></ha-svg-icon>${t("adv.health.check_now")}
        </ha-button>
        ${allOk ? html`<span class="muted">${t("adv.health.all_ok")}</span>` : nothing}
      </div>
      ${this.snapshot.rooms.map(
        (room) => html`<ha-card .header=${room.name}>
          ${room.trv_status.length === 0
            ? html`<div class="card-content muted">${t("adv.rooms.none_trvs")}</div>`
            : nothing}
          ${room.trv_status.map(
            (trv) => html`<ha-md-list-item
                type="button"
                @click=${() => this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: trv.entity_id }, bubbles: true, composed: true }))}
              >
                <span slot="headline">${name(trv.entity_id)}</span>
                <span slot="supporting-text">
                  ${t("adv.health.wanted")} ${formatTemp(trv.desired, ctx)} · ${t("adv.health.valve")}
                  ${formatTemp(trv.setpoint, ctx)} · ${t("adv.health.mode")} ${trv.available ? hvacMode(trv.hvac_mode) : "—"}
                </span>
                <span slot="supporting-text">
                  ${t("adv.health.last_write")}: ${trv.last_write ? formatDateTime(trv.last_write, ctx) : "—"}
                </span>
                <span slot="end" class="phase">
                  <span class="dot" style="background:${PHASE_COLORS[phase(trv)]}"></span>
                  ${t(`adv.health.phase.${phase(trv)}`)}
                </span>
              </ha-md-list-item>
              ${room.issues
                .filter((issue) => issue.entity_id === trv.entity_id)
                .map(
                  (issue) =>
                    html`<ha-alert alert-type="warning">${t(`health.${issue.kind}`, { name: name(trv.entity_id) })}</ha-alert>`,
                )}
              ${trv.last_error
                ? html`<ha-alert alert-type="error">${t("adv.health.error")}: ${trv.last_error}</ha-alert>`
                : nothing}`,
          )}
        </ha-card>`,
      )}
    `;
  }
}

define("hs-adv-health", HsAdvHealth);
