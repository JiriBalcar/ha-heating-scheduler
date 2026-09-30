// The sidebar panel: overview, plans, temperatures and advanced settings in HA's page layout with tabs.
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiCalendarClock, mdiThermometer, mdiTuneVariant, mdiViewDashboard } from "@mdi/js";
import "./card";
// HA loads the card loader only when the page loads. A page opened before the integration was
// installed (the phone app can keep one open for days) has no dashboard card until it reloads.
// The panel defines the card too, so opening the panel once brings the cards back.
import "./card-loader";
import { define } from "./components/define";
import "./components/hs-advanced-view";
import "./components/hs-home-view";
import "./components/hs-plans-view";
import "./components/hs-temps-view";
import { HA_ELEMENTS, whenDefined } from "./ha";
import { languageOf, translator } from "./i18n";
import { storeFor } from "./store";
import { baseStyles } from "./styles";
import type { HomeAssistant, Snapshot } from "./types";

interface Route {
  prefix: string;
  path: string;
}

type Tab = "home" | "plans" | "temperatures" | "advanced";

export class HeatingSchedulerPanel extends LitElement {
  static override properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    route: { attribute: false },
    panel: { attribute: false },
    snapshot: { state: true },
    waitedTooLong: { state: true },
    ready: { state: true },
    tick: { state: true },
  };
  declare hass: HomeAssistant;
  declare narrow: boolean;
  declare route: Route;
  declare panel: unknown;
  declare snapshot: Snapshot | null;
  declare waitedTooLong: boolean;
  declare ready: boolean;
  declare tick: number;

  private unsubscribe: (() => void) | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private clock: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.snapshot = null;
    this.waitedTooLong = false;
    this.ready = false;
    this.tick = 0;
    this.addEventListener("hs-navigate", (event) => this.navigate((event as CustomEvent<string>).detail));
    void whenDefined(HA_ELEMENTS).then((missing) => {
      if (missing.length) console.warn(`Heating Scheduler: Home Assistant did not load ${missing.join(", ")}`);
      this.ready = true;
    });
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .content {
        max-width: 1280px;
        margin: 0 auto;
        padding: var(--ha-space-4, 16px);
        box-sizing: border-box;
      }
      .status {
        padding: var(--ha-space-8, 32px) var(--ha-space-4, 16px);
        text-align: center;
        color: var(--secondary-text-color);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this.clock = setInterval(() => (this.tick += 1), 30000);
    if (this.hass) this.subscribe();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.clock) clearInterval(this.clock);
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass") && this.hass && !this.unsubscribe && this.isConnected) this.subscribe();
  }

  private subscribe() {
    this.unsubscribe = storeFor(this.hass).subscribe((snapshot) => {
      this.snapshot = snapshot;
    });
    this.timers.push(setTimeout(() => (this.waitedTooLong = this.snapshot === null), 8000));
  }

  private get urlPrefix(): string {
    return this.route?.prefix ?? "/heating-scheduler";
  }

  private navigate(path: string) {
    history.pushState(null, "", `${this.urlPrefix}${path}`);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  private get path(): string {
    return this.route?.path ?? "";
  }

  private get tab(): Tab {
    if (this.path.startsWith("/plans")) return "plans";
    if (this.path.startsWith("/temperatures")) return "temperatures";
    if (this.path.startsWith("/advanced")) return "advanced";
    return "home";
  }

  private view() {
    const t = translator(languageOf(this.hass));
    if (!this.snapshot) {
      return html`<div class="status">${this.waitedTooLong ? t("common.not_loaded") : t("common.loading")}</div>`;
    }
    const parts = this.path.split("/").filter(Boolean);
    switch (this.tab) {
      case "plans":
        return html`<hs-plans-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .planId=${parts[1] ?? null}
        ></hs-plans-view>`;
      case "temperatures":
        return html`<hs-temps-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-temps-view>`;
      case "advanced":
        return html`<hs-advanced-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .section=${parts[1] ?? ""}
        ></hs-advanced-view>`;
      default:
        return html`<hs-home-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-home-view>`;
    }
  }

  override render() {
    if (!this.hass || !this.ready) return nothing;
    const t = translator(languageOf(this.hass));
    const prefix = this.urlPrefix;
    const tabs = [
      { path: `${prefix}/overview`, name: t("nav.home"), iconPath: mdiViewDashboard },
      { path: `${prefix}/plans`, name: t("nav.plans"), iconPath: mdiCalendarClock },
      { path: `${prefix}/temperatures`, name: t("nav.temps"), iconPath: mdiThermometer },
      { path: `${prefix}/advanced`, name: t("nav.advanced"), iconPath: mdiTuneVariant },
    ];
    // The panel's own URL shows the overview.
    const route = { prefix, path: this.tab === "home" ? "/overview" : this.path };
    return html`
      <hass-tabs-subpage .hass=${this.hass} .route=${route} .tabs=${tabs} main-page>
        <span slot="header">${t("app.title")}</span>
        <div class="content" data-tick=${this.tick}>${this.view()}</div>
      </hass-tabs-subpage>
    `;
  }
}

define("heating-scheduler-panel", HeatingSchedulerPanel);
