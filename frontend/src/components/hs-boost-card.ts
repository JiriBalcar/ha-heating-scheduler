import { LitElement, css, html, nothing } from "lit";
import { formatContext, formatDuration, formatUntil } from "../format";
import { languageOf, translator } from "../i18n";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";
import { confirmDialog } from "./hs-dialog";
import { sendHouseCommand } from "./house-actions";

/**
 * Boost as an HA tile: every room at its valves' maximum for the length in the settings. Starting
 * ends Away, Holiday and Off, because someone is home. A tap on the tile or its button starts or
 * stops it, after a question.
 */
export class HsBoostCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare busy: boolean;

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
      ha-card {
        height: 100%;
      }
      ha-tile-icon {
        --tile-icon-color: var(--tile-color);
      }
      .features {
        display: grid;
      }
      ha-control-button-group {
        --control-button-group-thickness: var(--feature-height, 42px);
      }
      ha-control-button {
        --control-button-background-color: var(--tile-color);
      }
    `,
  ];

  private get t() {
    return translator(languageOf(this.hass));
  }

  private get running(): boolean {
    const until = this.snapshot.boost_until;
    return until !== null && new Date(until).getTime() > Date.now();
  }

  private get duration(): string {
    return formatDuration(this.snapshot.settings.boost_minutes);
  }

  /**
   * Ask, then start or stop. The button stays off from the tap to the new state: HA's dialog box
   * needs about a second to go, and a second tap then would ask again over it.
   */
  private async toggle() {
    if (this.busy) return;
    this.busy = true;
    try {
      const t = this.t;
      const running = this.running;
      const leaving = this.snapshot.zones.some((zone) => zone.house.effective !== "auto");
      const ok = await confirmDialog(this, {
        heading: t("boost.title"),
        message: running
          ? t("boost.confirm_stop")
          : t(leaving ? "boost.confirm_start_modes" : "boost.confirm_start", { duration: this.duration }),
        confirm: t(running ? "boost.confirm_stop_button" : "boost.confirm_start_button"),
        cancel: t("common.cancel"),
      });
      if (ok) await sendHouseCommand(this, this.hass, running ? "boost/stop" : "boost/start", {});
    } finally {
      this.busy = false;
    }
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const running = this.running;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const status = running
      ? t("boost.running", { until: formatUntil(this.snapshot.boost_until!, new Date(), ctx) })
      : t("boost.idle", { duration: this.duration });
    const color = running ? MODE_COLORS.boost : "var(--state-inactive-color, #9e9e9e)";
    return html`
      <ha-card style="--tile-color:${color}">
        <ha-tile-container .interactive=${true} .actionHandlerOptions=${{}} @action=${this.toggle}>
          <ha-tile-icon slot="icon" .iconPath=${MODE_ICONS.boost}></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${t("boost.title")}</span>
            <span slot="secondary">${status}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-button-group>
              <ha-control-button .disabled=${this.busy} .label=${t("boost.title")} @click=${this.toggle}>
                ${running ? t("boost.stop") : t("boost.start")}
              </ha-control-button>
            </ha-control-button-group>
          </div>
        </ha-tile-container>
      </ha-card>
    `;
  }
}

define("hs-boost-card", HsBoostCard);
