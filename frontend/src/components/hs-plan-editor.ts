import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiArrowLeft, mdiChevronRight, mdiContentCopy } from "@mdi/js";
import { showDialog } from "../ha";
import { zonedParts } from "../format";
import { languageOf, translator, type TextKey, type Translate } from "../i18n";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import {
  copyDay,
  fromPlan,
  moveBoundary,
  normalize,
  sameDay,
  segments,
  toHHMM,
  toPlanDays,
  type Day,
} from "../schedule/ops";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, PlanData, Snapshot } from "../types";
import { reportUnsaved } from "../unsaved";
import { define } from "./define";
import type { BoundaryMoveDetail, SegmentTapDetail } from "./hs-day-bar";
import "./hs-day-bar";
import { openBlockSheet } from "./hs-block-sheet";
import { chooseCopyTargets } from "./hs-copy-dialog";
import { HsHaDialog, confirmDialog, keepMineDialog } from "./hs-dialog";
import "./hs-week-view";

/** Edit one plan: week overview, one day in detail, save with a preview. */
export class HsPlanEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    plan: { attribute: false },
    days: { state: true },
    name: { state: true },
    selected: { state: true },
    saving: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare plan: PlanData;
  declare days: Day[];
  declare name: string;
  declare selected: number;
  declare saving: boolean;

  private loadedId: string | null = null;
  // The plan as loaded into the editor, to detect changes made elsewhere meanwhile.
  private baseName = "";
  private original: Day[] = [];

  constructor() {
    super();
    this.days = [];
    this.name = "";
    this.saving = false;
    this.selected = -1;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
        /* A flex item with auto margins shrinks to its content without a width. */
        width: 100%;
        box-sizing: border-box;
        max-width: 760px;
        margin: 0 auto;
      }
      .back {
        align-self: flex-start;
      }
      .card-content {
        padding: var(--ha-space-4, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      h2 {
        margin: 0;
        font-size: var(--ha-font-size-l, 16px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .big {
        --bar-height: 48px;
        margin-top: 40px;
      }
      .axis {
        position: relative;
        height: 16px;
        font-size: var(--ha-font-size-xs, 10px);
        color: var(--secondary-text-color);
      }
      .axis span {
        position: absolute;
        transform: translateX(-50%);
      }
      .axis span:first-child {
        transform: none;
      }
      .axis span:last-child {
        transform: translateX(-100%);
      }
      .parts {
        margin: 0 calc(-1 * var(--ha-space-4, 16px));
      }
      .parts ha-md-list-item ha-svg-icon[slot="start"] {
        color: var(--mode-color);
      }
      .card-actions {
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
      .footer {
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: flex-end;
        gap: var(--ha-space-2, 8px);
        padding: var(--ha-space-3, 12px) 0;
        background: var(--primary-background-color);
        border-top: 1px solid var(--divider-color);
        z-index: 3;
      }
      .unsaved {
        margin-inline-end: auto;
        align-self: center;
        color: var(--warning-color);
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  private get dirty(): boolean {
    return (
      this.name.trim() !== this.baseName ||
      this.days.some((day, index) => !sameDay(normalize(day), this.original[index] ?? []))
    );
  }

  private reportedUnsaved = false;

  protected override updated(): void {
    const unsaved = this.dirty;
    if (unsaved !== this.reportedUnsaved) {
      this.reportedUnsaved = unsaved;
      reportUnsaved(this, unsaved);
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    const newPlan = this.plan && this.plan.id !== this.loadedId;
    if (newPlan || (changed.has("plan") && this.plan && !this.dirty)) this.load();
  }

  private load() {
    this.loadedId = this.plan.id;
    this.baseName = this.plan.name;
    this.original = fromPlan(this.plan);
    this.days = this.original.map((day) => day.map((slot) => ({ ...slot })));
    this.name = this.plan.name;
    if (this.selected < 0) this.selected = zonedParts(new Date(), this.snapshot.time_zone).weekday;
  }

  private setDay(index: number, day: Day) {
    this.days = this.days.map((current, i) => (i === index ? day : current));
  }

  private onMove(event: CustomEvent<BoundaryMoveDetail>) {
    const { index, minute } = event.detail;
    this.setDay(this.selected, moveBoundary(this.days[this.selected]!, index, minute));
  }

  private openSheet(index: number, minute: number | null) {
    const dayIndex = this.selected;
    openBlockSheet(this, {
      day: this.days[dayIndex]!,
      index,
      minute,
      dayName: this.t(`day.${dayIndex}` as TextKey),
      onChange: (day) => this.setDay(dayIndex, day),
    });
  }

  private async copyDay() {
    const targets = await chooseCopyTargets(this, this.selected);
    if (targets.length) this.days = copyDay(this.days, this.selected, targets);
  }

  private changedDays(): Set<number> {
    return new Set(
      this.days
        .map((day, index) => (sameDay(normalize(day), this.original[index] ?? []) ? -1 : index))
        .filter((index) => index >= 0),
    );
  }

  private roomNames(ids: string[]): string {
    return ids
      .map((id) => this.snapshot.rooms.find((room) => room.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  }

  /** True if the plan was changed elsewhere since it was loaded into the editor. */
  private changedElsewhere(): boolean {
    const current = fromPlan(this.plan);
    return (
      this.plan.name !== this.baseName ||
      current.some((day, index) => !sameDay(day, this.original[index] ?? []))
    );
  }

  /** Show the week with the changed days, then save. */
  private async confirmSave() {
    const used = this.plan.used_by ?? [];
    const t = this.t;
    const ok = await new Promise<boolean>((resolve) =>
      showDialog(this, "hs-save-plan-dialog", {
        days: this.days,
        changed: this.changedDays(),
        used: used.length ? t("editor.preview_used", { rooms: this.roomNames(used) }) : t("editor.preview_unused"),
        resolve,
      }),
    );
    if (ok) await this.save();
  }

  async save() {
    if (this.changedElsewhere() && !(await keepMineDialog(this, this.t))) {
      this.load();
      return;
    }
    // What is sent is what counts as saved; edits made while waiting stay unsaved.
    const name = this.name.trim();
    const days = this.days.map((day) => normalize(day));
    this.saving = true;
    try {
      await storeFor(this.hass).call("plan/save", {
        revision: this.snapshot.revision,
        plan: { id: this.plan.id, name, days: toPlanDays(days) },
      });
      this.baseName = name;
      this.original = days;
      toast(this, this.t("editor.saved"));
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.saving = false;
    }
  }

  private async leave() {
    if (this.dirty) {
      const t = this.t;
      const ok = await confirmDialog(this, {
        heading: t("editor.unsaved"),
        message: t("editor.discard"),
        confirm: t("editor.discard_button"),
        cancel: t("common.back"),
        danger: true,
      });
      if (!ok) return;
    }
    this.dispatchEvent(new CustomEvent("hs-navigate", { detail: "/plans", bubbles: true, composed: true }));
  }

  private cancel() {
    if (!this.dirty) {
      void this.leave();
      return;
    }
    void (async () => {
      const t = this.t;
      const ok = await confirmDialog(this, {
        heading: t("editor.unsaved"),
        message: t("editor.discard"),
        confirm: t("editor.discard_button"),
        cancel: t("common.back"),
        danger: true,
      });
      if (ok) this.load();
    })();
  }

  override render() {
    if (!this.plan || !this.days.length) return nothing;
    const t = this.t;
    const day = this.days[this.selected] ?? this.days[0]!;
    const used = this.plan.used_by ?? [];
    const dirty = this.dirty;
    return html`
      <ha-button class="back" appearance="plain" @click=${this.leave}>
        <ha-svg-icon slot="start" .path=${mdiArrowLeft}></ha-svg-icon>${t("plans.all_plans")}
      </ha-button>
      <ha-card>
        <div class="card-content">
          <ha-input
            .label=${t("plans.name")}
            .value=${this.name}
            maxlength="60"
            @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
          ></ha-input>
          <span class="muted">
            ${used.length ? t("plans.used_by", { rooms: this.roomNames(used) }) : t("plans.unused")}
          </span>
        </div>
      </ha-card>
      <ha-card>
        <div class="card-content">
          <span class="muted">${t("editor.tap_day")}</span>
          <hs-week-view
            .days=${this.days}
            .t=${t}
            .selected=${this.selected}
            .changed=${this.changedDays()}
            @day-select=${(e: CustomEvent<number>) => (this.selected = e.detail)}
          ></hs-week-view>
        </div>
      </ha-card>
      <ha-card aria-live="polite">
        <div class="card-content">
          <h2>${t(`day.${this.selected}` as TextKey)}</h2>
          <span class="muted">${t("editor.drag_hint")}</span>
          <hs-day-bar
            class="big"
            interactive
            labels
            .day=${day}
            .handleLabel=${(_index: number, time: string) => `${t("editor.starts")} ${time}`}
            @boundary-move=${this.onMove}
            @segment-tap=${(e: CustomEvent<SegmentTapDetail>) => this.openSheet(e.detail.index, e.detail.minute)}
          ></hs-day-bar>
          <div class="axis" aria-hidden="true">
            ${[0, 6, 12, 18, 24].map((hour) => html`<span style="left:${(hour / 24) * 100}%">${hour}:00</span>`)}
          </div>
          <div class="parts" role="list" aria-label=${t("editor.parts")}>
            ${segments(day).map(
              (segment) => html`<ha-md-list-item
                type="button"
                role="listitem"
                style="--mode-color:${MODE_COLORS[segment.mode]}"
                @click=${() => this.openSheet(segment.index, null)}
              >
                <ha-svg-icon slot="start" .path=${MODE_ICONS[segment.mode]}></ha-svg-icon>
                <span slot="headline">${toHHMM(segment.start)} – ${toHHMM(segment.end)}</span>
                <span slot="supporting-text">${t(`mode.${segment.mode}`)}</span>
                <ha-svg-icon slot="end" .path=${mdiChevronRight}></ha-svg-icon>
              </ha-md-list-item>`,
            )}
          </div>
        </div>
        <div class="card-actions">
          <ha-button appearance="plain" @click=${this.copyDay}>
            <ha-svg-icon slot="start" .path=${mdiContentCopy}></ha-svg-icon>${t("editor.copy_day")}
          </ha-button>
        </div>
      </ha-card>
      <div class="footer">
        ${dirty ? html`<span class="unsaved">${t("editor.unsaved")}</span>` : nothing}
        <ha-button appearance="plain" .disabled=${!dirty || this.saving} @click=${this.cancel}>
          ${t("common.cancel")}
        </ha-button>
        <ha-button .disabled=${!dirty || this.saving} .loading=${this.saving} @click=${this.confirmSave}>
          ${t("common.save")}
        </ha-button>
      </div>
    `;
  }
}

define("hs-plan-editor", HsPlanEditor);

interface SavePlanParams {
  days: Day[];
  changed: Set<number>;
  used: string;
  resolve: (save: boolean) => void;
}

/** The week before saving, with the changed days marked. */
export class HsSavePlanDialog extends HsHaDialog<SavePlanParams> {
  private confirmed = false;

  static override styles = css`
    p {
      color: var(--secondary-text-color);
      margin: 0 0 var(--ha-space-3, 12px);
    }
    hs-week-view + p {
      margin: var(--ha-space-3, 12px) 0 0;
    }
  `;

  protected override dialogOpened(): void {
    this.confirmed = false;
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.confirmed);
  }

  private answer(save: boolean) {
    this.confirmed = save;
    this.closeDialog();
  }

  override render() {
    const p = this.args;
    if (!p) return nothing;
    const t = translator(languageOf(this.hass));
    return html`
      <ha-dialog .open=${this.open} header-title=${t("editor.preview_title")} @closed=${this.onClosed}>
        <p>${t("editor.preview_changed")}</p>
        <hs-week-view readonly .days=${p.days} .t=${t} .changed=${p.changed}></hs-week-view>
        <p>${p.used}</p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.answer(false)}>
            ${t("common.back")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${() => this.answer(true)}>${t("common.save")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-save-plan-dialog", HsSavePlanDialog);
