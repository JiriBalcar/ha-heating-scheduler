import { LitElement, css, html, nothing } from "lit";
import { mdiPlusCircle } from "@mdi/js";
import { languageOf, translator } from "../i18n";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";
import "./hs-house-strip";
import "./hs-icon";
import "./hs-room-tile";

/** The simple view: house mode and one tile per room. */
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
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .rooms {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
        gap: 16px;
      }
      .dry {
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--warning-color, #e65100);
        color: #fff;
        font-weight: 600;
        font-size: 17px;
      }
      .empty {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
        font-size: 18px;
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
        ? html`<div class="dry" role="status">${t("adv.dry_run_banner")}</div>`
        : nothing}
      <hs-house-strip .hass=${this.hass} .snapshot=${this.snapshot}></hs-house-strip>
      ${this.snapshot.rooms.length === 0
        ? html`<div class="card empty">
            <span>${t("adv.rooms.empty")}</span>
            <button class="btn primary" @click=${this.addRooms}>
              <hs-icon .path=${mdiPlusCircle}></hs-icon>${t("adv.rooms.add")}
            </button>
          </div>`
        : html`<div class="rooms">
            ${this.snapshot.rooms.map(
              (room) =>
                html`<hs-room-tile
                  .hass=${this.hass}
                  .room=${room}
                  .snapshot=${this.snapshot}
                ></hs-room-tile>`,
            )}
          </div>`}
    `;
  }
}

define("hs-home-view", HsHomeView);
