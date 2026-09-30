import { css, html, nothing } from "lit";
import { formatContext, formatDateTime, formatTemp, zonedParts, zonedToUtc } from "../format";
import { showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { houseTemperature } from "../modes";
import { errorText, storeFor, toast } from "../store";
import type { Snapshot, ZoneData } from "../types";
import { wholeHouse } from "../zones";
import { define } from "./define";
import { HsHaDialog, confirmDialog } from "./hs-dialog";

interface HolidayParams {
  snapshot: Snapshot;
  /** The zone of the holiday; null for the whole house. */
  zone: ZoneData | null;
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

/** "HH:MM" of an instant in the house's time zone, as HA's time field uses. */
function localTime(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

const DATE_SELECTOR = { date: {} };
const TIME_SELECTOR = { time: { no_second: true } };

/** Holiday: leaving (now or later), coming back, temperature. */
export class HsHolidayDialog extends HsHaDialog<HolidayParams> {
  static override properties = {
    data: { state: true },
    error: { state: true },
  };
  declare data: HolidayData;
  declare error: string;

  // HA's form grid gives the time field its own label and a column as wide as the date field, so
  // the two fields do not line up. They share one wrapping row instead, as in HA's date-time field:
  // the date field grows, and the time field keeps its size and has no label of its own.
  static override styles = css`
    ha-alert {
      display: block;
      margin-bottom: var(--ha-space-4, 16px);
    }
    .when {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--ha-space-2, 8px);
      margin: var(--ha-space-6, 24px) 0;
    }
    .date {
      flex: 1 1 180px;
    }
    .time {
      flex: 0 0 auto;
    }
  `;

  protected override dialogOpened(params: HolidayParams): void {
    const tz = params.snapshot.time_zone;
    this.data = {
      leave: "now",
      start_date: localDate(new Date(), tz),
      start_time: "08:00",
      end_date: localDate(new Date(Date.now() + 24 * 3600 * 1000), tz),
      end_time: "12:00",
      mode: params.snapshot.settings.vacation_mode,
    };
    // A holiday that is on or planned opens with its own dates, to change them.
    const house = params.zone ? params.zone.house : wholeHouse(params.snapshot);
    const vacation = house?.vacation;
    if (vacation) {
      const start = new Date(vacation.start);
      this.data = {
        ...this.data,
        leave: vacation.active ? "now" : "later",
        ...(vacation.active ? {} : { start_date: localDate(start, tz), start_time: localTime(start, tz) }),
        ...(vacation.end
          ? { end_date: localDate(new Date(vacation.end), tz), end_time: localTime(new Date(vacation.end), tz) }
          : {}),
        mode: vacation.mode,
      };
    }
    this.error = "";
  }

  /** Show an error at the top of the dialog, where it is seen. */
  private async fail(message: string) {
    this.error = message;
    await this.updateComplete;
    this.shadowRoot?.querySelector("ha-alert")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  /** An instant from "YYYY-MM-DD" and "HH:MM[:SS]" in the house's time zone. */
  private instant(date: string | undefined, time: string | undefined): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})/.exec(`${date ?? ""} ${time ?? ""}`);
    if (!match || !this.args) return null;
    const [year, month, day, hour, minute] = match.slice(1).map(Number) as [number, number, number, number, number];
    return zonedToUtc(year, month, day, hour, minute, this.args.snapshot.time_zone);
  }

  private leaveSchema() {
    const t = this.t;
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
    ];
  }

  private modeSchema() {
    const t = this.t;
    const snapshot = this.args!.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    const temperature = (mode: "frost" | "away") => formatTemp(houseTemperature(snapshot, mode), ctx);
    return [
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

  private label = (field: { name: string }): string =>
    field.name === "leave" ? this.t("vacation.from") : this.t("vacation.temperature");

  private changed(value: Partial<HolidayData>) {
    this.data = { ...this.data, ...value };
    this.error = "";
  }

  /** The date and time of leaving ("start") or of coming back ("end"). */
  private when(prefix: "start" | "end") {
    const date = prefix === "start" ? "start_date" : "end_date";
    const time = prefix === "start" ? "start_time" : "end_time";
    return html`<div class="when">
      <ha-selector
        class="date"
        .hass=${this.hass}
        .selector=${DATE_SELECTOR}
        .label=${prefix === "start" ? this.t("vacation.leave_at") : this.t("vacation.to")}
        .value=${this.data[date]}
        .required=${true}
        @value-changed=${(e: CustomEvent<{ value: string }>) => this.changed({ [date]: e.detail.value })}
      ></ha-selector>
      <ha-selector
        class="time"
        .hass=${this.hass}
        .selector=${TIME_SELECTOR}
        .value=${this.data[time]}
        .required=${true}
        @value-changed=${(e: CustomEvent<{ value: string }>) => this.changed({ [time]: e.detail.value })}
      ></ha-selector>
    </div>`;
  }

  private async submit() {
    const t = this.t;
    const snapshot = this.args!.snapshot;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    const end = this.instant(this.data.end_date, this.data.end_time);
    if (!end) {
      void this.fail(t("vacation.error_end"));
      return;
    }
    const start = this.data.leave === "later" ? this.instant(this.data.start_date, this.data.start_time) : null;
    const begin = start && start.getTime() > Date.now() ? start : null;
    if (end.getTime() <= (begin ?? new Date()).getTime()) {
      void this.fail(t("vacation.error_order"));
      return;
    }
    const temp = formatTemp(houseTemperature(snapshot, this.data.mode), ctx);
    const to = formatDateTime(end.toISOString(), ctx);
    const zone = this.args!.zone;
    const from = begin ? formatDateTime(begin.toISOString(), ctx) : "";
    const message = zone
      ? begin
        ? t("vacation.confirm_zone", { zone: zone.name, from, to, temp })
        : t("vacation.confirm_now_zone", { zone: zone.name, to, temp })
      : begin
        ? t("vacation.confirm", { from, to, temp })
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
        zone_id: zone?.id,
      });
      this.closeDialog();
    } catch (error) {
      toast(this, errorText(error, t));
    }
  }

  override render() {
    if (!this.args || !this.hass) return nothing;
    const t = this.t;
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${this.args.zone ? t("vacation.title_zone", { zone: this.args.zone.name }) : t("vacation.title")}
        @closed=${this.onClosed}
      >
        ${this.error ? html`<ha-alert alert-type="error">${this.error}</ha-alert>` : nothing}
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.leaveSchema()}
          .computeLabel=${this.label}
          @value-changed=${(e: CustomEvent<{ value: Partial<HolidayData> }>) => this.changed(e.detail.value)}
        ></ha-form>
        ${this.data.leave === "later" ? this.when("start") : nothing} ${this.when("end")}
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.modeSchema()}
          .computeLabel=${this.label}
          @value-changed=${(e: CustomEvent<{ value: Partial<HolidayData> }>) => this.changed(e.detail.value)}
        ></ha-form>
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

export function openHolidayDialog(host: HTMLElement, snapshot: Snapshot, zone: ZoneData | null): void {
  showDialog(host, "hs-holiday-dialog", { snapshot, zone });
}
