import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiDelete, mdiPlus, mdiRestore } from "@mdi/js";
import { languageOf, translator, type Translate } from "../i18n";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import { roomPayload, uniqueName } from "../payload";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import { TEMPERATURE_MODES, type HomeAssistant, type Mode, type RoomData, type Snapshot, type TempSetData } from "../types";
import { define } from "./define";
import { confirmDialog, keepMineDialog } from "./hs-dialog";

interface Draft {
  name: string;
  temperatures: Partial<Record<Mode, number>>;
}

function sameDraft(a: Draft, b: Draft): boolean {
  const keys = new Set([...Object.keys(a.temperatures), ...Object.keys(b.temperatures)]) as Set<Mode>;
  return a.name.trim() === b.name.trim() && [...keys].every((k) => a.temperatures[k] === b.temperatures[k]);
}

function clamp(value: number): number {
  return Math.min(30, Math.max(5, Math.round(value * 2) / 2));
}

/**
 * The Temperatures tab, laid out like the Plans tab: the house temperatures and own sets as cards,
 * and which set each room uses.
 */
export class HsTempsView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    drafts: { state: true },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare drafts: Record<string, Draft>;
  declare busy: boolean;

  private revision = -1;
  // The server version each draft started from.
  private base: Record<string, Draft> = {};

  constructor() {
    super();
    this.drafts = {};
    this.busy = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-6, 24px);
      }
      .sets {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
        align-items: start;
        gap: var(--ha-space-2, 8px);
      }
      .card-content {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
        padding: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      p {
        margin: 0;
      }
      ha-settings-row {
        border-top: 1px solid var(--divider-color);
        --settings-row-prefix-display: flex;
      }
      ha-svg-icon[slot="prefix"] {
        align-self: center;
        color: var(--mode-color);
        margin-inline-end: var(--ha-space-4, 16px);
      }
      .value {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--ha-space-1, 4px);
      }
      .value ha-icon-button {
        /* As high as the − / + buttons, so a row with it is as high as the others. */
        --ha-icon-button-size: 42px;
      }
      ha-control-number-buttons {
        width: 160px;
        height: 42px;
        --control-number-buttons-border-radius: var(--ha-border-radius-lg, 12px);
      }
      .card-actions {
        display: flex;
        justify-content: space-between;
        gap: var(--ha-space-2, 8px);
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
      .new {
        align-self: flex-start;
      }
      .rooms ha-settings-row:first-of-type {
        border-top: none;
      }
      ha-select {
        width: 220px;
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("snapshot") && this.snapshot && this.snapshot.revision !== this.revision) {
      this.revision = this.snapshot.revision;
      const drafts: Record<string, Draft> = {};
      const base: Record<string, Draft> = {};
      for (const set of this.snapshot.temp_sets) {
        const server: Draft = { name: set.name, temperatures: { ...set.temperatures } };
        const draft = this.drafts[set.id];
        const previous = this.base[set.id];
        if (draft && previous && !sameDraft(draft, previous)) {
          // Unsaved edits stay; their base stays too, to detect changes made elsewhere.
          drafts[set.id] = draft;
          base[set.id] = previous;
        } else {
          drafts[set.id] = server;
          base[set.id] = server;
        }
      }
      this.drafts = drafts;
      this.base = base;
    }
  }

  private house(): Partial<Record<Mode, number>> {
    return this.snapshot.temp_sets.find((set) => set.id === "house")?.temperatures ?? {};
  }

  private dirty(set: TempSetData): boolean {
    const draft = this.drafts[set.id];
    const base = this.base[set.id];
    return Boolean(draft && base && !sameDraft(draft, base));
  }

  private patch(id: string, change: (draft: Draft) => Draft) {
    this.drafts = { ...this.drafts, [id]: change(this.drafts[id]!) };
  }

  private setValue(id: string, mode: Mode, value: number | undefined) {
    this.patch(id, (draft) => {
      const temperatures = { ...draft.temperatures };
      if (value === undefined) delete temperatures[mode];
      else temperatures[mode] = clamp(value);
      return { ...draft, temperatures };
    });
  }

  private roomNames(ids: string[] = []): string {
    return ids
      .map((id) => this.snapshot.rooms.find((room) => room.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  }

  private async assign(room: RoomData, setId: string) {
    await this.run("room/save", { room: roomPayload(room, { temp_set_id: setId }) });
  }

  private async run(command: string, data: Record<string, unknown>): Promise<boolean> {
    this.busy = true;
    try {
      await storeFor(this.hass).call(command, { revision: this.snapshot.revision, ...data });
      return true;
    } catch (error) {
      toast(this, errorText(error, this.t));
      return false;
    } finally {
      this.busy = false;
    }
  }

  private async save(set: TempSetData) {
    const draft = this.drafts[set.id]!;
    const base = this.base[set.id];
    const server: Draft = { name: set.name, temperatures: set.temperatures };
    if (base && !sameDraft(server, base) && !(await keepMineDialog(this, this.t))) {
      this.drafts = { ...this.drafts, [set.id]: server };
      this.base = { ...this.base, [set.id]: server };
      return;
    }
    const saved = await this.run("temp_set/save", {
      temp_set: { id: set.id, name: draft.name.trim(), temperatures: draft.temperatures },
    });
    if (saved) this.base = { ...this.base, [set.id]: { ...draft, name: draft.name.trim() } };
  }

  private async deleteSet(set: TempSetData) {
    const t = this.t;
    const rooms = (set.used_by ?? [])
      .map((id) => this.snapshot.rooms.find((room) => room.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    const ok = await confirmDialog(this, {
      heading: t("common.delete"),
      message: rooms
        ? t("temps.delete_confirm_used", { name: set.name, rooms })
        : t("temps.delete_confirm", { name: set.name }),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (ok) await this.run("temp_set/delete", { temp_set_id: set.id });
  }

  private createSet() {
    const name = uniqueName(this.t("temps.new"), this.snapshot.temp_sets.map((set) => set.name));
    void this.run("temp_set/save", { temp_set: { name, temperatures: {} } });
  }

  private number(id: string, mode: Mode, value: number) {
    return html`<ha-control-number-buttons
      .value=${value}
      .min=${5}
      .max=${30}
      .step=${0.5}
      .unit=${"°C"}
      .formatOptions=${{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      .locale=${this.hass.locale}
      .label=${this.t(`mode.${mode}`)}
      @value-changed=${(e: CustomEvent<{ value: number }>) => this.setValue(id, mode, e.detail.value)}
    ></ha-control-number-buttons>`;
  }

  private renderSet(set: TempSetData) {
    const t = this.t;
    const draft = this.drafts[set.id];
    if (!draft) return nothing;
    const house = this.house();
    const isHouse = set.id === "house";
    return html`<ha-card .header=${isHouse ? t("temps.house") : set.name}>
      <div class="card-content">
        ${isHouse
          ? html`<p class="muted">${t("temps.house_hint")}</p>`
          : html`<p class="muted">
                ${set.used_by?.length ? t("temps.used_by", { rooms: this.roomNames(set.used_by) }) : t("temps.unused")}
              </p>
              <ha-input
                .label=${t("plans.name")}
                .value=${draft.name}
                maxlength="60"
                @input=${(e: Event) => this.patch(set.id, (d) => ({ ...d, name: (e.target as HTMLInputElement).value }))}
              ></ha-input>`}
      </div>
      ${TEMPERATURE_MODES.map((mode) => {
        const own = draft.temperatures[mode];
        const inherited = house[mode] ?? 20;
        return html`<ha-settings-row style="--mode-color:${MODE_COLORS[mode]}">
          <ha-svg-icon slot="prefix" .path=${MODE_ICONS[mode]}></ha-svg-icon>
          <span slot="heading">${t(`mode.${mode}`)}</span>
          ${isHouse
            ? nothing
            : html`<span slot="description">${own === undefined ? t("temps.as_house") : t("temps.own")}</span>`}
          <div class="value">
            ${isHouse || own === undefined
              ? nothing
              : html`<ha-icon-button
                  .path=${mdiRestore}
                  .label=${t("temps.use_house")}
                  title=${t("temps.use_house")}
                  @click=${() => this.setValue(set.id, mode, undefined)}
                ></ha-icon-button>`}
            ${this.number(set.id, mode, own ?? inherited)}
          </div>
        </ha-settings-row>`;
      })}
      <div class="card-actions">
        ${isHouse
          ? html`<span></span>`
          : html`<ha-button appearance="plain" variant="danger" .disabled=${this.busy} @click=${() => this.deleteSet(set)}>
              <ha-svg-icon slot="start" .path=${mdiDelete}></ha-svg-icon>${t("common.delete")}
            </ha-button>`}
        <ha-button .disabled=${this.busy || !this.dirty(set)} @click=${() => void this.save(set)}>
          ${t("common.save")}
        </ha-button>
      </div>
    </ha-card>`;
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const [house, ...others] = [
      ...this.snapshot.temp_sets.filter((set) => set.id === "house"),
      ...this.snapshot.temp_sets.filter((set) => set.id !== "house"),
    ];
    const setOptions = this.snapshot.temp_sets.map((set) => ({
      value: set.id,
      label: set.id === "house" ? t("temps.house") : set.name,
    }));
    return html`
      <p class="muted">${t("temps.sets_hint")} ${t("temps.save_hint")}</p>
      <div class="sets">${house ? this.renderSet(house) : nothing} ${others.map((set) => this.renderSet(set))}</div>
      <ha-button class="new" .disabled=${this.busy} @click=${this.createSet}>
        <ha-svg-icon slot="start" .path=${mdiPlus}></ha-svg-icon>${t("temps.new")}
      </ha-button>
      ${this.snapshot.rooms.length
        ? html`<ha-card class="rooms" .header=${t("temps.rooms_title")}>
            ${this.snapshot.rooms.map(
              (room) => html`<ha-settings-row>
                <span slot="heading">${room.name}</span>
                <ha-select
                  .label=${t("adv.rooms.temp_set")}
                  .options=${setOptions}
                  .value=${room.temp_set_id}
                  .disabled=${this.busy}
                  @selected=${(e: CustomEvent<{ value?: string }>) => {
                    if (e.detail.value && e.detail.value !== room.temp_set_id) void this.assign(room, e.detail.value);
                  }}
                ></ha-select>
              </ha-settings-row>`,
            )}
          </ha-card>`
        : nothing}
    `;
  }
}

define("hs-temps-view", HsTempsView);
