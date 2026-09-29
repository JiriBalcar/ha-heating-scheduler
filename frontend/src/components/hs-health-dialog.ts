import { LitElement, css, html } from "lit";
import { mdiAlertCircle, mdiRefresh } from "@mdi/js";
import { formatContext, formatDateTime } from "../format";
import { languageOf, translator } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, RoomData } from "../types";
import { define } from "./define";
import type { HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";

/** Plain-language explanation of a room's health issues. */
export class HsHealthDialog extends LitElement {
  static override properties = {
    hass: { attribute: false },
    room: { attribute: false },
  };
  declare hass: HomeAssistant;
  declare room: RoomData;

  static override styles = [
    baseStyles,
    css`
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      li {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      li hs-icon {
        color: var(--warning-color, #e65100);
        --hs-icon-size: 28px;
      }
      .since {
        display: block;
        font-size: 15px;
      }
      .details {
        margin: 18px 0 0;
        font-size: 15px;
      }
    `,
  ];

  get dialog(): HsDialog | null {
    return this.renderRoot.querySelector("hs-dialog");
  }

  private async retry() {
    const t = translator(languageOf(this.hass));
    try {
      await storeFor(this.hass).call("reconcile");
      this.dialog?.close();
    } catch (error) {
      toast(this, errorText(error, t));
    }
  }

  private valveName(entityId: string): string {
    const state = this.hass.states[entityId];
    const name = state?.attributes.friendly_name;
    return typeof name === "string" ? name : entityId;
  }

  override render() {
    const lang = languageOf(this.hass);
    const t = translator(lang);
    const ctx = formatContext(this.hass, lang);
    return html`
      <hs-dialog .heading=${t("health.title", { room: this.room.name })} .closeLabel=${t("common.close")}>
        <ul>
          ${this.room.issues.map(
            (issue) => html`<li>
              <hs-icon .path=${mdiAlertCircle}></hs-icon>
              <span>
                ${t(`health.${issue.kind}`, { name: this.valveName(issue.entity_id) })}
                ${issue.since
                  ? html`<span class="since muted">
                      ${t("health.since", { time: formatDateTime(issue.since, ctx) })}
                    </span>`
                  : ""}
              </span>
            </li>`,
          )}
        </ul>
        <p class="details muted">${t("health.details")}</p>
        <button slot="actions" class="btn" @click=${() => this.dialog?.close()}>
          ${t("common.close")}
        </button>
        <button slot="actions" class="btn primary" @click=${this.retry}>
          <hs-icon .path=${mdiRefresh}></hs-icon>${t("health.retry")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-health-dialog", HsHealthDialog);

export async function openHealthDialog(host: HTMLElement, hass: HomeAssistant, room: RoomData) {
  const element = document.createElement("hs-health-dialog") as HsHealthDialog;
  element.hass = hass;
  element.room = room;
  (host.shadowRoot ?? host).appendChild(element);
  await element.updateComplete;
  const dialog = element.dialog;
  if (!dialog) return;
  dialog.addEventListener("hs-closed", () => element.remove(), { once: true });
  await dialog.show();
}
