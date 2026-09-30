import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiArrowLeft, mdiChevronRight, mdiContentCopy } from "@mdi/js";
import { zonedParts } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
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
import { define } from "./define";
import type { BoundaryMoveDetail, SegmentTapDetail } from "./hs-day-bar";
import "./hs-day-bar";
import { openBlockSheet } from "./hs-block-sheet";
import { chooseCopyTargets } from "./hs-copy-dialog";
import { confirmDialog, keepMineDialog, type HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";
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
        gap: 16px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
      }
      .name {
        flex: 1 1 220px;
      }
      .used {
        font-size: 17px;
      }
      section.card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      h3 {
        font-size: 21px;
      }
      .big {
        --bar-height: 64px;
        margin-top: 44px;
      }
      .axis {
        position: relative;
        height: 20px;
        font-size: 14px;
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
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .part {
        width: 100%;
        min-height: 60px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border: 2px solid var(--divider-color, #c4c4c4);
        border-radius: 14px;
        background: transparent;
        cursor: pointer;
        font-size: 19px;
        text-align: left;
      }
      .part .time {
        flex: 1;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .footer {
        position: sticky;
        bottom: 0;
        display: flex;
        gap: 12px;
        padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px));
        background: var(--primary-background-color, #fafafa);
        border-top: 1px solid var(--divider-color, #e0e0e0);
        z-index: 3;
      }
      .footer .btn {
        flex: 1;
      }
      .unsaved {
        font-weight: 600;
        color: var(--warning-color, #e65100);
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
    void openBlockSheet(this, {
      day: this.days[dayIndex]!,
      index,
      minute,
      dayName: this.t(`day.${dayIndex}` as never),
      t: this.t,
      onChange: (day) => this.setDay(dayIndex, day),
    });
  }

  private async copyDay() {
    const targets = await chooseCopyTargets(this, this.selected, this.t);
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

  private preview(): HsDialog | null {
    return this.renderRoot.querySelector("#preview");
  }

  /** True if the plan was changed elsewhere since it was loaded into the editor. */
  private changedElsewhere(): boolean {
    const current = fromPlan(this.plan);
    return (
      this.plan.name !== this.baseName ||
      current.some((day, index) => !sameDay(day, this.original[index] ?? []))
    );
  }

  private async save() {
    const dialog = this.preview();
    dialog?.close();
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
      dialog?.close();
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
      <div class="head">
        <button class="btn" @click=${this.leave}>
          <hs-icon .path=${mdiArrowLeft}></hs-icon>${t("plans.all_plans")}
        </button>
        <label class="field name">
          <span class="sr-only">${t("plans.name")}</span>
          <input
            class="input"
            .value=${this.name}
            maxlength="60"
            aria-label=${t("plans.name")}
            @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
          />
        </label>
      </div>
      <div class="used muted">
        ${used.length ? t("plans.used_by", { rooms: this.roomNames(used) }) : t("plans.unused")}
      </div>
      <section class="card">
        <span class="muted">${t("editor.tap_day")}</span>
        <hs-week-view
          .days=${this.days}
          .t=${t}
          .selected=${this.selected}
          .changed=${this.changedDays()}
          @day-select=${(e: CustomEvent<number>) => (this.selected = e.detail)}
        ></hs-week-view>
      </section>
      <section class="card" aria-live="polite">
        <h3>${t(`day.${this.selected}` as never)}</h3>
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
        <div class="axis muted" aria-hidden="true">
          ${[0, 6, 12, 18, 24].map((hour) => html`<span style="left:${(hour / 24) * 100}%">${hour}:00</span>`)}
        </div>
        <span class="muted">${t("editor.parts")}</span>
        <ul class="parts">
          ${segments(day).map(
            (segment) => html`<li>
              <button class="part" @click=${() => this.openSheet(segment.index, null)}>
                <span class="time">${toHHMM(segment.start)} – ${toHHMM(segment.end)}</span>
                <span class="chip" style="background:${MODE_COLORS[segment.mode]}">
                  <hs-icon .path=${MODE_ICONS[segment.mode]}></hs-icon>${t(`mode.${segment.mode}`)}
                </span>
                <hs-icon .path=${mdiChevronRight}></hs-icon>
              </button>
            </li>`,
          )}
        </ul>
        <button class="btn" @click=${this.copyDay}>
          <hs-icon .path=${mdiContentCopy}></hs-icon>${t("editor.copy_day")}
        </button>
      </section>
      <div class="footer">
        <button class="btn" ?disabled=${!dirty || this.saving} @click=${this.cancel}>${t("common.cancel")}</button>
        <button class="btn primary" ?disabled=${!dirty || this.saving} @click=${() => this.preview()?.show()}>
          ${t("common.save")}
        </button>
      </div>
      <hs-dialog id="preview" wide .heading=${t("editor.preview_title")} .closeLabel=${t("common.back")}>
        <p class="muted">${t("editor.preview_changed")}</p>
        <hs-week-view readonly .days=${this.days} .t=${t} .changed=${this.changedDays()}></hs-week-view>
        <p>
          ${used.length
            ? t("editor.preview_used", { rooms: this.roomNames(used) })
            : t("editor.preview_unused")}
        </p>
        <button slot="actions" class="btn" @click=${() => this.preview()?.close()}>${t("common.back")}</button>
        <button slot="actions" class="btn primary" ?disabled=${this.saving} @click=${this.save}>
          ${t("common.save")}
        </button>
      </hs-dialog>
      ${dirty ? html`<span class="unsaved sr-only">${t("editor.unsaved")}</span>` : nothing}
    `;
  }
}

define("hs-plan-editor", HsPlanEditor);
