import { LitElement, css, html, nothing } from "lit";
import {
  mdiArrowLeft,
  mdiChevronRight,
  mdiCogOutline,
  mdiHistory,
  mdiHomeFloor1,
  mdiHomeOutline,
  mdiRadiator,
  mdiThermometer,
} from "@mdi/js";
import { languageOf, translator, type TextKey } from "../i18n";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";
import "./hs-adv-health";
import "./hs-adv-log";
import "./hs-adv-rooms";
import "./hs-adv-settings";
import "./hs-adv-temps";
import "./hs-adv-zones";

const SECTIONS: { id: string; label: TextKey; description: TextKey; icon: string; color: string }[] = [
  { id: "rooms", label: "adv.rooms", description: "adv.rooms_desc", icon: mdiHomeOutline, color: "#3f51b5" },
  { id: "zones", label: "adv.zones", description: "adv.zones_desc", icon: mdiHomeFloor1, color: "#009688" },
  { id: "temps", label: "adv.temps", description: "adv.temps_desc", icon: mdiThermometer, color: "#ff6f22" },
  { id: "settings", label: "adv.settings", description: "adv.settings_desc", icon: mdiCogOutline, color: "#607d8b" },
  { id: "health", label: "adv.health", description: "adv.health_desc", icon: mdiRadiator, color: "#4caf50" },
  { id: "log", label: "adv.log", description: "adv.log_desc", icon: mdiHistory, color: "#9c27b0" },
];

/** Advanced settings: a list of sections, like HA's Settings, and one section at a time. */
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
        gap: var(--ha-space-4, 16px);
        max-width: 760px;
        margin: 0 auto;
      }
      ha-alert {
        display: block;
      }
      .list {
        overflow: hidden;
      }
      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: #fff;
      }
      .back {
        align-self: flex-start;
      }
      h1 {
        margin: 0;
        font-size: var(--ha-font-size-2xl, 24px);
        font-weight: var(--ha-font-weight-normal, 400);
      }
    `,
  ];

  private navigate(id: string) {
    const path = id ? `/advanced/${id}` : "/advanced";
    this.dispatchEvent(new CustomEvent("hs-navigate", { detail: path, bubbles: true, composed: true }));
  }

  private content() {
    switch (this.section) {
      case "rooms":
        return html`<hs-adv-rooms .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-rooms>`;
      case "zones":
        return html`<hs-adv-zones .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-zones>`;
      case "temps":
        return html`<hs-adv-temps .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-temps>`;
      case "settings":
        return html`<hs-adv-settings .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-settings>`;
      case "health":
        return html`<hs-adv-health .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-health>`;
      default:
        return html`<hs-adv-log .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-log>`;
    }
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = translator(languageOf(this.hass));
    const current = SECTIONS.find((item) => item.id === this.section);
    return html`
      ${this.snapshot.settings.dry_run
        ? html`<ha-alert alert-type="warning">${t("adv.dry_run_banner")}</ha-alert>`
        : nothing}
      ${current
        ? html`<ha-button class="back" appearance="plain" @click=${() => this.navigate("")}>
              <ha-svg-icon slot="start" .path=${mdiArrowLeft}></ha-svg-icon>${t("nav.advanced")}
            </ha-button>
            <h1>${t(current.label)}</h1>
            ${this.content()}`
        : html`<ha-card class="list">
            ${SECTIONS.map(
              (item) => html`<ha-md-list-item type="button" @click=${() => this.navigate(item.id)}>
                <div slot="start" class="icon" style="background-color:${item.color}">
                  <ha-svg-icon .path=${item.icon}></ha-svg-icon>
                </div>
                <span slot="headline">${t(item.label)}</span>
                <span slot="supporting-text">${t(item.description)}</span>
                <ha-svg-icon slot="end" .path=${mdiChevronRight}></ha-svg-icon>
              </ha-md-list-item>`,
            )}
          </ha-card>`}
    `;
  }
}

define("hs-advanced-view", HsAdvancedView);
