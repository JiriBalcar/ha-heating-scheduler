import { LitElement, css, html, nothing } from "lit";
import { mdiDelete, mdiMinus, mdiPlus, mdiPlusCircle } from "@mdi/js";
import type { Translate } from "../i18n";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import {
  SNAP,
  alternativeMode,
  moveBoundary,
  removeSegment,
  segments,
  setMode,
  split,
  splitPoint,
  toHHMM,
  type Day,
} from "../schedule/ops";
import { baseStyles } from "../styles";
import { MODES, type Mode } from "../types";
import { define } from "./define";
import type { HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";

/** Edit one part of a day: its mode, start and end; add a change; remove it. */
export class HsBlockSheet extends LitElement {
  static override properties = {
    day: { attribute: false },
    index: { type: Number },
    minute: { type: Number },
    dayName: {},
    t: { attribute: false },
  };
  declare day: Day;
  declare index: number;
  declare minute: number | null;
  declare dayName: string;
  declare t: Translate;

  static override styles = [
    baseStyles,
    css`
      .section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }
      .section > span {
        font-weight: 700;
      }
      .modes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }
      .mode {
        min-height: 60px;
        justify-content: flex-start;
      }
      .mode[aria-pressed="true"] {
        color: #fff;
        border-color: transparent;
      }
      .time {
        display: grid;
        grid-template-columns: 56px 1fr 56px;
        align-items: center;
        gap: 10px;
      }
      .time strong {
        text-align: center;
        font-size: 28px;
        font-variant-numeric: tabular-nums;
      }
      .time .btn {
        padding: 0;
        --hs-icon-size: 28px;
      }
      .times {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `,
  ];

  get dialog(): HsDialog | null {
    return this.renderRoot.querySelector("hs-dialog");
  }

  private change(day: Day, index = this.index) {
    this.day = day;
    this.index = Math.max(0, Math.min(index, day.length - 1));
    this.dispatchEvent(new CustomEvent<Day>("day-change", { detail: day }));
  }

  private setMode(mode: Mode) {
    const start = this.day[this.index]!.start;
    const day = setMode(this.day, this.index, mode);
    this.change(day, Math.max(0, day.findIndex((slot) => slot.start >= start)));
  }

  private moveStart(delta: number) {
    this.change(moveBoundary(this.day, this.index, this.day[this.index]!.start + delta));
  }

  private moveEnd(delta: number) {
    const next = this.index + 1;
    this.change(moveBoundary(this.day, next, this.day[next]!.start + delta));
  }

  private addChange(at: number) {
    const segment = segments(this.day)[this.index]!;
    const result = split(this.day, at, alternativeMode(segment.mode));
    this.minute = null;
    this.change(result.day, result.index);
  }

  private removePart() {
    this.change(removeSegment(this.day, this.index), Math.max(0, this.index - 1));
    this.dialog?.close();
  }

  override render() {
    if (!this.day || !this.t) return nothing;
    const t = this.t;
    const segment = segments(this.day)[this.index];
    if (!segment) return nothing;
    const at = splitPoint(segment, this.minute ?? (segment.start + segment.end) / 2);
    const isFirst = segment.index === 0;
    const isLast = segment.index === this.day.length - 1;
    return html`
      <hs-dialog
        .heading=${`${this.dayName} ${toHHMM(segment.start)} – ${toHHMM(segment.end)}`}
        .closeLabel=${t("common.close")}
      >
        <div class="section">
          <span>${t("editor.mode")}</span>
          <div class="modes">
            ${MODES.map(
              (mode) => html`<button
                class="btn mode"
                aria-pressed=${segment.mode === mode ? "true" : "false"}
                style=${segment.mode === mode ? `background:${MODE_COLORS[mode]}` : ""}
                @click=${() => this.setMode(mode)}
              >
                <hs-icon .path=${MODE_ICONS[mode]} style="color:${segment.mode === mode ? "#fff" : MODE_COLORS[mode]}"></hs-icon>
                ${t(`mode.${mode}`)}
              </button>`,
            )}
          </div>
        </div>
        ${isFirst && isLast
          ? nothing
          : html`<div class="times section">
              ${isFirst
                ? nothing
                : html`<div class="section">
                    <span>${t("editor.starts")}</span>
                    <div class="time">
                      <button class="btn" @click=${() => this.moveStart(-SNAP)} aria-label=${t("editor.earlier")}>
                        <hs-icon .path=${mdiMinus}></hs-icon>
                      </button>
                      <strong>${toHHMM(segment.start)}</strong>
                      <button class="btn" @click=${() => this.moveStart(SNAP)} aria-label=${t("editor.later")}>
                        <hs-icon .path=${mdiPlus}></hs-icon>
                      </button>
                    </div>
                  </div>`}
              ${isLast
                ? nothing
                : html`<div class="section">
                    <span>${t("editor.ends")}</span>
                    <div class="time">
                      <button class="btn" @click=${() => this.moveEnd(-SNAP)} aria-label=${t("editor.earlier")}>
                        <hs-icon .path=${mdiMinus}></hs-icon>
                      </button>
                      <strong>${toHHMM(segment.end)}</strong>
                      <button class="btn" @click=${() => this.moveEnd(SNAP)} aria-label=${t("editor.later")}>
                        <hs-icon .path=${mdiPlus}></hs-icon>
                      </button>
                    </div>
                  </div>`}
            </div>`}
        <div class="actions">
          ${at !== null
            ? html`<button class="btn wide" @click=${() => this.addChange(at)}>
                <hs-icon .path=${mdiPlusCircle}></hs-icon>${t("editor.add_change", { time: toHHMM(at) })}
              </button>`
            : nothing}
          ${this.day.length > 1
            ? html`<button class="btn wide danger" @click=${this.removePart}>
                <hs-icon .path=${mdiDelete}></hs-icon>${t("editor.remove")}
              </button>`
            : nothing}
        </div>
        <button slot="actions" class="btn primary" @click=${() => this.dialog?.close()}>
          ${t("common.close")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-block-sheet", HsBlockSheet);

/** Open the sheet; `onChange` receives every edit. */
export async function openBlockSheet(
  host: HTMLElement,
  options: {
    day: Day;
    index: number;
    minute: number | null;
    dayName: string;
    t: Translate;
    onChange: (day: Day) => void;
  },
): Promise<void> {
  const element = document.createElement("hs-block-sheet") as HsBlockSheet;
  element.day = options.day;
  element.index = options.index;
  element.minute = options.minute;
  element.dayName = options.dayName;
  element.t = options.t;
  element.addEventListener("day-change", (event) => options.onChange((event as CustomEvent<Day>).detail));
  (host.shadowRoot ?? host).appendChild(element);
  await element.updateComplete;
  const dialog = element.dialog;
  if (!dialog) return;
  dialog.addEventListener("hs-closed", () => element.remove(), { once: true });
  await dialog.show();
}
