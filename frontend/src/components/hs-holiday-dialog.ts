import { css, html, nothing } from "lit";
import { formatContext, formatDateTime, formatTemp, zonedParts, zonedToUtc } from "../format";
import { showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import type { Snapshot } from "../types";
import { define } from "./define";
import { HsHaDialog, confirmDialog } from "./hs-dialog";

interface HolidayParams {
  snapshot: Snapshot;
}

interface HolidayData {
  leave: "now" | "later";
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  mode: "frost" | "away";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "YYYY-MM-DD" of an instant in the house's time zone, as HA's date field uses. */
function localDate(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** A date field and a time field, side by side. */
function dateTime(prefix: "start" | "end") {
  return {
    name: "",
    type: "grid",
    schema: [
      { name: `${prefix}_date`, required: true, selector: { date: {} } },
      { name: `${prefix}_time`, required: true, selector: { time: { no_second: true } } },
    ],
  };
}

/** Holiday: leaving (now or later), coming back, temperature. */
export class HsHolidayDialog extends HsHaDialog<HolidayParams> {
  static override properties = {
    data: { state: true },
    error: { state: true },
  };
  declare data: HolidayData;
  declare error: string;

  static override styles = css`
    ha-alert {
      display: block;
      margin-top: var(--ha-space-4, 16px);
    }
  `;

  override showDialog(params: HolidayParams): void {
    const tz = params.snapshot.time_zone;
    this.data = {
      leave: "now",
      start_date: localDate(new Date(), tz),
      start_time: "08:00",
      end_date: localDate(new Date(Date.now() + 24 * 3600 * 1000), tz),
      end_time: "12:00",
      mode: params.snapshot.settings.vacation_mode,
    };
    this.error = "";
    super.showDialog(params);
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  /** An instant from "YYYY-MM-DD" and "HH:MM[:SS]" in the house's time zone. */
  private instant(date: string | undefined, time: string | undefined): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})/.exec(`${date ?? ""} ${time ?? ""}`);
    if (!match || !this.params) return null;
    const [year, month, day, hour, minute] = match.slice(1).map(Number) as [number, number, number, number, number];
    return zonedToUtc(year, month, day, hour, minute, this.params.snapshot.time_zone);
  }

  private schema() {
    const t = this.t;
    const snapshot = this.params!.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    const temperature = (mode: "frost" | "away") => formatTemp(houseTemperature(snapshot, mode), ctx);
    return [
      {
        name: "leave",
        selector: {
          select: {
            mode: "box",
            options: [
              { value: "now", label: t("vacation.now") },
              { value: "later", label: t("vacation.later") },
            ],
          },
        },
      },
      ...(this.data.leave === "later" ? [dateTime("start")] : []),
      dateTime("end"),
      {
        name: "mode",
        selector: {
          select: {
            mode: "box",
            options: [
              { value: "frost", label: t("mode.frost"), description: temperature("frost") },
              { value: "away", label: t("mode.away"), description: temperature("away") },
            ],
          },
        },
      },
    ];
  }

  private label = (field: { name: string }): string => {
    const t = this.t;
    switch (field.name) {
      case "leave":
        return t("vacation.from");
      case "start_date":
        return t("vacation.leave_at");
      case "end_date":
        return t("vacation.to");
      case "start_time":
      case "end_time":
        return t("vacation.time");
      default:
        return t("vacation.temperature");
    }
  };

  private changed(event: CustomEvent<{ value: HolidayData }>) {
    this.data = { ...this.data, ...event.detail.value };
    this.error = "";
  }

  private async submit() {
    const t = this.t;
    const snapshot = this.params!.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    const end = this.instant(this.data.end_date, this.data.end_time);
    if (!end) {
      this.error = t("vacation.error_end");
      return;
    }
    const start = this.data.leave === "later" ? this.instant(this.data.start_date, this.data.start_time) : null;
    const begin = start && start.getTime() > Date.now() ? start : null;
    if (end.getTime() <= (begin ?? new Date()).getTime()) {
      this.error = t("vacation.error_order");
      return;
    }
    const temp = formatTemp(houseTemperature(snapshot, this.data.mode), ctx);
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
        mode: this.data.mode,
      });
      this.closeDialog();
    } catch (error) {
      toast(this, errorText(error, t));
    }
  }

  override render() {
    if (!this.params || !this.hass) return nothing;
    const t = this.t;
    return html`
      <ha-dialog .open=${this.open} header-title=${t("vacation.title")} @closed=${this.onClosed}>
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.schema()}
          .computeLabel=${this.label}
          @value-changed=${this.changed}
        ></ha-form>
        ${this.error ? html`<ha-alert alert-type="error">${this.error}</ha-alert>` : nothing}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${this.submit}>
            ${this.data.leave === "later" ? t("vacation.plan") : t("vacation.start")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-holiday-dialog", HsHolidayDialog);

export function openHolidayDialog(host: HTMLElement, snapshot: Snapshot): void {
  showDialog(host, "hs-holiday-dialog", { snapshot });
}
