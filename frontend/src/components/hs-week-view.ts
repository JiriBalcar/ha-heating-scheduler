import { LitElement, css, html, nothing } from "lit";
import type { Translate } from "../i18n";
import type { Day } from "../schedule/ops";
import { baseStyles } from "../styles";
import { define } from "./define";
import "./hs-day-bar";

const AXIS = [0, 6, 12, 18, 24];

/** Seven day bars. Tap a day to select it. */
export class HsWeekView extends LitElement {
  static override properties = {
    days: { attribute: false },
    t: { attribute: false },
    selected: { type: Number },
    changed: { attribute: false },
    readonly: { type: Boolean },
    compact: { type: Boolean },
  };
  declare days: Day[];
  declare t: Translate;
  declare selected: number;
  declare changed: Set<number>;
  declare readonly: boolean;
  declare compact: boolean;

  constructor() {
    super();
    this.selected = -1;
    this.changed = new Set();
    this.readonly = false;
    this.compact = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .rows {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-1, 4px);
      }
      .day {
        display: grid;
        grid-template-columns: 36px 1fr;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        width: 100%;
        min-height: 40px;
        padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
        border: 2px solid transparent;
        border-radius: var(--ha-border-radius-md, 8px);
        background: transparent;
        text-align: left;
        cursor: pointer;
      }
      .day[aria-pressed="true"] {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color, 0, 154, 199), 0.08);
      }
      :host([readonly]) .day {
        cursor: default;
      }
      .label {
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
        display: flex;
        align-items: center;
        gap: var(--ha-space-1, 4px);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--warning-color);
      }
      hs-day-bar {
        --bar-height: 24px;
      }
      :host([compact]) .day {
        min-height: 20px;
        padding: 1px var(--ha-space-2, 8px);
      }
      :host([compact]) hs-day-bar {
        --bar-height: 12px;
        --bar-radius: var(--ha-border-radius-sm, 4px);
      }
      .axis {
        display: grid;
        grid-template-columns: 36px 1fr;
        gap: var(--ha-space-2, 8px);
        padding: 0 var(--ha-space-2, 8px);
        font-size: var(--ha-font-size-xs, 10px);
      }
      .ticks {
        position: relative;
        height: 18px;
      }
      .ticks span {
        position: absolute;
        transform: translateX(-50%);
      }
      .ticks span:first-child {
        transform: none;
      }
      .ticks span:last-child {
        transform: translateX(-100%);
      }
    `,
  ];

  private select(day: number) {
    if (this.readonly) return;
    this.dispatchEvent(new CustomEvent("day-select", { detail: day }));
  }

  override render() {
    if (!this.days || !this.t) return nothing;
    return html`
      <div class="rows" role="group">
        ${this.days.map(
          (day, index) => html`<button
            class="day"
            aria-pressed=${index === this.selected ? "true" : "false"}
            aria-label=${this.t(`day.${index}` as never)}
            ?disabled=${this.readonly}
            @click=${() => this.select(index)}
          >
            <span class="label">
              ${this.t(`day.short.${index}` as never)}
              ${this.changed.has(index) ? html`<span class="dot" aria-hidden="true"></span>` : nothing}
            </span>
            <hs-day-bar .day=${day}></hs-day-bar>
          </button>`,
        )}
      </div>
      ${this.compact
        ? nothing
        : html`<div class="axis muted" aria-hidden="true">
            <span></span>
            <div class="ticks">
              ${AXIS.map((hour) => html`<span style="left:${(hour / 24) * 100}%">${hour}</span>`)}
            </div>
          </div>`}
    `;
  }
}

define("hs-week-view", HsWeekView);
