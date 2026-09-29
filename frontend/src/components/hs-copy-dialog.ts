import { LitElement, css, html, nothing } from "lit";
import { mdiContentCopy } from "@mdi/js";
import type { Translate } from "../i18n";
import { ALL_DAYS, WEEKEND, WORKDAYS } from "../schedule/ops";
import { baseStyles } from "../styles";
import { define } from "./define";
import type { HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";

/** Choose the days a day is copied to. Resolves the chosen day indexes. */
export class HsCopyDialog extends LitElement {
  static override properties = {
    source: { type: Number },
    t: { attribute: false },
    chosen: { state: true },
  };
  declare source: number;
  declare t: Translate;
  declare chosen: Set<number>;
  result: number[] = [];

  constructor() {
    super();
    this.chosen = new Set();
  }

  static override styles = [
    baseStyles,
    css`
      .quick {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 8px;
        margin-bottom: 16px;
      }
      .days {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      label {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 52px;
        font-size: 19px;
        padding: 0 6px;
        border-radius: 10px;
        cursor: pointer;
      }
      label.disabled {
        opacity: 0.5;
        cursor: default;
      }
      input {
        width: 28px;
        height: 28px;
        accent-color: var(--hs-accent, #1565c0);
      }
    `,
  ];

  get dialog(): HsDialog | null {
    return this.renderRoot.querySelector("hs-dialog");
  }

  private pick(days: number[]) {
    this.chosen = new Set(days.filter((day) => day !== this.source));
  }

  private toggle(day: number, on: boolean) {
    const next = new Set(this.chosen);
    if (on) next.add(day);
    else next.delete(day);
    this.chosen = next;
  }

  private copy() {
    this.result = [...this.chosen].sort();
    this.dialog?.close();
  }

  override render() {
    if (!this.t) return nothing;
    const t = this.t;
    return html`
      <hs-dialog
        .heading=${t("editor.copy_title", { day: t(`day.${this.source}` as never) })}
        .closeLabel=${t("common.cancel")}
      >
        <div class="quick">
          <button class="btn small" @click=${() => this.pick(WORKDAYS)}>${t("editor.workdays")}</button>
          <button class="btn small" @click=${() => this.pick(WEEKEND)}>${t("editor.weekend")}</button>
          <button class="btn small" @click=${() => this.pick(ALL_DAYS)}>${t("editor.all_days")}</button>
        </div>
        <div class="days">
          ${ALL_DAYS.map(
            (day) => html`<label class=${day === this.source ? "disabled" : ""}>
              <input
                type="checkbox"
                .checked=${day === this.source || this.chosen.has(day)}
                ?disabled=${day === this.source}
                @change=${(e: Event) => this.toggle(day, (e.target as HTMLInputElement).checked)}
              />
              ${t(`day.${day}` as never)}
            </label>`,
          )}
        </div>
        <button slot="actions" class="btn" @click=${() => this.dialog?.close()}>${t("common.cancel")}</button>
        <button slot="actions" class="btn primary" ?disabled=${this.chosen.size === 0} @click=${this.copy}>
          <hs-icon .path=${mdiContentCopy}></hs-icon>${t("editor.copy")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-copy-dialog", HsCopyDialog);

export async function chooseCopyTargets(host: HTMLElement, source: number, t: Translate): Promise<number[]> {
  const element = document.createElement("hs-copy-dialog") as HsCopyDialog;
  element.source = source;
  element.t = t;
  (host.shadowRoot ?? host).appendChild(element);
  await element.updateComplete;
  const dialog = element.dialog;
  if (!dialog) return [];
  return new Promise((resolve) => {
    dialog.addEventListener(
      "hs-closed",
      () => {
        element.remove();
        resolve(element.result);
      },
      { once: true },
    );
    void dialog.show();
  });
}
