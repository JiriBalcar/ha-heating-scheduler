import { css, html, nothing, type PropertyValues } from "lit";
import { formatContext, formatDateTime, formatTemp, plannedText } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
import { HOUSE_COLORS, HOUSE_ICONS, houseTemperature } from "../modes";
import { storeFor } from "../store";
import { HOUSE_MODES, type HouseData, type HouseMode, type Snapshot, type ZoneData } from "../types";
import { commonMode, wholeHouse } from "../zones";
import { define } from "./define";
import { hint, hintStyles } from "./hint";
import { cancelPlannedHoliday, chooseHouseMode } from "./house-actions";
import { HsHaDialog } from "./hs-dialog";

interface HouseDialogParams {
  /** The zone the dialog shows; null for the whole house. */
  zoneId: string | null;
  /** The state when the dialog opens; later states come from the store. */
  snapshot: Snapshot;
}

/**
 * The mode of the whole house or of a zone, laid out like HA's alarm panel dialog: the state in
 * big letters and one big vertical selector (HA's own, with HA's sizes).
 */
export class HsHouseDialog extends HsHaDialog<HouseDialogParams> {
  static override properties = {
    snapshot: { state: true },
    busy: { state: true },
  };
  declare snapshot: Snapshot | null;
  declare busy: boolean;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.snapshot = null;
    this.busy = false;
  }

  static override styles = [
    hintStyles,
    css`
      p {
        margin: 0;
        text-align: center;
      }
      .state {
        font-size: 36px;
        font-weight: var(--ha-font-weight-normal, 400);
        line-height: var(--ha-line-height-condensed, 1.2);
      }
      .detail {
        margin-bottom: var(--ha-space-5, 20px);
        padding: var(--ha-space-1, 4px) 0;
        font-size: var(--ha-font-size-l, 16px);
        font-weight: var(--ha-font-weight-medium, 500);
        line-height: var(--ha-line-height-normal, 1.5);
        letter-spacing: 0.1px;
      }
      .controls {
        display: flex;
        justify-content: center;
      }
      ha-control-select {
        height: 45vh;
        max-height: max(320px, var(--modes-count, 1) * 80px);
        min-height: max(200px, var(--modes-count, 1) * 80px);
        --control-select-thickness: 130px;
        --control-select-border-radius: var(--ha-border-radius-6xl, 36px);
        --control-select-background: var(--disabled-color);
        --control-select-background-opacity: 0.2;
      }
      ha-alert {
        margin-top: var(--ha-space-6, 24px);
      }
    `,
  ];

  protected override dialogOpened(params: HouseDialogParams): void {
    this.snapshot = params.snapshot;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (this.open && this.hass && !this.unsubscribe) {
      this.unsubscribe = storeFor(this.hass).subscribe((snapshot) => {
        if (!snapshot) return;
        // A deleted zone closes its dialog, which still shows the last state while it closes.
        if (this.zone(snapshot) === undefined) this.closeDialog();
        else this.snapshot = snapshot;
      });
    }
  }

  protected override dialogClosed(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  /** The zone of the dialog, null for the whole house, or undefined once the zone is deleted. */
  private zone(snapshot: Snapshot): ZoneData | null | undefined {
    const id = this.args?.zoneId;
    return id ? snapshot.zones.find((zone) => zone.id === id) : null;
  }

  /** The line under the state: what the rooms do. */
  private detail(snapshot: Snapshot, house: HouseData | null, effective: HouseMode | null): string {
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    if (!house || !effective) {
      return snapshot.zones.map((zone) => `${zone.name}: ${t(`house.${zone.house.effective}`)}`).join(" · ");
    }
    switch (effective) {
      case "vacation": {
        const end = house.vacation?.end;
        return end ? t("house.banner.vacation", { until: formatDateTime(end, ctx) }) : t("house.banner.vacation_open");
      }
      case "away":
        return t("house.detail.away", { temp: formatTemp(houseTemperature(snapshot, "away"), ctx) });
      case "off":
        return t("house.detail.off");
      default:
        return t("house.detail.auto");
    }
  }

  private async selected(snapshot: Snapshot, zone: ZoneData | null, event: CustomEvent<{ value: HouseMode }>) {
    const select = event.currentTarget as HTMLElement & { value?: string };
    const mode = event.detail.value;
    const before = zone ? zone.house.effective : commonMode(snapshot);
    // The selector shows what the house really does, also while a question is open.
    select.value = before ?? undefined;
    // Holiday again opens the holiday dialog, to change the dates.
    if (mode !== before || mode === "vacation") {
      this.busy = true;
      try {
        await chooseHouseMode(this, this.hass, snapshot, zone, mode);
      } finally {
        this.busy = false;
      }
    }
    const now = this.snapshot ?? snapshot;
    const current = this.zone(now);
    select.value = (current ? current.house.effective : commonMode(now)) ?? undefined;
    this.requestUpdate();
  }

  private planned(snapshot: Snapshot, house: HouseData | null, zone: ZoneData | null) {
    const vacation = house?.vacation;
    if (!vacation || vacation.active) return nothing;
    const ctx = formatContext(this.hass, languageOf(this.hass), snapshot);
    return hint(
      plannedText(vacation, ctx, this.t),
      this.t("house.cancel_planned"),
      async () => {
        this.busy = true;
        try {
          await cancelPlannedHoliday(this, this.hass, zone);
        } finally {
          this.busy = false;
        }
      },
      this.busy,
    );
  }

  override render() {
    const snapshot = this.snapshot;
    if (!this.args || !this.hass || !snapshot) return nothing;
    const zone = this.zone(snapshot);
    if (zone === undefined) return nothing;
    const t = this.t;
    const effective = zone ? zone.house.effective : commonMode(snapshot);
    const house = zone ? zone.house : wholeHouse(snapshot);
    const name = zone ? zone.name : t("house.title");
    const options = HOUSE_MODES.map((mode) => ({ value: mode, label: t(`house.${mode}`), path: HOUSE_ICONS[mode] }));
    const color = effective ? HOUSE_COLORS[effective] : "var(--state-inactive-color, #9e9e9e)";
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${name}
        header-subtitle=${t("app.title")}
        header-subtitle-position="above"
        @closed=${this.onClosed}
      >
        <p class="state">${effective ? t(`house.${effective}`) : t("house.mixed")}</p>
        <p class="detail">${this.detail(snapshot, house, effective)}</p>
        <div class="controls">
          <ha-control-select
            vertical
            .options=${options}
            .value=${effective ?? undefined}
            .label=${name}
            .disabled=${this.busy}
            style="--control-select-color:${color};--modes-count:${options.length}"
            @value-changed=${(event: CustomEvent<{ value: HouseMode }>) => this.selected(snapshot, zone, event)}
          ></ha-control-select>
        </div>
        ${this.planned(snapshot, house, zone)}
      </ha-dialog>
    `;
  }
}

define("hs-house-dialog", HsHouseDialog);
