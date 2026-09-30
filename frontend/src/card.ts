// The real Lovelace card and its editor, in the main bundle. card-loader.ts shows them.
//
// The card switches the mode of the whole house or of one zone (Normal / Away / Holiday / Off) as
// an HA tile of HA's size. Rooms and boosts use HA's own tile cards: a room's thermostat shows
// its state with `state_content: [current_temperature, status]`.
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { checkCardConfig, fixedHeight } from "./card-config";
import { define } from "./components/define";
import "./components/hs-house-card";
import "./components/hs-house-hints";
import { languageOf, translator } from "./i18n";
import { acquireScrim, releaseScrim } from "./scrim";
import { storeFor } from "./store";
import { baseStyles } from "./styles";
import type { CardConfig, HomeAssistant, Snapshot } from "./types";

const WHOLE_HOUSE = "house:all";

export class HeatingSchedulerCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    layout: { attribute: false },
    config: { state: true },
    snapshot: { state: true },
  };
  declare hass: HomeAssistant;
  /** "grid" in a sections view: HA sets it on every card. */
  declare layout: string | undefined;
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
        height: 100%;
      }
      .stack {
        height: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--ha-space-2, 8px);
      }
      hs-house-hints[hidden] {
        display: none;
      }
      .status {
        padding: var(--ha-space-4, 16px);
        color: var(--secondary-text-color);
      }
    `,
  ];

  setConfig(config: CardConfig): void {
    checkCardConfig(config);
    this.config = { ...config };
  }

  getCardSize(): number {
    return 3;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    acquireScrim();
    if (this.hass && !this.unsubscribe) this.subscribe();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    releaseScrim();
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
    // With a fixed height from the grid, the tile fills it like HA's tile; the hints have no room.
    const fixed = fixedHeight(this.config, this.layout);
    return html`
      <div class="stack">
        ${fixed ? nothing : html`<hs-house-hints .hass=${this.hass} .snapshot=${snapshot} .zone=${zone}></hs-house-hints>`}
        <hs-house-card .hass=${this.hass} .snapshot=${snapshot} .zone=${zone} .fixed=${fixed}></hs-house-card>
      </div>
    `;
  }
}

/** Visual editor of the card: the whole house or one zone. */
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
    const zones = this.snapshot?.zones ?? [];
    return [
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
    ];
  }

  private label = (): string => this.t("card.zone");

  private changed(event: CustomEvent<{ value: Record<string, unknown> }>) {
    const zone = event.detail.value.zone;
    const { zone: _previous, ...rest } = this.config;
    const config: CardConfig = zone && zone !== WHOLE_HOUSE ? { ...rest, zone: zone as string } : rest;
    this.config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  override render() {
    if (!this.hass || !this.config) return nothing;
    if ((this.snapshot?.zones.length ?? 0) < 2) {
      return html`<p>${this.t("card.whole_house_only")}</p>`;
    }
    return html`<ha-form
      .hass=${this.hass}
      .data=${{ zone: this.config.zone ?? WHOLE_HOUSE }}
      .schema=${this.schema()}
      .computeLabel=${this.label}
      @value-changed=${this.changed}
    ></ha-form>`;
  }
}

define("hs-card", HeatingSchedulerCard);
define("hs-card-editor", HeatingSchedulerCardEditor);
