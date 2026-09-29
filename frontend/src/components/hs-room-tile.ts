import { LitElement, css, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { mdiAlertCircle, mdiCalendarSync, mdiMinus, mdiPlus } from "@mdi/js";
import { formatContext, formatTemp, modeLabel, nextText, reasonText, roomTemperature } from "../format";
import { languageOf, translator } from "../i18n";
import { MODE_COLORS, MODE_ICONS, roomTemperatures } from "../modes";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, RoomData, Snapshot } from "../types";
import { define } from "./define";
import "./hs-icon";
import { openHealthDialog } from "./hs-health-dialog";

const STEP = 0.5;
const MIN = 5;
const MAX = 30;
const SEND_DELAY = 1000;

function clamp(value: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(value / STEP) * STEP));
}

/** One room: now and next, − / +, back to plan, health warning. */
export class HsRoomTile extends LitElement {
  static override properties = {
    hass: { attribute: false },
    room: { attribute: false },
    snapshot: { attribute: false },
    compact: { type: Boolean, reflect: true },
    pending: { state: true },
    sending: { state: true },
  };
  declare hass: HomeAssistant;
  declare room: RoomData;
  declare snapshot: Snapshot;
  declare compact: boolean;
  declare pending: number | null;
  declare sending: boolean;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private sentAt = 0;

  constructor() {
    super();
    this.pending = null;
    this.sending = false;
    this.compact = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .tile {
        padding: 18px 18px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        border-left: 8px solid transparent;
      }
      .tile.manual {
        border-left-color: ${unsafeCSS(MODE_COLORS.manual)};
      }
      header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      h2 {
        flex: 1;
        font-size: 22px;
        line-height: 1.25;
        font-weight: 700;
        overflow-wrap: anywhere;
      }
      .warn {
        width: 52px;
        height: 52px;
        margin: -10px -8px -8px 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--warning-color, #e65100);
        cursor: pointer;
        --hs-icon-size: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .current {
        font-size: 18px;
      }
      .current strong {
        font-size: 24px;
        font-weight: 700;
      }
      .control {
        display: grid;
        grid-template-columns: 72px 1fr 72px;
        align-items: center;
        gap: 8px;
      }
      .round {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 2px solid var(--divider-color, #c4c4c4);
        background: var(--secondary-background-color, #f2f2f2);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        --hs-icon-size: 36px;
        touch-action: manipulation;
      }
      .round:active {
        transform: scale(0.96);
      }
      .target {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .target .label {
        font-size: 15px;
      }
      .target .value {
        font-size: 44px;
        font-weight: 700;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .target .value.off {
        font-size: 30px;
      }
      .target .hint {
        font-size: 14px;
        min-height: 18px;
      }
      .status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
      }
      .next {
        font-size: 18px;
        line-height: 1.35;
      }
      .note {
        font-size: 16px;
      }
      .back {
        border-color: ${unsafeCSS(MODE_COLORS.manual)};
        color: var(--primary-text-color);
        min-height: 56px;
        font-size: 18px;
      }
      :host([compact]) .tile {
        padding: 12px 14px;
        gap: 6px;
      }
      :host([compact]) .control {
        grid-template-columns: 56px 1fr 56px;
      }
      :host([compact]) .round {
        width: 56px;
        height: 56px;
      }
      :host([compact]) .target .value {
        font-size: 34px;
      }
    `,
  ];

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      void this.send();
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("room") && this.pending !== null && !this.timer && !this.sending) {
      const confirmed = this.room.target?.temperature === this.pending;
      if (confirmed || Date.now() - this.sentAt > 4000) this.pending = null;
    }
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  private comfort(): number {
    return roomTemperatures(this.room, this.snapshot).comfort ?? 21;
  }

  private step(delta: number) {
    const base = this.pending ?? this.room.target?.temperature ?? this.comfort() - delta;
    this.pending = clamp(base + delta);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.send();
    }, SEND_DELAY);
  }

  private async send() {
    const value = this.pending;
    if (value === null) return;
    this.sending = true;
    try {
      await storeFor(this.hass).call("override/set", { room_id: this.room.id, temperature: value });
      this.sentAt = Date.now();
    } catch (error) {
      this.pending = null;
      toast(this, errorText(error, this.t));
    } finally {
      this.sending = false;
    }
  }

  private async backToPlan() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending = null;
    try {
      await storeFor(this.hass).call("override/clear", { room_id: this.room.id });
    } catch (error) {
      toast(this, errorText(error, this.t));
    }
  }

  private showHealth() {
    openHealthDialog(this, this.hass, this.room);
  }

  override render() {
    const room = this.room;
    const target = room.target;
    if (!room || !this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const now = new Date();
    const house = this.snapshot.house.effective;
    const canChange = house === "auto" && target !== null;
    const manual = target?.source === "manual";
    const shown = this.pending ?? target?.temperature ?? null;
    const off = this.pending === null && target !== null && target.temperature === null;
    const mode = this.pending !== null ? "manual" : (target?.mode ?? "off");
    const current = roomTemperature(room, this.hass);
    let info: string | null = null;
    if (target) {
      info =
        target.source === "plan" || target.source === "manual"
          ? nextText(target, now, ctx, t)
          : reasonText(target, now, ctx, t);
    }
    return html`
      <article class="tile card ${manual || this.pending !== null ? "manual" : ""}">
        <header>
          <h2>${room.name}</h2>
          ${room.issues.length
            ? html`<button class="warn" @click=${this.showHealth} aria-label=${t("room.problem")}>
                <hs-icon .path=${mdiAlertCircle}></hs-icon>
              </button>`
            : nothing}
        </header>
        <div class="current">${t("room.now")} <strong>${formatTemp(current, ctx)}</strong></div>
        <div class="control">
          ${canChange
            ? html`<button class="round" @click=${() => this.step(-STEP)} aria-label=${t("room.cooler")}>
                <hs-icon .path=${mdiMinus}></hs-icon>
              </button>`
            : html`<span></span>`}
          <div class="target" aria-live="polite">
            <span class="label muted">${t("room.set_to")}</span>
            <span class="value ${off ? "off" : ""}">
              ${off ? t("room.off") : formatTemp(shown, ctx)}
            </span>
            <span class="hint muted">${this.sending ? t("room.sending") : ""}</span>
          </div>
          ${canChange
            ? html`<button class="round" @click=${() => this.step(STEP)} aria-label=${t("room.warmer")}>
                <hs-icon .path=${mdiPlus}></hs-icon>
              </button>`
            : html`<span></span>`}
        </div>
        <div class="status">
          <span class="chip" style="background:${MODE_COLORS[mode]}">
            <hs-icon .path=${MODE_ICONS[mode]}></hs-icon>${modeLabel(mode, t)}
          </span>
          ${info ? html`<span class="next">${info}</span>` : nothing}
        </div>
        ${room.trvs.length === 0 ? html`<div class="note muted">${t("room.no_trvs")}</div>` : nothing}
        ${manual && canChange
          ? html`<button class="btn wide back" @click=${this.backToPlan}>
              <hs-icon .path=${mdiCalendarSync}></hs-icon>${t("room.back_to_plan")}
            </button>`
          : nothing}
      </article>
    `;
  }
}

define("hs-room-tile", HsRoomTile);
