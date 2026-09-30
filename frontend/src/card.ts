// The real Lovelace card and its editor, in the main bundle. card-loader.ts shows them.
import { repeat } from "lit/directives/repeat.js";
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { define } from "./components/define";
import "./components/hs-house-card";
import "./components/hs-room-card";
import { languageOf, translator, type TextKey } from "./i18n";
import { storeFor } from "./store";
import { baseStyles } from "./styles";
import type { CardConfig, HomeAssistant, Snapshot } from "./types";
import { roomsOf } from "./zones";

const ALL_ROOMS = "all";
const WHOLE_HOUSE = "house:all";

export class HeatingSchedulerCard extends LitElement {
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
      :host {
        display: block;
      }
      .stack {
        display: grid;
        gap: var(--ha-space-2, 8px);
      }
      .status {
        padding: var(--ha-space-4, 16px);
        color: var(--secondary-text-color);
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
    if (!snapshot) return html`<ha-card class="status">${t("common.loading")}</ha-card>`;
    const zone = snapshot.zones.find((item) => item.id === this.config.zone) ?? null;
    const rooms = this.config.room
      ? snapshot.rooms.filter((room) => room.id === this.config.room)
      : zone
        ? roomsOf(snapshot, zone)
        : snapshot.rooms;
    return html`
      <div class="stack">
        ${this.config.show_house
          ? html`<hs-house-card .hass=${this.hass} .snapshot=${snapshot} .zone=${zone}></hs-house-card>`
          : nothing}
        ${repeat(
          rooms,
          (room) => room.id,
          (room) =>
            html`<hs-room-card
              .hass=${this.hass}
              .room=${room}
              .snapshot=${snapshot}
              ?compact=${this.config.compact ?? false}
            ></hs-room-card>`,
        )}
      </div>
    `;
  }
}

/** Visual editor of the card: room, compact tiles, house mode. */
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

  private get t() {
    return translator(languageOf(this.hass));
  }

  private schema() {
    const rooms = this.snapshot?.rooms ?? [];
    const zones = this.snapshot?.zones ?? [];
    const zone =
      zones.length > 1
        ? [
            {
              name: "zone",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: WHOLE_HOUSE, label: this.t("card.whole_house") },
                    ...zones.map((item) => ({ value: item.id, label: item.name })),
                  ],
                },
              },
            },
          ]
        : [];
    return [
      ...zone,
      {
        name: "room",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: ALL_ROOMS, label: this.t("card.all_rooms") },
              ...rooms.map((room) => ({ value: room.id, label: room.name })),
            ],
          },
        },
      },
      { name: "show_house", selector: { boolean: {} } },
      { name: "compact", selector: { boolean: {} } },
    ];
  }

  private label = (field: { name: string }): string => this.t(`card.${field.name}` as TextKey);

  private changed(event: CustomEvent<{ value: Record<string, unknown> }>) {
    const value = event.detail.value;
    const config: CardConfig = {
      ...this.config,
      room: value.room === ALL_ROOMS ? undefined : (value.room as string | undefined),
      zone: value.zone === WHOLE_HOUSE ? undefined : (value.zone as string | undefined),
      show_house: Boolean(value.show_house),
      compact: Boolean(value.compact),
    };
    for (const key of Object.keys(config) as (keyof CardConfig)[]) {
      if (config[key] === undefined || config[key] === "" || config[key] === false) delete config[key];
    }
    this.config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  override render() {
    if (!this.hass || !this.config) return nothing;
    const data = {
      room: this.config.room ?? ALL_ROOMS,
      zone: this.config.zone ?? WHOLE_HOUSE,
      show_house: this.config.show_house ?? false,
      compact: this.config.compact ?? false,
    };
    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${this.schema()}
      .computeLabel=${this.label}
      @value-changed=${this.changed}
    ></ha-form>`;
  }
}

define("hs-card", HeatingSchedulerCard);
define("hs-card-editor", HeatingSchedulerCardEditor);
