import { css, html, nothing } from "lit";
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
      margin-bottom: var(--ha-space-4, 16px);
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

  private changed(event: CustomEvent<{ value: { days?: string[] } }>) {
    this.chosen = (event.detail.value.days ?? []).map(Number);
  }

  private copy() {
    this.result = [...this.chosen].sort();
    this.closeDialog();
  }

  override render() {
    if (!this.args) return nothing;
    const t = this.t;
    const source = this.args.source;
    const schema = [
      {
        name: "days",
        selector: {
          select: {
            multiple: true,
            mode: "list",
            options: ALL_DAYS.map((day) => ({
              value: String(day),
              label: t(`day.${day}` as TextKey),
              disabled: day === source,
            })),
          },
        },
      },
    ];
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${t("editor.copy_title", { day: t(`day.${source}` as TextKey) })}
        @closed=${this.onClosed}
      >
        <div class="quick">
          <ha-button appearance="outlined" size="small" @click=${() => this.pick(WORKDAYS)}>
            ${t("editor.workdays")}
          </ha-button>
          <ha-button appearance="outlined" size="small" @click=${() => this.pick(WEEKEND)}>
            ${t("editor.weekend")}
          </ha-button>
          <ha-button appearance="outlined" size="small" @click=${() => this.pick(ALL_DAYS)}>
            ${t("editor.all_days")}
          </ha-button>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${{ days: this.chosen.map(String) }}
          .schema=${schema}
          .computeLabel=${() => ""}
          @value-changed=${this.changed}
        ></ha-form>
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
