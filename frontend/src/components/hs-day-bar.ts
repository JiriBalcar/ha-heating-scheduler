import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import { DAY_MINUTES, SNAP, segments, toHHMM, type Day } from "../schedule/ops";
import { baseStyles } from "../styles";
import { define } from "./define";
import "./hs-icon";

export interface BoundaryMoveDetail {
  index: number;
  minute: number;
  done: boolean;
}

export interface SegmentTapDetail {
  index: number;
  minute: number;
}

function percent(minutes: number): number {
  return (minutes / DAY_MINUTES) * 100;
}

/**
 * One day as coloured blocks. Interactive bars have handles between blocks:
 * drag them (or use the arrow keys) to move a change in 15-minute steps.
 */
export class HsDayBar extends LitElement {
  static override properties = {
    day: { attribute: false },
    interactive: { type: Boolean },
    labels: { type: Boolean },
    handleLabel: { attribute: false },
    dragIndex: { state: true },
  };
  declare day: Day;
  declare interactive: boolean;
  declare labels: boolean;
  declare handleLabel: (index: number, time: string) => string;
  declare dragIndex: number | null;

  private moved = false;

  constructor() {
    super();
    this.interactive = false;
    this.labels = false;
    this.dragIndex = null;
    this.handleLabel = (_index, time) => time;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
        --bar-height: 36px;
      }
      .bar {
        position: relative;
        height: var(--bar-height);
        border-radius: 10px;
        overflow: visible;
        background: var(--divider-color, #ccc);
      }
      .clip {
        position: absolute;
        inset: 0;
        border-radius: 10px;
        overflow: hidden;
      }
      .seg {
        position: absolute;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid rgba(255, 255, 255, 0.85);
        --hs-icon-size: 20px;
      }
      .seg:last-child {
        border-right: none;
      }
      :host([interactive]) .bar {
        cursor: pointer;
      }
      .handle {
        position: absolute;
        top: -10px;
        bottom: -10px;
        width: 48px;
        margin-left: -24px;
        border: none;
        background: transparent;
        padding: 0;
        cursor: ew-resize;
        touch-action: none;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }
      .grip {
        width: 12px;
        height: calc(100% - 12px);
        border-radius: 6px;
        background: #fff;
        border: 2px solid rgba(0, 0, 0, 0.55);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      }
      .handle:focus-visible .grip,
      .handle.active .grip {
        outline: 3px solid var(--primary-color, #1565c0);
      }
      .tip {
        position: absolute;
        bottom: calc(100% + 14px);
        transform: translateX(-50%);
        padding: 6px 12px;
        border-radius: 10px;
        background: #202124;
        color: #fff;
        font-size: 22px;
        font-weight: 700;
        pointer-events: none;
        white-space: nowrap;
        z-index: 2;
      }
    `,
  ];

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("interactive")) this.toggleAttribute("interactive", this.interactive);
  }

  private get bar(): HTMLElement | null {
    return this.renderRoot.querySelector(".bar");
  }

  private minuteAt(clientX: number): number {
    const rect = this.bar!.getBoundingClientRect();
    return Math.min(DAY_MINUTES, Math.max(0, ((clientX - rect.left) / rect.width) * DAY_MINUTES));
  }

  private emitMove(index: number, minute: number, done: boolean) {
    this.dispatchEvent(
      new CustomEvent<BoundaryMoveDetail>("boundary-move", { detail: { index, minute, done } }),
    );
  }

  private onPointerDown(event: PointerEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.dragIndex = index;
    this.moved = false;
  }

  private onPointerMove(event: PointerEvent) {
    if (this.dragIndex === null) return;
    this.moved = true;
    this.emitMove(this.dragIndex, this.minuteAt(event.clientX), false);
  }

  private onPointerUp(event: PointerEvent) {
    if (this.dragIndex === null) return;
    const index = this.dragIndex;
    this.dragIndex = null;
    if (this.moved) this.emitMove(index, this.minuteAt(event.clientX), true);
    event.stopPropagation();
  }

  private onKey(event: KeyboardEvent, index: number) {
    const delta = event.key === "ArrowLeft" ? -SNAP : event.key === "ArrowRight" ? SNAP : 0;
    if (!delta) return;
    event.preventDefault();
    this.emitMove(index, this.day[index]!.start + delta, true);
  }

  private onBarClick(event: MouseEvent) {
    if (!this.interactive || this.moved) {
      this.moved = false;
      return;
    }
    const minute = this.minuteAt(event.clientX);
    const segment = segments(this.day).find((s) => minute >= s.start && minute < s.end);
    if (!segment) return;
    this.dispatchEvent(
      new CustomEvent<SegmentTapDetail>("segment-tap", { detail: { index: segment.index, minute } }),
    );
  }

  override render() {
    if (!this.day) return nothing;
    const all = segments(this.day);
    const drag = this.dragIndex !== null ? this.day[this.dragIndex] : undefined;
    return html`
      <div class="bar" @click=${this.onBarClick}>
        <div class="clip">
          ${all.map((segment) => {
            const width = percent(segment.end - segment.start);
            return html`<div
              class="seg"
              style="left:${percent(segment.start)}%;width:${width}%;background:${MODE_COLORS[segment.mode]}"
            >
              ${this.labels && width >= 7 ? html`<hs-icon .path=${MODE_ICONS[segment.mode]}></hs-icon>` : nothing}
              ${this.labels && width >= 17 ? toHHMM(segment.start) : nothing}
            </div>`;
          })}
        </div>
        ${this.interactive
          ? all.slice(1).map(
              (segment) => html`<button
                class="handle ${this.dragIndex === segment.index ? "active" : ""}"
                style="left:${percent(segment.start)}%"
                aria-label=${this.handleLabel(segment.index, toHHMM(segment.start))}
                @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, segment.index)}
                @pointermove=${this.onPointerMove}
                @pointerup=${this.onPointerUp}
                @pointercancel=${this.onPointerUp}
                @click=${(e: Event) => e.stopPropagation()}
                @keydown=${(e: KeyboardEvent) => this.onKey(e, segment.index)}
              >
                <span class="grip"></span>
              </button>`,
            )
          : nothing}
        ${drag ? html`<div class="tip" style="left:${percent(drag.start)}%">${toHHMM(drag.start)}</div>` : nothing}
      </div>
    `;
  }
}

define("hs-day-bar", HsDayBar);
