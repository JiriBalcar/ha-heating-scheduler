import { repeat } from "lit/directives/repeat.js";
import { LitElement, css, html, nothing } from "lit";
import { languageOf, translator } from "../i18n";
import { baseStyles } from "../styles";
import type { HomeAssistant, RoomData, Snapshot } from "../types";
import { roomsOf } from "../zones";
import { define } from "./define";
import "./hs-house-card";
import "./hs-room-card";

/**
 * The simple view, laid out like a dashboard: the house mode and one tile per room. With two or
 * more zones, a whole-house tile comes first, then each zone's tile with the zone's rooms.
 */
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
      .zones {
        display: grid;
        gap: var(--ha-space-6, 24px);
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

  private rooms(rooms: RoomData[]) {
    return repeat(
      rooms,
      (room) => room.id,
      (room) => html`<hs-room-card .hass=${this.hass} .room=${room} .snapshot=${this.snapshot}></hs-room-card>`,
    );
  }

  override render() {
    if (!this.snapshot) return nothing;
    const t = translator(languageOf(this.hass));
    const snapshot = this.snapshot;
    const alert = snapshot.settings.dry_run
      ? html`<ha-alert alert-type="warning">${t("adv.dry_run_banner")}</ha-alert>`
      : nothing;
    if (snapshot.rooms.length === 0) {
      return html`${alert}
        <div class="grid">
          <hs-house-card .hass=${this.hass} .snapshot=${snapshot}></hs-house-card>
          <ha-card class="empty">
            <p>${t("adv.rooms.empty")}</p>
            <ha-button @click=${this.addRooms}>${t("adv.rooms.add")}</ha-button>
          </ha-card>
        </div>`;
    }
    if (snapshot.zones.length < 2) {
      return html`${alert}
        <div class="grid">
          <hs-house-card .hass=${this.hass} .snapshot=${snapshot}></hs-house-card>
          ${this.rooms(snapshot.rooms)}
        </div>`;
    }
    return html`${alert}
      <div class="zones">
        <div class="grid">
          <hs-house-card .hass=${this.hass} .snapshot=${snapshot}></hs-house-card>
        </div>
        ${repeat(
          snapshot.zones,
          (zone) => zone.id,
          (zone) => html`<div class="grid">
            <hs-house-card .hass=${this.hass} .snapshot=${snapshot} .zone=${zone}></hs-house-card>
            ${this.rooms(roomsOf(snapshot, zone))}
          </div>`,
        )}
      </div>`;
  }
}

define("hs-home-view", HsHomeView);
