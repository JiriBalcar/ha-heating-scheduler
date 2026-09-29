import { LitElement, css, html, nothing } from "lit";
import { languageOf, translator } from "../i18n";
import { roomPayload } from "../payload";
import { errorText, storeFor } from "../store";
import { baseStyles } from "../styles";
import type { Candidates, HomeAssistant, RoomData, Snapshot } from "../types";
import { define } from "./define";
import type { HsDialog } from "./hs-dialog";
import "./hs-dialog";

/** Create or change a room: name, valves, shown temperature, plan, temperatures. */
export class HsRoomDialog extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    candidates: { attribute: false },
    room: { attribute: false },
    name: { state: true },
    trvs: { state: true },
    sensor: { state: true },
    planId: { state: true },
    setId: { state: true },
    error: { state: true },
    saving: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare candidates: Candidates;
  declare room: RoomData | null;
  declare name: string;
  declare trvs: string[];
  declare sensor: string;
  declare planId: string;
  declare setId: string;
  declare error: string;
  declare saving: boolean;

  static override styles = [
    baseStyles,
    css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .valves {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 320px;
        overflow-y: auto;
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 12px;
        padding: 6px;
      }
      .valve {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        padding: 0 8px;
        border-radius: 10px;
        font-size: 17px;
      }
      .valve.taken {
        opacity: 0.55;
      }
      .valve input {
        width: 26px;
        height: 26px;
        accent-color: var(--hs-accent, #1565c0);
        flex: none;
      }
      .valve small {
        display: block;
        font-size: 14px;
      }
      .hint {
        font-size: 14px;
      }
      .error {
        color: var(--error-color, #c62828);
        font-weight: 600;
        margin: 0;
      }
    `,
  ];

  get dialog(): HsDialog | null {
    return this.renderRoot.querySelector("hs-dialog");
  }

  prepare(): void {
    const room = this.room;
    this.name = room?.name ?? "";
    this.trvs = [...(room?.trvs ?? [])];
    this.sensor = room?.temperature_entity ?? "";
    this.planId = room?.plan_id ?? "house";
    this.setId = room?.temp_set_id ?? "house";
    this.error = "";
    this.saving = false;
  }

  private toggle(entityId: string, on: boolean) {
    this.trvs = on ? [...this.trvs, entityId] : this.trvs.filter((id) => id !== entityId);
  }

  private async save() {
    const t = translator(languageOf(this.hass));
    this.saving = true;
    this.error = "";
    const base: RoomData = this.room ?? {
      id: "",
      name: "",
      trvs: [],
      plan_id: "house",
      temp_set_id: "house",
      temperature_entity: null,
      area_id: null,
      current_temperature: null,
      target: null,
      override: null,
      issues: [],
      trv_status: [],
    };
    const payload = roomPayload(base, {
      name: this.name.trim(),
      trvs: this.trvs,
      temperature_entity: this.sensor || null,
      plan_id: this.planId,
      temp_set_id: this.setId,
    });
    try {
      await storeFor(this.hass).call("room/save", {
        revision: this.snapshot.revision,
        room: { ...payload, id: this.room ? payload.id : null },
      });
      this.dialog?.close();
    } catch (error) {
      this.error = errorText(error, t);
    } finally {
      this.saving = false;
    }
  }

  override render() {
    if (!this.hass || !this.snapshot || !this.candidates) return nothing;
    const t = translator(languageOf(this.hass));
    const roomName = (id: string | null) => this.snapshot.rooms.find((room) => room.id === id)?.name ?? "";
    return html`
      <hs-dialog
        wide
        .heading=${this.room ? t("adv.rooms.edit_title") : t("adv.rooms.new_title")}
        .closeLabel=${t("common.cancel")}
      >
        <div class="form">
          <label class="field">
            <span>${t("adv.rooms.name")}</span>
            <input
              class="input"
              maxlength="60"
              .value=${this.name}
              @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="field">
            <span>${t("adv.rooms.trvs")}</span>
            ${this.candidates.climates.length === 0
              ? html`<span class="muted">${t("adv.rooms.no_climates")}</span>`
              : html`<div class="valves">
                  ${this.candidates.climates.map((climate) => {
                    const takenBy = climate.room_id && climate.room_id !== this.room?.id ? climate.room_id : null;
                    return html`<label class="valve ${takenBy ? "taken" : ""}">
                      <input
                        type="checkbox"
                        .checked=${this.trvs.includes(climate.entity_id)}
                        ?disabled=${takenBy !== null}
                        @change=${(e: Event) => this.toggle(climate.entity_id, (e.target as HTMLInputElement).checked)}
                      />
                      <span>
                        ${climate.name}
                        <small class="muted">
                          ${climate.entity_id}${takenBy ? ` · ${t("adv.rooms.in_room", { room: roomName(takenBy) })}` : ""}
                        </small>
                      </span>
                    </label>`;
                  })}
                </div>`}
          </div>
          <label class="field">
            <span>${t("adv.rooms.temperature_entity")}</span>
            <select class="input" @change=${(e: Event) => (this.sensor = (e.target as HTMLSelectElement).value)}>
              <option value="" ?selected=${!this.sensor}>${t("adv.rooms.temperature_auto")}</option>
              ${this.candidates.temperature_entities.map(
                (sensor) => html`<option value=${sensor.entity_id} ?selected=${sensor.entity_id === this.sensor}>
                  ${sensor.name}
                </option>`,
              )}
              ${this.candidates.climates.map(
                (climate) => html`<option value=${climate.entity_id} ?selected=${climate.entity_id === this.sensor}>
                  ${climate.name}
                </option>`,
              )}
            </select>
            <span class="hint muted">${t("adv.rooms.sensor_hint")}</span>
          </label>
          <label class="field">
            <span>${t("adv.rooms.plan")}</span>
            <select class="input" @change=${(e: Event) => (this.planId = (e.target as HTMLSelectElement).value)}>
              ${this.snapshot.plans.map(
                (plan) => html`<option value=${plan.id} ?selected=${plan.id === this.planId}>${plan.name}</option>`,
              )}
            </select>
          </label>
          <label class="field">
            <span>${t("adv.rooms.temp_set")}</span>
            <select class="input" @change=${(e: Event) => (this.setId = (e.target as HTMLSelectElement).value)}>
              ${this.snapshot.temp_sets.map(
                (set) => html`<option value=${set.id} ?selected=${set.id === this.setId}>${set.name}</option>`,
              )}
            </select>
          </label>
          ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
        </div>
        <button slot="actions" class="btn" @click=${() => this.dialog?.close()}>${t("common.cancel")}</button>
        <button
          slot="actions"
          class="btn primary"
          ?disabled=${this.saving || !this.name.trim()}
          @click=${this.save}
        >
          ${t("common.save")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-room-dialog", HsRoomDialog);

export async function openRoomDialog(
  host: HTMLElement,
  hass: HomeAssistant,
  snapshot: Snapshot,
  candidates: Candidates,
  room: RoomData | null,
): Promise<void> {
  const element = document.createElement("hs-room-dialog") as HsRoomDialog;
  element.hass = hass;
  element.snapshot = snapshot;
  element.candidates = candidates;
  element.room = room;
  element.prepare();
  (host.shadowRoot ?? host).appendChild(element);
  await element.updateComplete;
  const dialog = element.dialog;
  if (!dialog) return;
  dialog.addEventListener("hs-closed", () => element.remove(), { once: true });
  await dialog.show();
}
