import { LitElement, css, html, nothing } from "lit";
import { mdiBagSuitcase, mdiHomeExportOutline, mdiSnowflake } from "@mdi/js";
import { formatContext, formatDateTime, formatTemp, zonedParts, zonedToUtc } from "../format";
import { languageOf, translator } from "../i18n";
import { MODE_COLORS, houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";
import { confirmDialog, type HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Holiday: leaving (now or later), coming back, temperature. */
export class HsVacationDialog extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    later: { state: true },
    fromDate: { state: true },
    fromTime: { state: true },
    toDate: { state: true },
    toTime: { state: true },
    mode: { state: true },
    error: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare later: boolean;
  declare fromDate: string;
  declare fromTime: string;
  declare toDate: string;
  declare toTime: string;
  declare mode: "frost" | "away";
  declare error: string;

  static override styles = [
    baseStyles,
    css`
      form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      fieldset {
        border: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      legend {
        font-weight: 700;
        font-size: 19px;
        padding: 0;
        margin-bottom: 8px;
      }
      .pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .choice {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .choice button[aria-pressed="true"] {
        border-color: var(--hs-accent, #1565c0);
        background: var(--hs-accent, #1565c0);
        color: #fff;
      }
      .option {
        min-height: 64px;
        flex-direction: column;
        gap: 2px;
      }
      .option small {
        font-weight: 500;
        font-size: 15px;
      }
      .error {
        color: var(--error-color, #c62828);
        font-weight: 600;
        margin: 0;
      }
    `,
  ];

  get dialog(): HsDialog | null {
    return this.renderRoot.querySelector("hs-dialog");
  }

  prepare(): void {
    const tz = this.snapshot.time_zone;
    const now = zonedParts(new Date(), tz);
    const tomorrow = zonedParts(new Date(Date.now() + 24 * 3600 * 1000), tz);
    this.later = false;
    this.fromDate = `${now.year}-${pad(now.month)}-${pad(now.day)}`;
    this.fromTime = "08:00";
    this.toDate = `${tomorrow.year}-${pad(tomorrow.month)}-${pad(tomorrow.day)}`;
    this.toTime = "12:00";
    this.mode = this.snapshot.settings.vacation_mode;
    this.error = "";
  }

  private instant(date: string, time: string): Date | null {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    if (![year, month, day, hour, minute].every((value) => Number.isFinite(value))) return null;
    return zonedToUtc(year!, month!, day!, hour!, minute!, this.snapshot.time_zone);
  }

  private async submit(event: Event) {
    event.preventDefault();
    const lang = languageOf(this.hass);
    const t = translator(lang);
    const ctx = formatContext(this.hass, lang, this.snapshot);
    const end = this.toDate && this.toTime ? this.instant(this.toDate, this.toTime) : null;
    if (!end) {
      this.error = t("vacation.error_end");
      return;
    }
    const start = this.later ? this.instant(this.fromDate, this.fromTime) : null;
    const begin = start && start.getTime() > Date.now() ? start : null;
    if (end.getTime() <= (begin ?? new Date()).getTime()) {
      this.error = t("vacation.error_order");
      return;
    }
    this.error = "";
    const temp = formatTemp(houseTemperature(this.snapshot, this.mode), ctx);
    const to = formatDateTime(end.toISOString(), ctx);
    const message = begin
      ? t("vacation.confirm", { from: formatDateTime(begin.toISOString(), ctx), to, temp })
      : t("vacation.confirm_now", { to, temp });
    const ok = await confirmDialog(this, {
      heading: t("vacation.title"),
      message,
      confirm: t("vacation.confirm_button"),
      cancel: t("common.back"),
    });
    if (!ok) return;
    try {
      await storeFor(this.hass).call("vacation/set", {
        start: begin ? begin.toISOString() : null,
        end: end.toISOString(),
        mode: this.mode,
      });
      this.dialog?.close();
    } catch (error) {
      toast(this, errorText(error, t));
    }
  }

  override render() {
    if (!this.snapshot) return nothing;
    const lang = languageOf(this.hass);
    const t = translator(lang);
    const ctx = formatContext(this.hass, lang, this.snapshot);
    const option = (value: "frost" | "away", icon: string) => html`
      <button
        type="button"
        class="btn option"
        aria-pressed=${this.mode === value ? "true" : "false"}
        style=${this.mode === value ? `background:${MODE_COLORS[value]};border-color:${MODE_COLORS[value]}` : ""}
        @click=${() => (this.mode = value)}
      >
        <span class="row"><hs-icon .path=${icon}></hs-icon>${t(`mode.${value}`)}</span>
        <small>${formatTemp(houseTemperature(this.snapshot, value), ctx)}</small>
      </button>
    `;
    return html`
      <hs-dialog .heading=${t("vacation.title")} .closeLabel=${t("common.cancel")}>
        <form id="form" @submit=${this.submit}>
          <fieldset>
            <legend>${t("vacation.from")}</legend>
            <div class="choice">
              <button
                type="button"
                class="btn"
                aria-pressed=${this.later ? "false" : "true"}
                @click=${() => (this.later = false)}
              >
                ${t("vacation.now")}
              </button>
              <button
                type="button"
                class="btn"
                aria-pressed=${this.later ? "true" : "false"}
                @click=${() => (this.later = true)}
              >
                ${t("vacation.later")}
              </button>
            </div>
            ${this.later
              ? html`<div class="pair">
                  <label class="field">
                    <span>${t("vacation.date")}</span>
                    <input
                      class="input"
                      type="date"
                      .value=${this.fromDate}
                      @change=${(e: Event) => (this.fromDate = (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label class="field">
                    <span>${t("vacation.time")}</span>
                    <input
                      class="input"
                      type="time"
                      step="900"
                      .value=${this.fromTime}
                      @change=${(e: Event) => (this.fromTime = (e.target as HTMLInputElement).value)}
                    />
                  </label>
                </div>`
              : nothing}
          </fieldset>
          <fieldset>
            <legend>${t("vacation.to")}</legend>
            <div class="pair">
              <label class="field">
                <span>${t("vacation.date")}</span>
                <input
                  class="input"
                  type="date"
                  required
                  .value=${this.toDate}
                  @change=${(e: Event) => (this.toDate = (e.target as HTMLInputElement).value)}
                />
              </label>
              <label class="field">
                <span>${t("vacation.time")}</span>
                <input
                  class="input"
                  type="time"
                  step="900"
                  .value=${this.toTime}
                  @change=${(e: Event) => (this.toTime = (e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>${t("vacation.temperature")}</legend>
            <div class="choice">
              ${option("frost", mdiSnowflake)} ${option("away", mdiHomeExportOutline)}
            </div>
          </fieldset>
          ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
        </form>
        <button slot="actions" class="btn" @click=${() => this.dialog?.close()}>
          ${t("common.cancel")}
        </button>
        <button slot="actions" class="btn primary" type="button" @click=${this.submit}>
          <hs-icon .path=${mdiBagSuitcase}></hs-icon>${this.later ? t("vacation.plan") : t("vacation.start")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-vacation-dialog", HsVacationDialog);

export async function openVacationDialog(host: HTMLElement, hass: HomeAssistant, snapshot: Snapshot) {
  const element = document.createElement("hs-vacation-dialog") as HsVacationDialog;
  element.hass = hass;
  element.snapshot = snapshot;
  element.prepare();
  (host.shadowRoot ?? host).appendChild(element);
  await element.updateComplete;
  const dialog = element.dialog;
  if (!dialog) return;
  dialog.addEventListener("hs-closed", () => element.remove(), { once: true });
  await dialog.show();
}
