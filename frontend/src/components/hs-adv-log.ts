import { LitElement, css, html, nothing } from "lit";
import { mdiRefresh } from "@mdi/js";
import { formatContext, formatDateTime, formatTemp } from "../format";
import { ALL_KEYS, languageOf, translator, type TextKey, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, LogEntryData, Snapshot } from "../types";
import { define } from "./define";
import "./hs-icon";

/** Recent writes, confirmations and manual changes of one room. */
export class HsAdvLog extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    roomId: { state: true },
    entries: { state: true },
    loading: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare roomId: string;
  declare entries: LogEntryData[];
  declare loading: boolean;

  constructor() {
    super();
    this.roomId = "";
    this.entries = [];
    this.loading = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .top {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .top .field {
        flex: 1 1 220px;
      }
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      li {
        display: grid;
        grid-template-columns: minmax(130px, auto) 1fr;
        gap: 4px 14px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        font-size: 16px;
      }
      li:last-child {
        border-bottom: none;
      }
      .what {
        font-weight: 700;
      }
      .detail {
        grid-column: 2;
        font-size: 14px;
      }
      @media (max-width: 480px) {
        li {
          grid-template-columns: 1fr;
        }
        .detail {
          grid-column: 1;
        }
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.roomId && this.snapshot?.rooms.length) {
      this.roomId = this.snapshot.rooms[0]!.id;
      void this.load();
    }
  }

  private async load() {
    if (!this.roomId) return;
    this.loading = true;
    try {
      const result = await storeFor(this.hass).call<{ entries: LogEntryData[] }>("log", { room_id: this.roomId });
      this.entries = result.entries;
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.loading = false;
    }
  }

  private label(kind: string): string {
    const key = `log.${kind}` as TextKey;
    return ALL_KEYS.includes(key) ? this.t(key) : kind;
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const name = (id: string | null) => {
      if (!id) return "";
      const friendly = this.hass.states[id]?.attributes.friendly_name;
      return typeof friendly === "string" ? friendly : id;
    };
    return html`
      <div class="top">
        <label class="field">
          <span>${t("adv.log.room")}</span>
          <select
            class="input"
            @change=${(e: Event) => {
              this.roomId = (e.target as HTMLSelectElement).value;
              void this.load();
            }}
          >
            ${this.snapshot.rooms.map(
              (room) => html`<option value=${room.id} ?selected=${room.id === this.roomId}>${room.name}</option>`,
            )}
          </select>
        </label>
        <button class="btn" ?disabled=${this.loading} @click=${this.load}>
          <hs-icon .path=${mdiRefresh}></hs-icon>${t("adv.log.refresh")}
        </button>
      </div>
      ${this.entries.length === 0
        ? html`<p class="muted">${t("adv.log.empty")}</p>`
        : html`<ol class="card">
            ${this.entries.map(
              (entry) => html`<li>
                <span class="muted">${formatDateTime(entry.at, ctx)}</span>
                <span>
                  <span class="what">${this.label(entry.kind)}</span>
                  ${entry.value !== null ? html` · ${formatTemp(entry.value, ctx)}` : nothing}
                  ${entry.hvac_mode ? html` · ${entry.hvac_mode}` : nothing}
                  ${entry.entity_id ? html` · ${name(entry.entity_id)}` : nothing}
                </span>
                ${entry.mode || entry.detail
                  ? html`<span class="detail muted">
                      ${entry.mode ? t(`mode.${entry.mode}` as TextKey) : ""}${entry.mode && entry.detail ? " · " : ""}${entry.detail ?? ""}
                    </span>`
                  : nothing}
              </li>`,
            )}
          </ol>`}
    `;
  }
}

define("hs-adv-log", HsAdvLog);
