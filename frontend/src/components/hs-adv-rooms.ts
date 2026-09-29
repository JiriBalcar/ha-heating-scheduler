import { LitElement, css, html, nothing } from "lit";
import { mdiChevronDown, mdiChevronUp, mdiDelete, mdiHomeImportOutline, mdiPencil, mdiPlusCircle } from "@mdi/js";
import { languageOf, translator, type Translate } from "../i18n";
import { roomPayload, uniqueName } from "../payload";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { Candidates, HomeAssistant, RoomData, Snapshot } from "../types";
import { define } from "./define";
import { confirmDialog, type HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";
import { openRoomDialog } from "./hs-room-dialog";

/** Rooms: add (also from areas), change, reorder, delete. */
export class HsAdvRooms extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    candidates: { state: true },
    importChoice: { state: true },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare candidates: Candidates | null;
  declare importChoice: Set<string>;
  declare busy: boolean;

  constructor() {
    super();
    this.candidates = null;
    this.importChoice = new Set();
    this.busy = false;
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
        flex-wrap: wrap;
        gap: 10px;
      }
      .top .btn {
        flex: 1 1 240px;
      }
      .room {
        padding: 14px 16px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        align-items: start;
      }
      .room h3 {
        font-size: 20px;
      }
      .details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 16px;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }
      .icon {
        width: 52px;
        padding: 0;
      }
      .areas {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .area {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        font-size: 18px;
      }
      .area input {
        width: 26px;
        height: 26px;
        accent-color: var(--hs-accent, #1565c0);
      }
      .area small {
        display: block;
        font-size: 14px;
      }
      @media (max-width: 520px) {
        .room {
          grid-template-columns: 1fr;
        }
        .buttons {
          justify-content: flex-start;
        }
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  private async loadCandidates(): Promise<Candidates | null> {
    try {
      this.candidates = await storeFor(this.hass).call<Candidates>("candidates");
      return this.candidates;
    } catch (error) {
      toast(this, errorText(error, this.t));
      return null;
    }
  }

  private async edit(room: RoomData | null) {
    const candidates = await this.loadCandidates();
    if (candidates) await openRoomDialog(this, this.hass, this.snapshot, candidates, room);
  }

  private async move(room: RoomData, delta: number) {
    const order = this.snapshot.rooms.map((item) => item.id);
    const index = order.indexOf(room.id);
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target]!, order[index]!];
    await this.call("rooms/reorder", { revision: this.snapshot.revision, order });
  }

  private async deleteRoom(room: RoomData) {
    const t = this.t;
    const ok = await confirmDialog(this, {
      heading: t("common.delete"),
      message: t("adv.rooms.delete_confirm", { name: room.name }),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (ok) await this.call("room/delete", { revision: this.snapshot.revision, room_id: room.id });
  }

  private async call(command: string, data: Record<string, unknown>) {
    this.busy = true;
    try {
      await storeFor(this.hass).call(command, data);
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  private importDialog(): HsDialog | null {
    return this.renderRoot.querySelector("#import");
  }

  private async openImport() {
    const candidates = await this.loadCandidates();
    if (!candidates) return;
    this.importChoice = new Set(this.freeAreas().map((area) => area.area_id));
    await this.importDialog()?.show();
  }

  /** Areas that still have valves not assigned to any room. */
  private freeAreas() {
    const owned = new Set(this.snapshot.rooms.flatMap((room) => room.trvs));
    return (this.candidates?.areas ?? [])
      .map((area) => ({ ...area, climates: area.climates.filter((id) => !owned.has(id)) }))
      .filter((area) => area.climates.length > 0);
  }

  private async runImport() {
    const store = storeFor(this.hass);
    let revision = this.snapshot.revision;
    const names = this.snapshot.rooms.map((room) => room.name);
    const owned = new Set(this.snapshot.rooms.flatMap((room) => room.trvs));
    this.busy = true;
    try {
      for (const area of this.freeAreas()) {
        if (!this.importChoice.has(area.area_id)) continue;
        const name = uniqueName(area.name, names);
        names.push(name);
        const trvs = area.climates.filter((id) => !owned.has(id));
        const room = roomPayload(
          {
            id: "",
            name,
            trvs,
            plan_id: "house",
            temp_set_id: "house",
            temperature_entity: area.temperature_entity,
            area_id: area.area_id,
          } as RoomData,
          {},
        );
        const result = await store.call<{ revision: number }>("room/save", {
          revision,
          room: { ...room, id: null },
        });
        revision = result.revision;
      }
      this.importDialog()?.close();
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  private valveNames(room: RoomData): string {
    if (!room.trvs.length) return this.t("adv.rooms.none_trvs");
    return room.trvs
      .map((id) => {
        const name = this.hass.states[id]?.attributes.friendly_name;
        return typeof name === "string" ? name : id;
      })
      .join(", ");
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const planName = (id: string) => this.snapshot.plans.find((plan) => plan.id === id)?.name ?? id;
    const setName = (id: string) => this.snapshot.temp_sets.find((set) => set.id === id)?.name ?? id;
    const rooms = this.snapshot.rooms;
    return html`
      <div class="top">
        <button class="btn primary" ?disabled=${this.busy} @click=${() => this.edit(null)}>
          <hs-icon .path=${mdiPlusCircle}></hs-icon>${t("adv.rooms.add")}
        </button>
        <button class="btn" ?disabled=${this.busy} @click=${this.openImport}>
          <hs-icon .path=${mdiHomeImportOutline}></hs-icon>${t("adv.rooms.import")}
        </button>
      </div>
      ${rooms.length === 0 ? html`<p class="muted">${t("adv.rooms.empty")}</p>` : nothing}
      ${rooms.map(
        (room, index) => html`<article class="card room">
          <div class="details">
            <h3>${room.name}</h3>
            <span>${t("adv.rooms.trvs")}: ${this.valveNames(room)}</span>
            <span class="muted">${t("adv.rooms.plan")}: ${planName(room.plan_id)}</span>
            <span class="muted">${t("adv.rooms.temp_set")}: ${setName(room.temp_set_id)}</span>
          </div>
          <div class="buttons">
            <button class="btn icon" ?disabled=${this.busy || index === 0} @click=${() => this.move(room, -1)} aria-label=${t("adv.rooms.move_up")}>
              <hs-icon .path=${mdiChevronUp}></hs-icon>
            </button>
            <button
              class="btn icon"
              ?disabled=${this.busy || index === rooms.length - 1}
              @click=${() => this.move(room, 1)}
              aria-label=${t("adv.rooms.move_down")}
            >
              <hs-icon .path=${mdiChevronDown}></hs-icon>
            </button>
            <button class="btn" ?disabled=${this.busy} @click=${() => this.edit(room)}>
              <hs-icon .path=${mdiPencil}></hs-icon>${t("common.edit")}
            </button>
            <button class="btn danger icon" ?disabled=${this.busy} @click=${() => this.deleteRoom(room)} aria-label=${t("common.delete")}>
              <hs-icon .path=${mdiDelete}></hs-icon>
            </button>
          </div>
        </article>`,
      )}
      <hs-dialog id="import" .heading=${t("adv.rooms.import")} .closeLabel=${t("common.cancel")}>
        ${this.freeAreas().length
          ? html`<p>${t("adv.rooms.import_hint")}</p>
              <div class="areas">
                ${this.freeAreas().map(
                  (area) => html`<label class="area">
                    <input
                      type="checkbox"
                      .checked=${this.importChoice.has(area.area_id)}
                      @change=${(e: Event) => {
                        const next = new Set(this.importChoice);
                        if ((e.target as HTMLInputElement).checked) next.add(area.area_id);
                        else next.delete(area.area_id);
                        this.importChoice = next;
                      }}
                    />
                    <span>
                      ${area.name}
                      <small class="muted">${area.climates.join(", ")}</small>
                    </span>
                  </label>`,
                )}
              </div>`
          : html`<p>${t("adv.rooms.import_none")}</p>`}
        <button slot="actions" class="btn" @click=${() => this.importDialog()?.close()}>${t("common.cancel")}</button>
        <button
          slot="actions"
          class="btn primary"
          ?disabled=${this.busy || this.importChoice.size === 0}
          @click=${this.runImport}
        >
          ${t("adv.rooms.import_button")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-adv-rooms", HsAdvRooms);
