import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiCalendarSync, mdiExclamationThick } from "@mdi/js";
import { formatContext, formatTemp, formatUntil, modeLabel, reasonText, roomTemperature } from "../format";
import { languageOf, translator } from "../i18n";
import { MODE_COLORS, MODE_ICONS, roomTemperatures } from "../modes";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, RoomData, Snapshot } from "../types";
import { define } from "./define";
import { openProblemDialog } from "./hs-problem-dialog";

const STEP = 0.5;
const MIN = 5;
const MAX = 30;
const SEND_DELAY = 1000;
const FORMAT = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

/**
 * One room as an HA tile: mode icon, name, temperature and status, − / + and Back to plan.
 * `compact` puts − / + next to the name, like a tile card with an inline feature.
 */
export class HsRoomCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    room: { attribute: false },
    snapshot: { attribute: false },
    compact: { type: Boolean, reflect: true },
    pending: { state: true },
  };
  declare hass: HomeAssistant;
  declare room: RoomData;
  declare snapshot: Snapshot;
  declare compact: boolean;
  declare pending: number | null;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private sending = false;
  private sentAt = 0;
  // The room the pending value belongs to, fixed at the first change.
  private pendingRoom: string | null = null;

  constructor() {
    super();
    this.pending = null;
    this.compact = false;
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
      ha-tile-badge {
        position: absolute;
        top: 3px;
        right: 3px;
        inset-inline-end: 3px;
        inset-inline-start: initial;
        --tile-badge-background-color: var(--orange-color, #ff9800);
      }
      .features {
        --feature-height: 42px;
        --feature-border-radius: var(--ha-card-features-border-radius, var(--ha-border-radius-lg, 12px));
        --feature-button-spacing: 12px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--ha-card-feature-gap, 12px);
      }
      ha-control-button-group {
        --control-button-group-spacing: var(--feature-button-spacing);
        --control-button-group-thickness: var(--feature-height);
      }
      ha-control-number-buttons {
        --control-number-buttons-border-radius: var(--feature-border-radius);
        --control-number-buttons-focus-color: var(--tile-color);
      }
      ha-control-button {
        --control-button-border-radius: var(--feature-border-radius);
        --control-button-focus-color: var(--tile-color);
        --control-button-padding: 0 12px;
        --mdc-icon-size: 20px;
      }
      ha-control-button span {
        margin-inline-start: 8px;
      }
      .inline {
        --feature-height: 36px;
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
    if (changed.has("room") && this.pendingRoom !== null && this.room.id !== this.pendingRoom) {
      // The element now shows another room: send what was chosen for the old one.
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
        void this.send();
      }
      this.pending = null;
    }
    if (changed.has("room") && this.pending !== null && !this.timer && !this.sending) {
      const confirmed = this.room.target?.temperature === this.pending;
      if (confirmed || Date.now() - this.sentAt > 4000) this.pending = null;
    }
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  private changed(event: CustomEvent<{ value: number }>) {
    const value = Math.min(MAX, Math.max(MIN, Math.round(event.detail.value / STEP) * STEP));
    if (this.pending === null) this.pendingRoom = this.room.id;
    this.pending = value;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.send();
    }, SEND_DELAY);
  }

  private async send() {
    const value = this.pending;
    const roomId = this.pendingRoom ?? this.room.id;
    if (value === null) return;
    this.sending = true;
    try {
      await storeFor(this.hass).call("override/set", { room_id: roomId, temperature: value });
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

  private showProblems() {
    openProblemDialog(this, this.room);
  }

  /** "20.2 °C · Night until 6:00 → Warm 21.5 °C" */
  private status(): string {
    const room = this.room;
    const target = room.target;
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const parts: string[] = [];
    const current = roomTemperature(room, this.hass);
    if (current !== null) parts.push(formatTemp(current, ctx));
    if (room.trvs.length === 0) parts.push(t("room.no_trvs"));
    else if (this.pending !== null) parts.push(modeLabel("manual", t));
    else if (target?.source === "plan") {
      // "Warm until 22:00 → Night 18.0 °C"
      const now = new Date();
      const mode = modeLabel(target.mode, t);
      parts.push(
        target.valid_until ? `${mode} ${t("room.until", { until: formatUntil(target.valid_until, now, ctx) })}` : mode,
      );
      const next = target.next;
      if (target.valid_until && next) {
        const label = next.temperature === null ? modeLabel(next.mode, t) : `${modeLabel(next.mode, t)} ${formatTemp(next.temperature, ctx)}`;
        parts[parts.length - 1] += ` → ${label}`;
      }
    } else if (target) parts.push(reasonText(target, new Date(), ctx, t));
    return parts.join(" · ");
  }

  private control(canChange: boolean) {
    const t = this.t;
    const target = this.room.target;
    if (this.pending === null && target && target.temperature === null) {
      return html`<ha-control-button-group>
        <ha-control-button disabled .label=${t("room.off")}>${t("room.off")}</ha-control-button>
      </ha-control-button-group>`;
    }
    const comfort = roomTemperatures(this.room, this.snapshot).comfort ?? 21;
    return html`<ha-control-button-group>
      <ha-control-number-buttons
        .value=${this.pending ?? target?.temperature ?? comfort}
        .min=${MIN}
        .max=${MAX}
        .step=${STEP}
        .unit=${"°C"}
        .formatOptions=${FORMAT}
        .locale=${this.hass.locale}
        .label=${t("room.set_to")}
        .disabled=${!canChange}
        @value-changed=${this.changed}
      ></ha-control-number-buttons>
    </ha-control-button-group>`;
  }

  override render() {
    const room = this.room;
    if (!room || !this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const target = room.target;
    const canChange = this.snapshot.house.effective === "auto" && target !== null;
    const manual = this.pending !== null || target?.source === "manual";
    const mode = manual ? "manual" : (target?.mode ?? "off");
    const problems = room.issues.length > 0;
    const control = this.control(canChange);
    return html`
      <ha-card style="--tile-color:${MODE_COLORS[mode]}">
        <ha-tile-container .featurePosition=${this.compact ? "inline" : "bottom"}>
          <ha-tile-icon
            slot="icon"
            .iconPath=${MODE_ICONS[mode]}
            .interactive=${problems}
            @action=${this.showProblems}
            title=${problems ? t("room.problem") : modeLabel(mode, t)}
          >
            ${problems
              ? html`<ha-tile-badge><ha-svg-icon .path=${mdiExclamationThick}></ha-svg-icon></ha-tile-badge>`
              : nothing}
          </ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${room.name}</span>
            <span slot="secondary">${this.status()}</span>
          </ha-tile-info>
          ${this.compact
            ? html`<div slot="features-inline" class="features inline">${control}</div>`
            : nothing}
          ${!this.compact || (manual && canChange)
            ? html`<div slot="features" class="features">
                ${this.compact ? nothing : control}
                ${manual && canChange
                  ? html`<ha-control-button-group>
                      <ha-control-button .label=${t("room.back_to_plan")} @click=${this.backToPlan}>
                        <ha-svg-icon .path=${mdiCalendarSync}></ha-svg-icon>
                        <span>${t("room.back_to_plan")}</span>
                      </ha-control-button>
                    </ha-control-button-group>`
                  : nothing}
              </div>`
            : nothing}
        </ha-tile-container>
      </ha-card>
    `;
  }
}

define("hs-room-card", HsRoomCard);
