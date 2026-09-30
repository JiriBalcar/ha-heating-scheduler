import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { languageOf, translator, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, SettingsData, Snapshot } from "../types";
import { define } from "./define";
import { keepMineDialog } from "./hs-dialog";
import "./hs-dialog";

const OVERRIDE_HOURS = [1, 2, 3, 4, 6, 8, 12, 24];

function same(a: SettingsData, b: SettingsData): boolean {
  return (Object.keys(a) as (keyof SettingsData)[]).every((key) => a[key] === b[key]);
}
const SAFETY_MINUTES = [1, 2, 5, 10, 15, 30, 60];
const MISMATCH_MINUTES = [10, 20, 30, 60, 120, 240];

/** Global settings. */
export class HsAdvSettings extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    draft: { state: true },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare draft: SettingsData;
  declare busy: boolean;

  private revision = -1;
  // The server settings the draft started from.
  private base: SettingsData | null = null;

  constructor() {
    super();
    this.busy = false;
  }

  static override styles = [
    baseStyles,
    css`
      .card {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .hint {
        font-size: 15px;
        font-weight: 400;
      }
      .choice {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .choice .btn[aria-pressed="true"] {
        background: var(--hs-accent, #1565c0);
        border-color: var(--hs-accent, #1565c0);
        color: #fff;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 52px;
        font-size: 18px;
      }
      .check input {
        width: 28px;
        height: 28px;
        accent-color: var(--hs-accent, #1565c0);
        flex: none;
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("snapshot") && this.snapshot && this.snapshot.revision !== this.revision) {
      this.revision = this.snapshot.revision;
      if (!this.base || !this.draft || same(this.draft, this.base)) {
        this.draft = { ...this.snapshot.settings };
        this.base = { ...this.snapshot.settings };
      }
    }
  }

  private set<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    this.draft = { ...this.draft, [key]: value };
  }

  private get dirty(): boolean {
    return this.base !== null && !same(this.draft, this.base);
  }

  private async save() {
    const server = this.snapshot.settings;
    if (this.base && !same(server, this.base) && !(await keepMineDialog(this, this.t))) {
      this.draft = { ...server };
      this.base = { ...server };
      return;
    }
    // What is sent is what counts as saved; edits made while waiting stay unsaved.
    const submitted = { ...this.draft };
    this.busy = true;
    try {
      await storeFor(this.hass).call("settings/save", {
        revision: this.snapshot.revision,
        settings: submitted,
      });
      this.base = submitted;
      toast(this, this.t("adv.settings.saved"));
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  private select(label: string, values: number[], current: number, unit: "hours" | "minutes", onChange: (v: number) => void, hint?: string) {
    const t = this.t;
    const options = values.includes(current) ? values : [...values, current].sort((a, b) => a - b);
    return html`<label class="field">
      <span>${label}</span>
      <select class="input" @change=${(e: Event) => onChange(Number((e.target as HTMLSelectElement).value))}>
        ${options.map(
          (value) => html`<option value=${value} ?selected=${value === current}>
            ${t(unit === "hours" ? "adv.settings.hours" : "adv.settings.minutes", { n: value })}
          </option>`,
        )}
      </select>
      ${hint ? html`<span class="hint muted">${hint}</span>` : nothing}
    </label>`;
  }

  override render() {
    if (!this.snapshot || !this.hass || !this.draft) return nothing;
    const t = this.t;
    const draft = this.draft;
    return html`
      <div class="card">
        ${this.select(
          t("adv.settings.max_override"),
          OVERRIDE_HOURS,
          draft.max_override_minutes / 60,
          "hours",
          (hours) => this.set("max_override_minutes", Math.round(hours * 60)),
          t("adv.settings.max_override_hint"),
        )}
        ${this.select(t("adv.settings.safety_interval"), SAFETY_MINUTES, draft.safety_interval_minutes, "minutes", (m) =>
          this.set("safety_interval_minutes", m),
        )}
        ${this.select(t("adv.settings.mismatch_alert"), MISMATCH_MINUTES, draft.mismatch_alert_minutes, "minutes", (m) =>
          this.set("mismatch_alert_minutes", m),
        )}
        <div class="field">
          <span>${t("adv.settings.vacation_mode")}</span>
          <div class="choice">
            <button
              class="btn"
              aria-pressed=${draft.vacation_mode === "frost" ? "true" : "false"}
              @click=${() => this.set("vacation_mode", "frost")}
            >
              ${t("adv.settings.frost")}
            </button>
            <button
              class="btn"
              aria-pressed=${draft.vacation_mode === "away" ? "true" : "false"}
              @click=${() => this.set("vacation_mode", "away")}
            >
              ${t("adv.settings.away")}
            </button>
          </div>
        </div>
        <label class="check">
          <input
            type="checkbox"
            .checked=${draft.dry_run}
            @change=${(e: Event) => this.set("dry_run", (e.target as HTMLInputElement).checked)}
          />
          ${t("adv.settings.dry_run")}
        </label>
        <button class="btn primary" ?disabled=${this.busy || !this.dirty} @click=${this.save}>
          ${t("common.save")}
        </button>
      </div>
    `;
  }
}

define("hs-adv-settings", HsAdvSettings);
