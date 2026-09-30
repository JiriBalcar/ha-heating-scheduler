import { LitElement, css, html, nothing } from "lit";
import { mdiChevronDown, mdiChevronUp, mdiDelete, mdiDotsVertical, mdiHomeFloor1, mdiPencil, mdiPlus } from "@mdi/js";
import { languageOf, translator, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { Candidates, HomeAssistant, Snapshot, ZoneData } from "../types";
import { define } from "./define";
import { alertDialog, confirmDialog, promptDialog } from "./hs-dialog";

/** Zones: add, rename, reorder, delete, and create them from Home Assistant floors. */
export class HsAdvZones extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare busy: boolean;

  constructor() {
    super();
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
      p {
        margin: 0;
      }
      ha-card {
        overflow: hidden;
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  private async call(command: string, data: Record<string, unknown>) {
    this.busy = true;
    try {
      await storeFor(this.hass).call(command, { revision: this.snapshot.revision, ...data });
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  private roomNames(zone: ZoneData): string {
    const names = zone.rooms
      .map((id) => this.snapshot.rooms.find((room) => room.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    return names ? this.t("adv.zones.rooms", { rooms: names }) : this.t("adv.zones.no_rooms");
  }

  private async edit(zone: ZoneData | null) {
    const t = this.t;
    const answer = await promptDialog(this, {
      heading: zone ? t("adv.zones.edit_title") : t("adv.zones.new_title"),
      label: t("adv.zones.name"),
      value: zone?.name ?? "",
      confirm: t("common.save"),
      cancel: t("common.cancel"),
    });
    const name = answer?.trim();
    if (!name || name === zone?.name) return;
    await this.call("zone/save", { zone: zone ? { id: zone.id, name } : { name } });
  }

  private async move(zone: ZoneData, delta: number) {
    const order = this.snapshot.zones.map((item) => item.id);
    const index = order.indexOf(zone.id);
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target]!, order[index]!];
    await this.call("zones/reorder", { order });
  }

  private async deleteZone(zone: ZoneData) {
    const t = this.t;
    const first = this.snapshot.zones.find((item) => item.id !== zone.id);
    if (!first) return;
    const ok = await confirmDialog(this, {
      heading: t("common.delete"),
      message: t("adv.zones.delete_confirm", { name: zone.name, first: first.name }),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (ok) await this.call("zone/delete", { zone_id: zone.id });
  }

  private menu(zone: ZoneData, action: string) {
    if (action === "edit") void this.edit(zone);
    else if (action === "up") void this.move(zone, -1);
    else if (action === "down") void this.move(zone, 1);
    else if (action === "delete") void this.deleteZone(zone);
  }

  private async fromFloors() {
    let candidates: Candidates;
    try {
      candidates = await storeFor(this.hass).call<Candidates>("candidates");
    } catch (error) {
      toast(this, errorText(error, this.t));
      return;
    }
    const t = this.t;
    if (!candidates.floors.length) {
      await alertDialog(this, t("adv.zones.from_floors"), t("adv.zones.from_floors_none"));
      return;
    }
    // "Přízemí: Obývák, Kuchyň · 1. patro: Ložnice, Koupelna"
    const roomName = (id: string) => this.snapshot.rooms.find((room) => room.id === id)?.name ?? id;
    const floors = candidates.floors.map((floor) => `${floor.name}: ${floor.rooms.map(roomName).join(", ")}`);
    const ok = await confirmDialog(this, {
      heading: t("adv.zones.from_floors"),
      message: `${t("adv.zones.from_floors_hint")} ${floors.join(" · ")}`,
      confirm: t("adv.zones.from_floors_button"),
      cancel: t("common.cancel"),
    });
    if (ok) await this.call("zones/from_floors", {});
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const zones = this.snapshot.zones;
    return html`
      <div class="actions">
        <ha-button .disabled=${this.busy} @click=${() => this.edit(null)}>
          <ha-svg-icon slot="start" .path=${mdiPlus}></ha-svg-icon>${t("adv.zones.add")}
        </ha-button>
        <ha-button appearance="plain" .disabled=${this.busy} @click=${this.fromFloors}>
          <ha-svg-icon slot="start" .path=${mdiHomeFloor1}></ha-svg-icon>${t("adv.zones.from_floors")}
        </ha-button>
      </div>
      ${zones.length < 2 ? html`<p class="muted">${t("adv.zones.one_hint")}</p>` : nothing}
      <ha-card>
        ${zones.map(
          (zone, index) => html`<ha-md-list-item type="button" @click=${() => this.edit(zone)}>
            <span slot="headline">${zone.name}</span>
            <span slot="supporting-text">${this.roomNames(zone)}</span>
            <ha-dropdown
              slot="end"
              @click=${(e: Event) => e.stopPropagation()}
              @wa-select=${(e: CustomEvent<{ item: { value: string } }>) => this.menu(zone, e.detail.item.value)}
            >
              <ha-icon-button slot="trigger" .path=${mdiDotsVertical} .label=${zone.name}></ha-icon-button>
              <ha-dropdown-item value="edit">
                <ha-svg-icon slot="icon" .path=${mdiPencil}></ha-svg-icon>${t("common.edit")}
              </ha-dropdown-item>
              <ha-dropdown-item value="up" .disabled=${this.busy || index === 0}>
                <ha-svg-icon slot="icon" .path=${mdiChevronUp}></ha-svg-icon>${t("adv.rooms.move_up")}
              </ha-dropdown-item>
              <ha-dropdown-item value="down" .disabled=${this.busy || index === zones.length - 1}>
                <ha-svg-icon slot="icon" .path=${mdiChevronDown}></ha-svg-icon>${t("adv.rooms.move_down")}
              </ha-dropdown-item>
              <ha-dropdown-item value="delete" variant="danger" .disabled=${this.busy || zones.length < 2}>
                <ha-svg-icon slot="icon" .path=${mdiDelete}></ha-svg-icon>${t("common.delete")}
              </ha-dropdown-item>
            </ha-dropdown>
          </ha-md-list-item>`,
        )}
      </ha-card>
    `;
  }
}

define("hs-adv-zones", HsAdvZones);
