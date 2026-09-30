import { repeat } from "lit/directives/repeat.js";
import { LitElement, css, html, nothing } from "lit";
import { languageOf, translator } from "../i18n";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";
import "./hs-house-card";
import "./hs-room-card";

/** The simple view: house mode and one tile per room, laid out like a dashboard. */
export class HsHomeView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        align-items: start;
        gap: var(--ha-space-2, 8px);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--ha-space-4, 16px);
      }
      .empty {
        padding: var(--ha-space-4, 16px);
      }
      .empty p {
        margin: 0 0 var(--ha-space-4, 16px);
      }
    `,
  ];

  private addRooms() {
    this.dispatchEvent(
      new CustomEvent("hs-navigate", { detail: "/advanced/rooms", bubbles: true, composed: true }),
    );
  }

  override render() {
    if (!this.snapshot) return nothing;
    const t = translator(languageOf(this.hass));
    return html`
      ${this.snapshot.settings.dry_run
        ? html`<ha-alert alert-type="warning">${t("adv.dry_run_banner")}</ha-alert>`
        : nothing}
      <div class="grid">
        <hs-house-card .hass=${this.hass} .snapshot=${this.snapshot}></hs-house-card>
        ${this.snapshot.rooms.length === 0
          ? html`<ha-card class="empty">
              <p>${t("adv.rooms.empty")}</p>
              <ha-button @click=${this.addRooms}>${t("adv.rooms.add")}</ha-button>
            </ha-card>`
          : repeat(
              this.snapshot.rooms,
              (room) => room.id,
              (room) =>
                html`<hs-room-card .hass=${this.hass} .room=${room} .snapshot=${this.snapshot}></hs-room-card>`,
            )}
      </div>
    `;
  }
}

define("hs-home-view", HsHomeView);
