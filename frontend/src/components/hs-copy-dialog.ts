import { css, html, nothing } from "lit";
import { mdiCheckboxBlankOutline, mdiCheckboxMarked } from "@mdi/js";
import { showDialog } from "../ha";
import { languageOf, translator, type TextKey } from "../i18n";
import { ALL_DAYS, WEEKEND, WORKDAYS } from "../schedule/ops";
import { define } from "./define";
import { HsHaDialog } from "./hs-dialog";

interface CopyParams {
  source: number;
  resolve: (days: number[]) => void;
}

/** Choose the days a day is copied to. */
export class HsCopyDialog extends HsHaDialog<CopyParams> {
  static override properties = {
    chosen: { state: true },
  };
  declare chosen: number[];
  private result: number[] = [];

  static override styles = css`
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-2, 8px);
    }
    ha-list-item-button {
      --ha-row-item-padding-inline: 0;
    }
    ha-svg-icon[slot="start"] {
      color: var(--secondary-text-color);
    }
    .chosen ha-svg-icon[slot="start"] {
      color: var(--primary-color);
    }
  `;

  protected override dialogOpened(): void {
    this.chosen = [];
    this.result = [];
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.result);
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  private pick(days: number[]) {
    const source = this.args?.source;
    this.chosen = days.filter((day) => day !== source);
  }

  private toggle(day: number) {
    this.chosen = this.chosen.includes(day) ? this.chosen.filter((item) => item !== day) : [...this.chosen, day];
  }

  private copy() {
    this.result = [...this.chosen].sort();
    this.closeDialog();
  }

  override render() {
    if (!this.args) return nothing;
    const t = this.t;
    const source = this.args.source;
    const heading = t("editor.copy_title", { day: t(`day.acc.${source}` as TextKey) });
    return html`
      <ha-dialog .open=${this.open} header-title=${heading} @closed=${this.onClosed}>
        <div class="quick">
          <ha-button appearance="outlined" @click=${() => this.pick(WORKDAYS)}>
            ${t("editor.workdays")}
          </ha-button>
          <ha-button appearance="outlined" @click=${() => this.pick(WEEKEND)}>
            ${t("editor.weekend")}
          </ha-button>
          <ha-button appearance="outlined" @click=${() => this.pick(ALL_DAYS)}>
            ${t("editor.all_days")}
          </ha-button>
        </div>
        <ha-list-base role="listbox" aria-multiselectable="true" aria-label=${heading}>
          ${ALL_DAYS.map((day) => {
            const chosen = day === source || this.chosen.includes(day);
            return html`<ha-list-item-button
              role="option"
              class=${chosen ? "chosen" : ""}
              aria-selected=${chosen ? "true" : "false"}
              aria-disabled=${day === source ? "true" : "false"}
              ?disabled=${day === source}
              @click=${() => this.toggle(day)}
            >
              <ha-svg-icon slot="start" .path=${chosen ? mdiCheckboxMarked : mdiCheckboxBlankOutline}></ha-svg-icon>
              <span slot="headline">${t(`day.${day}` as TextKey)}</span>
            </ha-list-item-button>`;
          })}
        </ha-list-base>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${this.chosen.length === 0} @click=${this.copy}>
            ${t("editor.copy")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-copy-dialog", HsCopyDialog);

/** Ask for the days to copy `source` to. Resolves the chosen days, or [] when cancelled. */
export function chooseCopyTargets(host: HTMLElement, source: number): Promise<number[]> {
  return new Promise((resolve) => showDialog(host, "hs-copy-dialog", { source, resolve }));
}
