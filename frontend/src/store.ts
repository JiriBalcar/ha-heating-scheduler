// One websocket subscription per connection, shared by the panel and every card.
import type { Translate, TextKey } from "./i18n";
import { ALL_KEYS } from "./i18n";
import type { Connection, HomeAssistant, Snapshot } from "./types";

type Listener = (snapshot: Snapshot | null) => void;

export class HeatingStore {
  snapshot: Snapshot | null = null;
  private hass: HomeAssistant;
  private listeners = new Set<Listener>();
  private unsubscribe: Promise<() => Promise<void>> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
  }

  setHass(hass: HomeAssistant): void {
    this.hass = hass;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.start();
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private start(): void {
    this.unsubscribe = this.hass.connection.subscribeMessage<Snapshot>(
      (snapshot) => {
        this.snapshot = snapshot;
        for (const listener of this.listeners) listener(snapshot);
      },
      { type: "heating_scheduler/subscribe" },
    );
    this.unsubscribe.catch(() => {
      // The integration is not loaded yet: try again later.
      this.unsubscribe = null;
      this.retry = setTimeout(() => {
        this.retry = null;
        if (this.listeners.size) this.start();
      }, 10000);
    });
  }

  private stop(): void {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const pending = this.unsubscribe;
    this.unsubscribe = null;
    pending?.then((unsub) => unsub()).catch(() => undefined);
  }

  /** Call a websocket command of the integration. */
  call<T = unknown>(command: string, data: Record<string, unknown> = {}): Promise<T> {
    return this.hass.callWS<T>({ type: `heating_scheduler/${command}`, ...data });
  }
}

const stores = new WeakMap<Connection, HeatingStore>();

export function storeFor(hass: HomeAssistant): HeatingStore {
  let store = stores.get(hass.connection);
  if (!store) {
    store = new HeatingStore(hass);
    stores.set(hass.connection, store);
  }
  store.setHass(hass);
  return store;
}

/** A translated message for a websocket error. */
export function errorText(error: unknown, t: Translate): string {
  const code = (error as { code?: string } | null)?.code;
  const key = `error.${code}` as TextKey;
  if (code && ALL_KEYS.includes(key)) return t(key);
  const message = (error as { message?: string } | null)?.message ?? String(error);
  return t("error.unknown", { message });
}

/** Tell the page to show a short message. */
export function toast(from: HTMLElement, message: string): void {
  from.dispatchEvent(new CustomEvent("hs-toast", { detail: message, bubbles: true, composed: true }));
}
