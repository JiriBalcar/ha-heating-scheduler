import { LitElement, css, html, nothing } from "lit";
import { languageOf, translator, type TextKey } from "../i18n";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";
import "./hs-adv-health";
import "./hs-adv-log";
import "./hs-adv-rooms";
import "./hs-adv-settings";
import "./hs-adv-temps";

const SECTIONS: { id: string; label: TextKey }[] = [
  { id: "rooms", label: "adv.rooms" },
  { id: "temps", label: "adv.temps" },
  { id: "settings", label: "adv.settings" },
  { id: "health", label: "adv.health" },
  { id: "log", label: "adv.log" },
];

/** Advanced settings, kept away from the simple view. */
export class HsAdvancedView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    section: { attribute: false },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare section: string;

  static override styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .sections {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }
      .sections button {
        flex: none;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        border: 2px solid var(--divider-color, #c4c4c4);
        background: var(--card-background-color, #fff);
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      }
      .sections button[aria-current="page"] {
        background: var(--hs-accent, #1565c0);
        border-color: var(--hs-accent, #1565c0);
        color: #fff;
      }
      .dry {
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--warning-color, #e65100);
        color: #fff;
        font-weight: 600;
      }
    `,
  ];

  private navigate(id: string) {
    this.dispatchEvent(new CustomEvent("hs-navigate", { detail: `/advanced/${id}`, bubbles: true, composed: true }));
  }

  private content() {
    switch (this.section) {
      case "temps":
        return html`<hs-adv-temps .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-temps>`;
      case "settings":
        return html`<hs-adv-settings .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-settings>`;
      case "health":
        return html`<hs-adv-health .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-health>`;
      case "log":
        return html`<hs-adv-log .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-log>`;
      default:
        return html`<hs-adv-rooms .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-rooms>`;
    }
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = translator(languageOf(this.hass));
    const current = SECTIONS.some((item) => item.id === this.section) ? this.section : "rooms";
    return html`
      <div class="sections" role="tablist">
        ${SECTIONS.map(
          (item) => html`<button
            role="tab"
            aria-current=${item.id === current ? "page" : "false"}
            @click=${() => this.navigate(item.id)}
          >
            ${t(item.label)}
          </button>`,
        )}
      </div>
      ${this.snapshot.settings.dry_run ? html`<div class="dry" role="status">${t("adv.dry_run_banner")}</div>` : nothing}
      ${this.content()}
    `;
  }
}

define("hs-advanced-view", HsAdvancedView);
