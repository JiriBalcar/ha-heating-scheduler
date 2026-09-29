// The sidebar panel: overview, plans and advanced settings.
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiCalendarClock, mdiMenu, mdiTuneVariant, mdiViewDashboard } from "@mdi/js";
import { define } from "./components/define";
import "./components/hs-advanced-view";
import "./components/hs-home-view";
import "./components/hs-icon";
import "./components/hs-plans-view";
import { languageOf, translator, type TextKey } from "./i18n";
import { storeFor } from "./store";
import { baseStyles } from "./styles";
import type { HomeAssistant, Snapshot } from "./types";

interface Route {
  prefix: string;
  path: string;
}

type Tab = "home" | "plans" | "advanced";

const TABS: { tab: Tab; path: string; icon: string; label: TextKey }[] = [
  { tab: "home", path: "", icon: mdiViewDashboard, label: "nav.home" },
  { tab: "plans", path: "/plans", icon: mdiCalendarClock, label: "nav.plans" },
  { tab: "advanced", path: "/advanced", icon: mdiTuneVariant, label: "nav.advanced" },
];

export class HeatingSchedulerPanel extends LitElement {
  static override properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    route: { attribute: false },
    panel: { attribute: false },
    snapshot: { state: true },
    waitedTooLong: { state: true },
    message: { state: true },
    tick: { state: true },
  };
  declare hass: HomeAssistant;
  declare narrow: boolean;
  declare route: Route;
  declare panel: unknown;
  declare snapshot: Snapshot | null;
  declare waitedTooLong: boolean;
  declare message: string;
  declare tick: number;

  private unsubscribe: (() => void) | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private clock: ReturnType<typeof setInterval> | null = null;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.snapshot = null;
    this.waitedTooLong = false;
    this.message = "";
    this.tick = 0;
    this.addEventListener("hs-toast", (event) => this.showMessage((event as CustomEvent<string>).detail));
    this.addEventListener("hs-navigate", (event) => this.navigate((event as CustomEvent<string>).detail));
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color, #fafafa);
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 64px;
        padding: 0 12px;
        background: var(--app-header-background-color, var(--primary-color, #1565c0));
        color: var(--app-header-text-color, var(--text-primary-color, #fff));
      }
      .toolbar h1 {
        margin: 0 0 0 8px;
        font-size: 24px;
        font-weight: 600;
      }
      .icon-button {
        width: 52px;
        height: 52px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        background: var(--card-background-color, #fff);
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        position: sticky;
        top: 0;
        z-index: 2;
      }
      nav button {
        min-height: 60px;
        border: none;
        border-bottom: 4px solid transparent;
        background: transparent;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--secondary-text-color, #5f6368);
      }
      nav button[aria-current="page"] {
        color: var(--primary-text-color, #212121);
        font-weight: 700;
        border-bottom-color: var(--primary-color, #1565c0);
      }
      main {
        max-width: 1280px;
        margin: 0 auto;
        padding: 16px 16px calc(96px + env(safe-area-inset-bottom, 0px));
      }
      .status {
        padding: 32px 16px;
        text-align: center;
        font-size: 18px;
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        transform: translateX(-50%);
        max-width: min(92vw, 560px);
        padding: 16px 20px;
        border-radius: 14px;
        background: #323232;
        color: #fff;
        font-size: 17px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
        z-index: 10;
      }
      @media (max-width: 420px) {
        nav button {
          flex-direction: column;
          gap: 2px;
          font-size: 14px;
        }
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

  private showMessage(text: string) {
    this.message = text;
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => (this.message = ""), 6000);
  }

  private navigate(path: string) {
    const prefix = this.route?.prefix ?? "/heating-scheduler";
    history.pushState(null, "", `${prefix}${path}`);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  private toggleMenu() {
    this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  private get path(): string {
    return this.route?.path ?? "";
  }

  private get tab(): Tab {
    if (this.path.startsWith("/plans")) return "plans";
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
      case "advanced":
        return html`<hs-advanced-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .section=${parts[1] ?? "rooms"}
        ></hs-advanced-view>`;
      default:
        return html`<hs-home-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-home-view>`;
    }
  }

  override render() {
    if (!this.hass) return nothing;
    const t = translator(languageOf(this.hass));
    const tab = this.tab;
    return html`
      <header class="toolbar">
        ${this.narrow
          ? html`<button class="icon-button" @click=${this.toggleMenu} aria-label=${t("nav.menu")}>
              <hs-icon .path=${mdiMenu}></hs-icon>
            </button>`
          : nothing}
        <h1>${t("app.title")}</h1>
      </header>
      <nav>
        ${TABS.map(
          (item) => html`<button
            aria-current=${item.tab === tab ? "page" : "false"}
            @click=${() => this.navigate(item.path)}
          >
            <hs-icon .path=${item.icon}></hs-icon>${t(item.label)}
          </button>`,
        )}
      </nav>
      <main data-tick=${this.tick}>${this.view()}</main>
      ${this.message ? html`<div class="toast" role="alert">${this.message}</div>` : nothing}
    `;
  }
}

define("heating-scheduler-panel", HeatingSchedulerPanel);
