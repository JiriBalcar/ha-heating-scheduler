import { LitElement, css, html, nothing } from "lit";
import { mdiChevronDown, mdiChevronUp, mdiDelete, mdiDotsVertical, mdiHomeImportOutline, mdiPencil, mdiPlus } from "@mdi/js";
import { showDialog } from "../ha";
import { languageOf, translator, type Translate } from "../i18n";
import { roomPayload, uniqueName } from "../payload";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { Candidates, HomeAssistant, RoomData, Snapshot } from "../types";
import { define } from "./define";
import { HsHaDialog, confirmDialog } from "./hs-dialog";
import { openRoomDialog } from "./hs-room-dialog";

/** Rooms: add (also from areas), change, reorder, delete. */
export class HsAdvRooms extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    candidates: { state: true },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare candidates: Candidates | null;
  declare busy: boolean;

  constructor() {
    super();
    this.candidates = null;
    this.busy = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2, 8px);
      }
      ha-card {
        overflow: hidden;
      }
      .empty {
        margin: 0;
        padding: var(--ha-space-4, 16px);
        color: var(--secondary-text-color);
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
    if (candidates) openRoomDialog(this, this.snapshot, candidates, room);
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

  private async openImport() {
    const candidates = await this.loadCandidates();
    if (!candidates) return;
    const areas = this.freeAreas();
    const chosen = await new Promise<string[]>((resolve) =>
      showDialog(this, "hs-import-rooms-dialog", { areas, resolve }),
    );
    if (chosen.length) await this.runImport(new Set(chosen));
  }

  /** Areas that still have valves not assigned to any room. */
  private freeAreas() {
    const owned = new Set(this.snapshot.rooms.flatMap((room) => room.trvs));
    return (this.candidates?.areas ?? [])
      .map((area) => ({ ...area, climates: area.climates.filter((id) => !owned.has(id)) }))
      .filter((area) => area.climates.length > 0);
  }

  private async runImport(chosen: Set<string>) {
    const store = storeFor(this.hass);
    let revision = this.snapshot.revision;
    const names = this.snapshot.rooms.map((room) => room.name);
    const owned = new Set(this.snapshot.rooms.flatMap((room) => room.trvs));
    this.busy = true;
    try {
      for (const area of this.freeAreas()) {
        if (!chosen.has(area.area_id)) continue;
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
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  private menu(room: RoomData, action: string) {
    if (action === "up") void this.move(room, -1);
    else if (action === "down") void this.move(room, 1);
    else if (action === "edit") void this.edit(room);
    else if (action === "delete") void this.deleteRoom(room);
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
      <div class="actions">
        <ha-button .disabled=${this.busy} @click=${() => this.edit(null)}>
          <ha-svg-icon slot="start" .path=${mdiPlus}></ha-svg-icon>${t("adv.rooms.add")}
        </ha-button>
        <ha-button appearance="plain" .disabled=${this.busy} @click=${this.openImport}>
          <ha-svg-icon slot="start" .path=${mdiHomeImportOutline}></ha-svg-icon>${t("adv.rooms.import")}
        </ha-button>
      </div>
      <ha-card>
        ${rooms.length === 0 ? html`<p class="empty">${t("adv.rooms.empty")}</p>` : nothing}
        ${rooms.map(
          (room, index) => html`<ha-md-list-item type="button" @click=${() => this.edit(room)}>
            <span slot="headline">${room.name}</span>
            <span slot="supporting-text">${t("adv.rooms.trvs")}: ${this.valveNames(room)}</span>
            <span slot="supporting-text">
              ${t("adv.rooms.plan")}: ${planName(room.plan_id)} · ${t("adv.rooms.temp_set")}: ${setName(room.temp_set_id)}
            </span>
            <ha-dropdown
              slot="end"
              @click=${(e: Event) => e.stopPropagation()}
              @wa-select=${(e: CustomEvent<{ item: { value: string } }>) => this.menu(room, e.detail.item.value)}
            >
              <ha-icon-button slot="trigger" .path=${mdiDotsVertical} .label=${room.name}></ha-icon-button>
              <ha-dropdown-item value="edit">
                <ha-svg-icon slot="icon" .path=${mdiPencil}></ha-svg-icon>${t("common.edit")}
              </ha-dropdown-item>
              <ha-dropdown-item value="up" .disabled=${this.busy || index === 0}>
                <ha-svg-icon slot="icon" .path=${mdiChevronUp}></ha-svg-icon>${t("adv.rooms.move_up")}
              </ha-dropdown-item>
              <ha-dropdown-item value="down" .disabled=${this.busy || index === rooms.length - 1}>
                <ha-svg-icon slot="icon" .path=${mdiChevronDown}></ha-svg-icon>${t("adv.rooms.move_down")}
              </ha-dropdown-item>
              <ha-dropdown-item value="delete" variant="danger" .disabled=${this.busy}>
                <ha-svg-icon slot="icon" .path=${mdiDelete}></ha-svg-icon>${t("common.delete")}
              </ha-dropdown-item>
            </ha-dropdown>
          </ha-md-list-item>`,
        )}
      </ha-card>
    `;
  }
}

define("hs-adv-rooms", HsAdvRooms);

interface ImportParams {
  areas: { area_id: string; name: string; climates: string[] }[];
  resolve: (areaIds: string[]) => void;
}

/** Choose the Home Assistant areas that become rooms. */
export class HsImportRoomsDialog extends HsHaDialog<ImportParams> {
  static override properties = {
    chosen: { state: true },
  };
  declare chosen: string[];
  private result: string[] = [];

  static override styles = css`
    p {
      margin-top: 0;
    }
  `;

  override showDialog(params: ImportParams): void {
    this.params?.resolve([]);
    this.chosen = params.areas.map((area) => area.area_id);
    this.result = [];
    super.showDialog(params);
  }

  protected override dialogClosed(): void {
    this.params?.resolve(this.result);
  }

  private add() {
    this.result = this.chosen;
    this.closeDialog();
  }

  override render() {
    if (!this.params) return nothing;
    const t = translator(languageOf(this.hass));
    const areas = this.params.areas;
    const schema = [
      {
        name: "areas",
        selector: {
          select: {
            multiple: true,
            mode: "list",
            options: areas.map((area) => ({
              value: area.area_id,
              label: `${area.name} (${area.climates.length})`,
            })),
          },
        },
      },
    ];
    return html`
      <ha-dialog .open=${this.open} header-title=${t("adv.rooms.import")} @closed=${this.onClosed}>
        ${areas.length
          ? html`<p>${t("adv.rooms.import_hint")}</p>
              <ha-form
                .hass=${this.hass}
                .data=${{ areas: this.chosen }}
                .schema=${schema}
                .computeLabel=${() => ""}
                @value-changed=${(e: CustomEvent<{ value: { areas?: string[] } }>) =>
                  (this.chosen = e.detail.value.areas ?? [])}
              ></ha-form>`
          : html`<p>${t("adv.rooms.import_none")}</p>`}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${this.chosen.length === 0} @click=${this.add}>
            ${t("adv.rooms.import_button")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-import-rooms-dialog", HsImportRoomsDialog);
