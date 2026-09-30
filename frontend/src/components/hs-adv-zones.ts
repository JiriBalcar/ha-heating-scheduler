import { LitElement, css, html, nothing } from "lit";
import { mdiChevronDown, mdiChevronUp, mdiDelete, mdiDotsVertical, mdiHomeFloor1, mdiPencil, mdiPlus } from "@mdi/js";
import { showDialog } from "../ha";
import { languageOf, translator, type Translate } from "../i18n";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { Candidates, HomeAssistant, Snapshot, ZoneData } from "../types";
import { define } from "./define";
import { HsHaDialog, confirmDialog } from "./hs-dialog";

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
    const name = await new Promise<string | null>((resolve) =>
      showDialog(this, "hs-zone-dialog", { name: zone?.name ?? "", isNew: zone === null, resolve }),
    );
    if (name === null) return;
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
    const roomName = (id: string) => this.snapshot.rooms.find((room) => room.id === id)?.name ?? id;
    const floors = candidates.floors.map((floor) => ({ name: floor.name, rooms: floor.rooms.map(roomName) }));
    const ok = await new Promise<boolean>((resolve) => showDialog(this, "hs-floors-dialog", { floors, resolve }));
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

interface ZoneParams {
  name: string;
  isNew: boolean;
  resolve: (name: string | null) => void;
}

/** Name a new zone, or rename one. */
export class HsZoneDialog extends HsHaDialog<ZoneParams> {
  static override properties = {
    name: { state: true },
  };
  declare name: string;
  private result: string | null = null;

  protected override dialogOpened(params: ZoneParams): void {
    this.name = params.name;
    this.result = null;
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.result);
  }

  private save() {
    if (!this.name.trim()) return;
    this.result = this.name.trim();
    this.closeDialog();
  }

  override render() {
    if (!this.args) return nothing;
    const t = translator(languageOf(this.hass));
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${this.args.isNew ? t("adv.zones.new_title") : t("adv.zones.edit_title")}
        @closed=${this.onClosed}
      >
        <ha-form
          .hass=${this.hass}
          .data=${{ name: this.name }}
          .schema=${[{ name: "name", required: true, selector: { text: {} } }]}
          .computeLabel=${() => t("adv.zones.name")}
          @value-changed=${(e: CustomEvent<{ value: { name?: string } }>) => (this.name = e.detail.value.name ?? "")}
        ></ha-form>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${!this.name.trim()} @click=${this.save}>
            ${t("common.save")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-zone-dialog", HsZoneDialog);

interface FloorsParams {
  floors: { name: string; rooms: string[] }[];
  resolve: (ok: boolean) => void;
}

/** What "Create zones from floors" will do, before it does it. */
export class HsFloorsDialog extends HsHaDialog<FloorsParams> {
  private confirmed = false;

  static override styles = css`
    p {
      margin-top: 0;
    }
    ha-md-list-item {
      --md-list-item-leading-space: 0;
    }
  `;

  protected override dialogOpened(): void {
    this.confirmed = false;
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.confirmed);
  }

  private create() {
    this.confirmed = true;
    this.closeDialog();
  }

  override render() {
    const p = this.args;
    if (!p) return nothing;
    const t = translator(languageOf(this.hass));
    return html`
      <ha-dialog .open=${this.open} header-title=${t("adv.zones.from_floors")} @closed=${this.onClosed}>
        ${p.floors.length
          ? html`<p>${t("adv.zones.from_floors_hint")}</p>
              ${p.floors.map(
                (floor) => html`<ha-md-list-item>
                  <span slot="headline">${floor.name}</span>
                  <span slot="supporting-text">${floor.rooms.join(", ")}</span>
                </ha-md-list-item>`,
              )}`
          : html`<p>${t("adv.zones.from_floors_none")}</p>`}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${p.floors.length === 0} @click=${this.create}>
            ${t("adv.zones.from_floors_button")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-floors-dialog", HsFloorsDialog);
