import { css, html, nothing } from "lit";
import { formatContext, formatDateTime } from "../format";
import { fire, showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import type { RoomData } from "../types";
import { define } from "./define";
import { HsHaDialog } from "./hs-dialog";

interface ProblemParams {
  room: RoomData;
}

/** What is wrong with the valves of a room. */
export class HsProblemDialog extends HsHaDialog<ProblemParams> {
  static override styles = css`
    ha-alert {
      display: block;
      margin-bottom: var(--ha-space-3, 12px);
    }
    .since {
      display: block;
      color: var(--secondary-text-color);
    }
    p {
      margin: var(--ha-space-2, 8px) 0 0;
      color: var(--secondary-text-color);
    }
  `;

  private async retry() {
    const t = translator(languageOf(this.hass));
    try {
      await storeFor(this.hass).call("reconcile");
      this.closeDialog();
    } catch (error) {
      toast(this, errorText(error, t));
    }
  }

  private valveName(entityId: string): string {
    const name = this.hass.states[entityId]?.attributes.friendly_name;
    return typeof name === "string" ? name : entityId;
  }

  override render() {
    const room = this.params?.room;
    if (!room || !this.hass) return nothing;
    const lang = languageOf(this.hass);
    const t = translator(lang);
    const ctx = formatContext(this.hass, lang);
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${t("health.title", { room: room.name })}
        @closed=${this.onClosed}
      >
        ${room.issues.map(
          (issue) => html`<ha-alert alert-type="warning">
            ${t(`health.${issue.kind}`, { name: this.valveName(issue.entity_id) })}
            ${issue.since
              ? html`<span class="since">${t("health.since", { time: formatDateTime(issue.since, ctx) })}</span>`
              : nothing}
            <ha-button
              slot="action"
              appearance="plain"
              size="small"
              @click=${() => fire(this, "hass-more-info", { entityId: issue.entity_id })}
            >
              ${t("health.valve")}
            </ha-button>
          </ha-alert>`,
        )}
        <p>${t("health.details")}</p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.close")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${this.retry}>${t("health.retry")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-problem-dialog", HsProblemDialog);

export function openProblemDialog(host: HTMLElement, room: RoomData): void {
  showDialog(host, "hs-problem-dialog", { room });
}
