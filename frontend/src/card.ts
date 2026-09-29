// Lovelace card: one room, or all rooms, optionally with the house mode.
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { define } from "./components/define";
import "./components/hs-house-strip";
import "./components/hs-room-tile";
import { languageOf, translator } from "./i18n";
import { storeFor } from "./store";
import { baseStyles } from "./styles";
import type { HomeAssistant, Snapshot } from "./types";

export interface CardConfig {
  type: string;
  room?: string;
  compact?: boolean;
  show_house?: boolean;
}

export class HeatingSchedulerCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    config: { state: true },
    snapshot: { state: true },
    message: { state: true },
  };
  declare hass: HomeAssistant;
  declare config: CardConfig;
  declare snapshot: Snapshot | null;
  declare message: string;

  private unsubscribe: (() => void) | null = null;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.snapshot = null;
    this.message = "";
    this.addEventListener("hs-toast", (event) => {
      this.message = (event as CustomEvent<string>).detail;
      if (this.messageTimer) clearTimeout(this.messageTimer);
      this.messageTimer = setTimeout(() => (this.message = ""), 6000);
    });
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .status {
        padding: 16px;
        font-size: 17px;
      }
      .message {
        padding: 12px 16px;
        border-radius: 12px;
        background: #323232;
        color: #fff;
        font-size: 16px;
      }
    `,
  ];

  setConfig(config: CardConfig): void {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    if (config.room !== undefined && typeof config.room !== "string") {
      throw new Error("room must be a room id");
    }
    this.config = { ...config };
  }

  getCardSize(): number {
    const rooms = this.config?.room ? 1 : (this.snapshot?.rooms.length ?? 2);
    return (this.config?.show_house ? 3 : 0) + rooms * (this.config?.compact ? 3 : 5);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("heating-scheduler-card-editor");
  }

  static getStubConfig(): Partial<CardConfig> {
    return { show_house: true };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.hass && !this.unsubscribe) this.subscribe();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass") && this.hass && !this.unsubscribe && this.isConnected) this.subscribe();
  }

  private subscribe() {
    this.unsubscribe = storeFor(this.hass).subscribe((snapshot) => (this.snapshot = snapshot));
  }

  override render() {
    if (!this.hass || !this.config) return nothing;
    const t = translator(languageOf(this.hass));
    const snapshot = this.snapshot;
    if (!snapshot) return html`<div class="card status">${t("common.loading")}</div>`;
    const rooms = this.config.room
      ? snapshot.rooms.filter((room) => room.id === this.config.room)
      : snapshot.rooms;
    return html`
      <div class="stack">
        ${this.config.show_house
          ? html`<hs-house-strip .hass=${this.hass} .snapshot=${snapshot}></hs-house-strip>`
          : nothing}
        ${rooms.map(
          (room) =>
            html`<hs-room-tile
              .hass=${this.hass}
              .room=${room}
              .snapshot=${snapshot}
              ?compact=${this.config.compact ?? false}
            ></hs-room-tile>`,
        )}
        ${this.message ? html`<div class="message" role="alert">${this.message}</div>` : nothing}
      </div>
    `;
  }
}

/** Visual editor of the card: room, compact list, house mode. */
export class HeatingSchedulerCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    config: { state: true },
    snapshot: { state: true },
  };
  declare hass: HomeAssistant;
  declare config: CardConfig;
  declare snapshot: Snapshot | null;

  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.snapshot = null;
  }

  static override styles = [
    baseStyles,
    css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        font-size: 16px;
      }
      .check input {
        width: 24px;
        height: 24px;
      }
    `,
  ];

  setConfig(config: CardConfig): void {
    this.config = { ...config };
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass") && this.hass && !this.unsubscribe) {
      this.unsubscribe = storeFor(this.hass).subscribe((snapshot) => (this.snapshot = snapshot));
    }
  }

  private update_(patch: Partial<CardConfig>) {
    const config: CardConfig = { ...this.config, ...patch };
    for (const key of Object.keys(config) as (keyof CardConfig)[]) {
      if (config[key] === undefined || config[key] === "" || config[key] === false) delete config[key];
    }
    this.config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  override render() {
    if (!this.hass || !this.config) return nothing;
    const t = translator(languageOf(this.hass));
    return html`
      <div class="form">
        <label class="field">
          <span>${t("card.room")}</span>
          <select
            class="input"
            @change=${(e: Event) => this.update_({ room: (e.target as HTMLSelectElement).value || undefined })}
          >
            <option value="" ?selected=${!this.config.room}>${t("card.all_rooms")}</option>
            ${(this.snapshot?.rooms ?? []).map(
              (room) =>
                html`<option value=${room.id} ?selected=${room.id === this.config.room}>${room.name}</option>`,
            )}
          </select>
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${this.config.show_house ?? false}
            @change=${(e: Event) => this.update_({ show_house: (e.target as HTMLInputElement).checked })}
          />
          ${t("card.show_house")}
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${this.config.compact ?? false}
            @change=${(e: Event) => this.update_({ compact: (e.target as HTMLInputElement).checked })}
          />
          ${t("card.compact")}
        </label>
      </div>
    `;
  }
}

define("heating-scheduler-card", HeatingSchedulerCard);
define("heating-scheduler-card-editor", HeatingSchedulerCardEditor);

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

const lang = (document.documentElement.lang || navigator.language || "cs").startsWith("en") ? "en" : "cs";
const t = translator(lang);
window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === "heating-scheduler-card")) {
  window.customCards.push({
    type: "heating-scheduler-card",
    name: t("card.name"),
    description: t("card.description"),
    preview: true,
  });
}
