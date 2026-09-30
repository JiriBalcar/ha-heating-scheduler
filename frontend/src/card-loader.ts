// The Lovelace card as HA loads it on start: a small wrapper that shows <hs-card> from the main
// bundle (the one the sidebar panel uses).
//
// HA's service worker can serve an old page, and so an old URL of this file, for a while after an
// update. The main bundle's URL comes from HA's live panel list instead, so the card and the panel
// always run the same code, and this file stays small and rarely changes.
import { define } from "./components/define";
import type { CardConfig, HomeAssistant } from "./types";

const PANEL = "heating-scheduler";
const BUNDLE = "heating-scheduler-panel.js";
const TEXTS = {
  cs: { name: "Topení", description: "Místnosti a režim domu z plánovače topení." },
  en: { name: "Heating", description: "Rooms and house mode of the heating scheduler." },
};

interface InnerCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: CardConfig): void;
  getCardSize?(): number | Promise<number>;
}

function bundleUrl(hass?: HomeAssistant): string {
  const root = document.querySelector("home-assistant") as { hass?: HomeAssistant } | null;
  const url = (hass ?? root?.hass)?.panels?.[PANEL]?.config?._panel_custom?.module_url;
  return url ?? new URL(BUNDLE, import.meta.url).href;
}

let loading: Promise<unknown> | null = null;

/** Load the main bundle once; it defines <hs-card> and <hs-card-editor>. */
function loadBundle(hass?: HomeAssistant): Promise<unknown> {
  loading ??= import(/* @vite-ignore */ bundleUrl(hass)).then(() =>
    customElements.whenDefined("hs-card"),
  );
  loading.catch(() => (loading = null));
  return loading;
}

class HeatingSchedulerCardLoader extends HTMLElement {
  private config?: CardConfig;
  private hassValue?: HomeAssistant;
  private inner?: InnerCard;
  private creating = false;

  setConfig(config: CardConfig): void {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    if (config.room !== undefined && typeof config.room !== "string") {
      throw new Error("room must be a room id");
    }
    this.config = config;
    this.inner?.setConfig(config);
  }

  set hass(hass: HomeAssistant) {
    this.hassValue = hass;
    if (this.inner) this.inner.hass = hass;
    else void this.create();
  }

  get hass(): HomeAssistant | undefined {
    return this.hassValue;
  }

  private async create() {
    if (this.creating) return;
    this.creating = true;
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    try {
      await loadBundle(this.hassValue);
    } catch (error) {
      root.textContent = `Heating Scheduler: ${String(error)}`;
      this.creating = false;
      return;
    }
    const inner = document.createElement("hs-card") as InnerCard;
    if (this.config) inner.setConfig(this.config);
    inner.hass = this.hassValue;
    this.inner = inner;
    root.replaceChildren(inner);
  }

  connectedCallback(): void {
    this.style.display = "block";
  }

  getCardSize(): number | Promise<number> {
    if (this.inner?.getCardSize) return this.inner.getCardSize();
    return this.config?.room ? 3 : 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  static async getConfigElement(): Promise<HTMLElement> {
    await loadBundle();
    return document.createElement("hs-card-editor");
  }

  static getStubConfig(): Partial<CardConfig> {
    return { show_house: true };
  }
}

define("heating-scheduler-card", HeatingSchedulerCardLoader);

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

const texts = TEXTS[(document.documentElement.lang || navigator.language).startsWith("en") ? "en" : "cs"];
window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === "heating-scheduler-card")) {
  window.customCards.push({ type: "heating-scheduler-card", ...texts, preview: true });
}
