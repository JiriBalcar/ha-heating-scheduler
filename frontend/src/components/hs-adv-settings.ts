import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { formatDuration } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, SettingsData, Snapshot } from "../types";
import { reportUnsaved } from "../unsaved";
import { define } from "./define";
import { keepMineDialog } from "./hs-dialog";

const OVERRIDE_HOURS = [1, 2, 3, 4, 6, 8, 12, 24];

function same(a: SettingsData, b: SettingsData): boolean {
  return (Object.keys(a) as (keyof SettingsData)[]).every((key) => a[key] === b[key]);
}
const SAFETY_MINUTES = [1, 2, 5, 10, 15, 30, 60];
const MISMATCH_MINUTES = [10, 20, 30, 60, 120, 240];
const BOOST_MINUTES = [30, 60, 90, 120, 180, 240];
const WINDOW_DELAY_SECONDS = [0, 15, 30, 60, 120, 300, 600];
const WINDOW_LIMIT_MINUTES = [15, 30, 60, 120, 240, 480, 1440];

/** "At once", "30 s", "2 min". */
function secondsLabel(seconds: number, t: Translate): string {
  if (seconds === 0) return t("adv.settings.at_once");
  if (seconds % 60 === 0) return t("adv.settings.minutes", { n: seconds / 60 });
  return t("adv.settings.seconds", { n: seconds });
}

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
      :host {
        display: block;
      }
      ha-settings-row {
        border-top: 1px solid var(--divider-color);
      }
      ha-settings-row:first-child {
        border-top: none;
      }
      ha-select {
        min-width: 140px;
      }
      ha-card {
        container-type: inline-size;
      }
      /* HA gives a row's label and its control half the width each. In a narrow card the control
         goes under the label, as in HA's own narrow layout. */
      @container (max-width: 500px) {
        ha-settings-row {
          flex-direction: column;
          align-items: stretch;
          padding-bottom: var(--ha-space-3, 12px);
          --settings-row-content-padding-block: 0;
        }
      }
      .card-actions {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
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

  private reportedUnsaved = false;

  protected override updated(): void {
    const unsaved = this.dirty;
    if (unsaved !== this.reportedUnsaved) {
      this.reportedUnsaved = unsaved;
      reportUnsaved(this, unsaved);
    }
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

  /** A setting row with a dropdown of hours, minutes, or a length ("1 h 30 min"). */
  private choice(
    heading: string,
    values: number[],
    current: number,
    unit: "hours" | "minutes" | "duration" | "seconds",
    onChange: (value: number) => void,
    description?: string,
  ) {
    const t = this.t;
    const all = values.includes(current) ? values : [...values, current].sort((a, b) => a - b);
    const options = all.map((value) => ({
      value: String(value),
      label:
        unit === "duration"
          ? formatDuration(value)
          : unit === "seconds"
            ? secondsLabel(value, t)
            : t(unit === "hours" ? "adv.settings.hours" : "adv.settings.minutes", { n: value }),
    }));
    return html`<ha-settings-row>
      <span slot="heading">${heading}</span>
      ${description ? html`<span slot="description">${description}</span>` : nothing}
      <ha-select
        .options=${options}
        .value=${String(current)}
        @selected=${(e: CustomEvent<{ value?: string }>) => {
          if (e.detail.value !== undefined) onChange(Number(e.detail.value));
        }}
      ></ha-select>
    </ha-settings-row>`;
  }

  override render() {
    if (!this.snapshot || !this.hass || !this.draft) return nothing;
    const t = this.t;
    const draft = this.draft;
    return html`
      <ha-card>
        ${this.choice(
          t("adv.settings.max_override"),
          OVERRIDE_HOURS,
          draft.max_override_minutes / 60,
          "hours",
          (hours) => this.set("max_override_minutes", Math.round(hours * 60)),
          t("adv.settings.max_override_hint"),
        )}
        ${this.choice(t("adv.settings.safety_interval"), SAFETY_MINUTES, draft.safety_interval_minutes, "minutes", (m) =>
          this.set("safety_interval_minutes", m),
        )}
        ${this.choice(t("adv.settings.mismatch_alert"), MISMATCH_MINUTES, draft.mismatch_alert_minutes, "minutes", (m) =>
          this.set("mismatch_alert_minutes", m),
        )}
        ${this.choice(t("adv.settings.boost"), BOOST_MINUTES, draft.boost_minutes, "duration", (m) =>
          this.set("boost_minutes", m),
        )}
        ${this.choice(
          t("adv.settings.window_delay"),
          WINDOW_DELAY_SECONDS,
          draft.window_delay_seconds,
          "seconds",
          (s) => this.set("window_delay_seconds", s),
          t("adv.settings.window_delay_hint"),
        )}
        ${this.choice(t("adv.settings.window_limit"), WINDOW_LIMIT_MINUTES, draft.window_limit_minutes, "duration", (m) =>
          this.set("window_limit_minutes", m),
        )}
        <ha-settings-row>
          <span slot="heading">${t("adv.settings.vacation_mode")}</span>
          <ha-select
            .options=${[
              { value: "frost", label: t("adv.settings.frost") },
              { value: "away", label: t("adv.settings.away") },
            ]}
            .value=${draft.vacation_mode}
            @selected=${(e: CustomEvent<{ value?: "frost" | "away" }>) => {
              if (e.detail.value) this.set("vacation_mode", e.detail.value);
            }}
          ></ha-select>
        </ha-settings-row>
        <ha-settings-row>
          <span slot="heading">${t("adv.settings.dry_run")}</span>
          <ha-switch
            .checked=${draft.dry_run}
            @change=${(e: Event) => this.set("dry_run", (e.target as HTMLInputElement).checked)}
          ></ha-switch>
        </ha-settings-row>
        <div class="card-actions">
          <ha-button .disabled=${this.busy || !this.dirty} .loading=${this.busy} @click=${this.save}>
            ${t("common.save")}
          </ha-button>
        </div>
      </ha-card>
    `;
  }
}

define("hs-adv-settings", HsAdvSettings);
