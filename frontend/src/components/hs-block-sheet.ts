import { css, html, nothing } from "lit";
import { mdiDelete, mdiMinus, mdiPlus, mdiPlusCircle } from "@mdi/js";
import { showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import {
  SNAP,
  alternativeMode,
  moveBoundary,
  removeSegment,
  segmentAt,
  segments,
  setMode,
  split,
  splitPoint,
  toHHMM,
  type Day,
} from "../schedule/ops";
import { MODES, type Mode } from "../types";
import { define } from "./define";
import { HsHaDialog } from "./hs-dialog";

export interface BlockParams {
  day: Day;
  index: number;
  minute: number | null;
  dayName: string;
  onChange: (day: Day) => void;
}

/** Edit one part of a day: its mode, start and end; add a change; remove it. */
export class HsBlockSheet extends HsHaDialog<BlockParams> {
  static override properties = {
    day: { state: true },
    index: { state: true },
    minute: { state: true },
  };
  declare day: Day;
  declare index: number;
  declare minute: number | null;

  static override styles = css`
    .label {
      margin: 0 0 var(--ha-space-2, 8px);
      color: var(--secondary-text-color);
    }
    .modes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-6, 24px);
      --control-button-border-radius: var(--ha-border-radius-lg, 12px);
    }
    .modes ha-control-button {
      width: 100%;
      height: 56px;
      --control-button-icon-color: var(--mode-color);
      --control-button-focus-color: var(--mode-color);
      --control-button-padding: var(--ha-space-1, 4px);
      font-size: var(--ha-font-size-s, 12px);
    }
    .modes ha-control-button.selected {
      --control-button-background-color: var(--mode-color);
      --control-button-background-opacity: 1;
      --control-button-icon-color: #fff;
      color: #fff;
    }
    .option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .times {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--ha-space-4, 16px);
      margin-bottom: var(--ha-space-6, 24px);
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 42px;
      border-radius: var(--ha-border-radius-lg, 12px);
      background: rgba(var(--rgb-disabled-color, 189, 189, 189), 0.2);
      font-weight: var(--ha-font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
      --ha-icon-button-size: 42px;
      --mdc-icon-size: 16px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
    }
  `;

  override showDialog(params: BlockParams): void {
    this.day = params.day;
    this.index = params.index;
    this.minute = params.minute;
    super.showDialog(params);
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  private change(day: Day, index = this.index) {
    this.day = day;
    this.index = Math.max(0, Math.min(index, day.length - 1));
    this.args?.onChange(day);
  }

  setMode(mode: Mode) {
    const start = this.day[this.index]!.start;
    const day = setMode(this.day, this.index, mode);
    // After a merge, keep editing the block that now contains this time.
    this.change(day, segmentAt(day, start).index);
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
    this.closeDialog();
  }

  private stepper(label: string, time: number, move: (delta: number) => void) {
    const t = this.t;
    return html`<div>
      <p class="label">${label}</p>
      <div class="stepper">
        <ha-icon-button .path=${mdiMinus} .label=${t("editor.earlier")} @click=${() => move(-SNAP)}></ha-icon-button>
        <span>${toHHMM(time)}</span>
        <ha-icon-button .path=${mdiPlus} .label=${t("editor.later")} @click=${() => move(SNAP)}></ha-icon-button>
      </div>
    </div>`;
  }

  override render() {
    if (!this.args || !this.day) return nothing;
    const t = this.t;
    const segment = segments(this.day)[this.index];
    if (!segment) return nothing;
    const at = splitPoint(segment, this.minute ?? (segment.start + segment.end) / 2);
    const isFirst = segment.index === 0;
    const isLast = segment.index === this.day.length - 1;
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${`${this.args.dayName} ${toHHMM(segment.start)} – ${toHHMM(segment.end)}`}
        @closed=${this.onClosed}
      >
        <p class="label">${t("editor.mode")}</p>
        <div class="modes">
          ${MODES.map(
            (mode) => html`<ha-control-button
              class=${segment.mode === mode ? "selected" : ""}
              style="--mode-color:${MODE_COLORS[mode]}"
              .label=${t(`mode.${mode}`)}
              aria-pressed=${segment.mode === mode ? "true" : "false"}
              @click=${() => this.setMode(mode)}
            >
              <span class="option">
                <ha-svg-icon .path=${MODE_ICONS[mode]}></ha-svg-icon>
                ${t(`mode.${mode}`)}
              </span>
            </ha-control-button>`,
          )}
        </div>
        ${isFirst && isLast
          ? nothing
          : html`<div class="times">
              ${isFirst ? nothing : this.stepper(t("editor.starts"), segment.start, (d) => this.moveStart(d))}
              ${isLast ? nothing : this.stepper(t("editor.ends"), segment.end, (d) => this.moveEnd(d))}
            </div>`}
        <div class="actions">
          ${at !== null
            ? html`<ha-button appearance="outlined" @click=${() => this.addChange(at)}>
                <ha-svg-icon slot="start" .path=${mdiPlusCircle}></ha-svg-icon>
                ${t("editor.add_change", { time: toHHMM(at) })}
              </ha-button>`
            : nothing}
          ${this.day.length > 1
            ? html`<ha-button appearance="plain" variant="danger" @click=${this.removePart}>
                <ha-svg-icon slot="start" .path=${mdiDelete}></ha-svg-icon>
                ${t("editor.remove")}
              </ha-button>`
            : nothing}
        </div>
        <ha-dialog-footer slot="footer">
          <ha-button slot="primaryAction" @click=${() => this.closeDialog()}>${t("common.close")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-block-sheet", HsBlockSheet);

/** Open the sheet; `onChange` receives every edit. */
export function openBlockSheet(host: HTMLElement, params: BlockParams): void {
  showDialog(host, "hs-block-sheet", params);
}
