import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { mdiDelete, mdiMinus, mdiPlus, mdiPlusCircle } from "@mdi/js";
import { formatContext, formatTemp } from "../format";
import { languageOf, translator, type Translate } from "../i18n";
import { MODE_COLORS, MODE_ICONS } from "../modes";
import { uniqueName } from "../payload";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import { TEMPERATURE_MODES, type HomeAssistant, type Mode, type Snapshot, type TempSetData } from "../types";
import { define } from "./define";
import { confirmDialog } from "./hs-dialog";
import "./hs-icon";

interface Draft {
  name: string;
  temperatures: Partial<Record<Mode, number>>;
}

function clamp(value: number): number {
  return Math.min(30, Math.max(5, Math.round(value * 2) / 2));
}

/** House temperatures and own temperature sets. */
export class HsAdvTemps extends LitElement {
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
        gap: 18px;
      }
      .set {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h3 {
        font-size: 20px;
      }
      .mode {
        display: grid;
        grid-template-columns: minmax(140px, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 60px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        padding: 4px 0;
      }
      .mode:last-of-type {
        border-bottom: none;
      }
      .label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
      }
      .stepper {
        display: grid;
        grid-template-columns: 52px 96px 52px;
        align-items: center;
        gap: 6px;
      }
      .stepper strong {
        text-align: center;
        font-size: 22px;
        font-variant-numeric: tabular-nums;
      }
      .stepper .btn {
        padding: 0;
      }
      .own {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
      }
      .own input {
        width: 24px;
        height: 24px;
        accent-color: var(--hs-accent, #1565c0);
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .buttons .btn {
        flex: 1 1 160px;
      }
      @media (max-width: 480px) {
        .mode {
          grid-template-columns: 1fr;
        }
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
      for (const set of this.snapshot.temp_sets) {
        drafts[set.id] = { name: set.name, temperatures: { ...set.temperatures } };
      }
      this.drafts = drafts;
    }
  }

  private house(): Partial<Record<Mode, number>> {
    return this.snapshot.temp_sets.find((set) => set.id === "house")?.temperatures ?? {};
  }

  private dirty(set: TempSetData): boolean {
    const draft = this.drafts[set.id];
    if (!draft) return false;
    return draft.name.trim() !== set.name || JSON.stringify(draft.temperatures) !== JSON.stringify(set.temperatures);
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

  private async run(command: string, data: Record<string, unknown>) {
    this.busy = true;
    try {
      await storeFor(this.hass).call(command, { revision: this.snapshot.revision, ...data });
    } catch (error) {
      toast(this, errorText(error, this.t));
    } finally {
      this.busy = false;
    }
  }

  private save(set: TempSetData) {
    const draft = this.drafts[set.id]!;
    void this.run("temp_set/save", {
      temp_set: { id: set.id, name: draft.name.trim(), temperatures: draft.temperatures },
    });
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
        ? t("adv.temps.delete_confirm_used", { name: set.name, rooms })
        : t("adv.temps.delete_confirm", { name: set.name }),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (ok) await this.run("temp_set/delete", { temp_set_id: set.id });
  }

  private createSet() {
    const name = uniqueName(this.t("adv.temps.new"), this.snapshot.temp_sets.map((set) => set.name));
    void this.run("temp_set/save", { temp_set: { name, temperatures: {} } });
  }

  private stepper(id: string, mode: Mode, value: number) {
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    const t = this.t;
    return html`<div class="stepper">
      <button class="btn" @click=${() => this.setValue(id, mode, value - 0.5)} aria-label=${t("room.cooler")}>
        <hs-icon .path=${mdiMinus}></hs-icon>
      </button>
      <strong>${formatTemp(value, ctx)}</strong>
      <button class="btn" @click=${() => this.setValue(id, mode, value + 0.5)} aria-label=${t("room.warmer")}>
        <hs-icon .path=${mdiPlus}></hs-icon>
      </button>
    </div>`;
  }

  private renderSet(set: TempSetData) {
    const t = this.t;
    const draft = this.drafts[set.id];
    if (!draft) return nothing;
    const house = this.house();
    const isHouse = set.id === "house";
    const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
    return html`<section class="card set">
      ${isHouse
        ? html`<h3>${t("adv.temps.house")}</h3><span class="muted">${t("adv.temps.house_hint")}</span>`
        : html`<label class="field">
            <span>${t("plans.name")}</span>
            <input
              class="input"
              maxlength="60"
              .value=${draft.name}
              @input=${(e: Event) => this.patch(set.id, (d) => ({ ...d, name: (e.target as HTMLInputElement).value }))}
            />
          </label>`}
      ${TEMPERATURE_MODES.map((mode) => {
        const own = draft.temperatures[mode];
        const inherited = house[mode] ?? 20;
        return html`<div class="mode">
          <span class="label">
            <hs-icon .path=${MODE_ICONS[mode]} style="color:${MODE_COLORS[mode]}"></hs-icon>${t(`mode.${mode}`)}
          </span>
          ${isHouse
            ? this.stepper(set.id, mode, own ?? inherited)
            : html`<div>
                <label class="own">
                  <input
                    type="checkbox"
                    .checked=${own !== undefined}
                    @change=${(e: Event) =>
                      this.setValue(set.id, mode, (e.target as HTMLInputElement).checked ? inherited : undefined)}
                  />
                  ${own === undefined
                    ? t("adv.temps.as_house", { temp: formatTemp(inherited, ctx) })
                    : t("adv.temps.own")}
                </label>
                ${own !== undefined ? this.stepper(set.id, mode, own) : nothing}
              </div>`}
        </div>`;
      })}
      <span class="muted">${t("adv.temps.save_hint")}</span>
      <div class="buttons">
        <button class="btn primary" ?disabled=${this.busy || !this.dirty(set)} @click=${() => this.save(set)}>
          ${t("common.save")}
        </button>
        ${isHouse
          ? nothing
          : html`<button class="btn danger" ?disabled=${this.busy} @click=${() => this.deleteSet(set)}>
              <hs-icon .path=${mdiDelete}></hs-icon>${t("common.delete")}
            </button>`}
      </div>
    </section>`;
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    const [house, ...others] = [
      ...this.snapshot.temp_sets.filter((set) => set.id === "house"),
      ...this.snapshot.temp_sets.filter((set) => set.id !== "house"),
    ];
    return html`
      ${house ? this.renderSet(house) : nothing}
      <h3>${t("adv.temps.sets")}</h3>
      <span class="muted">${t("adv.temps.sets_hint")}</span>
      ${others.map((set) => this.renderSet(set))}
      <button class="btn" ?disabled=${this.busy} @click=${this.createSet}>
        <hs-icon .path=${mdiPlusCircle}></hs-icon>${t("adv.temps.new")}
      </button>
    `;
  }
}

define("hs-adv-temps", HsAdvTemps);
