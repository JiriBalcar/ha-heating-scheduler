import { LitElement, css, html, nothing } from "lit";
import { mdiDelete, mdiPencil, mdiPlusCircle } from "@mdi/js";
import { languageOf, translator, type Translate } from "../i18n";
import { fromPlan } from "../schedule/ops";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, PlanData, RoomData, Snapshot } from "../types";
import { define } from "./define";
import { confirmDialog, type HsDialog } from "./hs-dialog";
import "./hs-dialog";
import "./hs-icon";
import "./hs-plan-editor";
import "./hs-week-view";

export function roomPayload(room: RoomData, patch: Partial<RoomData> = {}) {
  const merged = { ...room, ...patch };
  return {
    id: merged.id,
    name: merged.name,
    trvs: merged.trvs,
    plan_id: merged.plan_id,
    temp_set_id: merged.temp_set_id,
    temperature_entity: merged.temperature_entity,
    area_id: merged.area_id,
  };
}

export function uniqueName(base: string, taken: string[]): string {
  const used = new Set(taken.map((name) => name.trim().toLowerCase()));
  if (!used.has(base.trim().toLowerCase())) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

/** Which plan each room follows, the list of plans, and the plan editor. */
export class HsPlansView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    planId: { attribute: false },
    newName: { state: true },
    newSource: { state: true },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare planId: string | null;
  declare newName: string;
  declare newSource: string;
  declare busy: boolean;

  constructor() {
    super();
    this.newName = "";
    this.newSource = "house";
    this.busy = false;
  }

  static override styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h2 {
        font-size: 21px;
      }
      .assign {
        padding: 8px 16px;
      }
      .assign-row {
        display: grid;
        grid-template-columns: minmax(120px, 1fr) minmax(160px, 2fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        font-size: 18px;
      }
      .assign-row:last-child {
        border-bottom: none;
      }
      @media (max-width: 560px) {
        .assign-row {
          grid-template-columns: 1fr;
        }
      }
      .plans {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
        gap: 16px;
      }
      .plan {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .plan h3 {
        font-size: 20px;
      }
      .badge {
        font-size: 14px;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 999px;
        border: 1px solid var(--divider-color, #c4c4c4);
        margin-left: 8px;
        vertical-align: middle;
      }
      .buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .buttons .btn {
        flex: 1 1 140px;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    `,
  ];

  private get t(): Translate {
    return translator(languageOf(this.hass));
  }

  private roomNames(ids: string[] = []): string {
    return ids
      .map((id) => this.snapshot.rooms.find((room) => room.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  }

  private navigate(path: string) {
    this.dispatchEvent(new CustomEvent("hs-navigate", { detail: path, bubbles: true, composed: true }));
  }

  private async run<T>(action: () => Promise<T>): Promise<T | null> {
    this.busy = true;
    try {
      return await action();
    } catch (error) {
      toast(this, errorText(error, this.t));
      return null;
    } finally {
      this.busy = false;
    }
  }

  /** True if the room follows the house plan or a plan other rooms use too. */
  private sharesPlan(room: RoomData): boolean {
    if (room.plan_id === "house") return true;
    const plan = this.snapshot.plans.find((item) => item.id === room.plan_id);
    return (plan?.used_by ?? []).length > 1;
  }

  private async assign(room: RoomData, planId: string) {
    await this.run(() =>
      storeFor(this.hass).call("room/save", {
        revision: this.snapshot.revision,
        room: roomPayload(room, { plan_id: planId }),
      }),
    );
  }

  private async ownPlan(room: RoomData) {
    const source = this.snapshot.plans.find((plan) => plan.id === room.plan_id);
    if (!source) return;
    const store = storeFor(this.hass);
    const revision = this.snapshot.revision;
    const name = uniqueName(room.name, this.snapshot.plans.map((plan) => plan.name));
    const created = await this.run(async () => {
      const result = await store.call<{ plan_id: string }>("plan/save", {
        revision,
        plan: { name, days: source.days },
      });
      await store.call("room/save", {
        revision: revision + 1,
        room: roomPayload(room, { plan_id: result.plan_id }),
      });
      return result.plan_id;
    });
    if (created) this.navigate(`/plans/${created}`);
  }

  private async deletePlan(plan: PlanData) {
    const t = this.t;
    const used = plan.used_by ?? [];
    const ok = await confirmDialog(this, {
      heading: t("common.delete"),
      message: used.length
        ? t("plans.delete_confirm_used", { name: plan.name, rooms: this.roomNames(used) })
        : t("plans.delete_confirm", { name: plan.name }),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    await this.run(() =>
      storeFor(this.hass).call("plan/delete", { revision: this.snapshot.revision, plan_id: plan.id }),
    );
  }

  private newDialog(): HsDialog | null {
    return this.renderRoot.querySelector("#new");
  }

  private openNew() {
    this.newName = uniqueName(this.t("plans.new"), this.snapshot.plans.map((plan) => plan.name));
    this.newSource = "house";
    void this.newDialog()?.show();
  }

  private async create() {
    const source = this.snapshot.plans.find((plan) => plan.id === this.newSource);
    if (!source || !this.newName.trim()) return;
    const created = await this.run(() =>
      storeFor(this.hass).call<{ plan_id: string }>("plan/save", {
        revision: this.snapshot.revision,
        plan: { name: this.newName.trim(), days: source.days },
      }),
    );
    this.newDialog()?.close();
    if (created) this.navigate(`/plans/${created.plan_id}`);
  }

  override render() {
    if (!this.snapshot || !this.hass) return nothing;
    const t = this.t;
    if (this.planId) {
      const plan = this.snapshot.plans.find((item) => item.id === this.planId);
      if (plan) {
        return html`<hs-plan-editor .hass=${this.hass} .snapshot=${this.snapshot} .plan=${plan}></hs-plan-editor>`;
      }
    }
    return html`
      <section>
        <h2>${t("nav.plans")}</h2>
        <div class="plans">
          ${this.snapshot.plans.map(
            (plan) => html`<article class="card plan">
              <h3>
                ${plan.name}${plan.id === "house" ? html`<span class="badge">${t("plans.house_badge")}</span>` : nothing}
              </h3>
              <span class="muted">
                ${plan.used_by?.length ? t("plans.used_by", { rooms: this.roomNames(plan.used_by) }) : t("plans.unused")}
              </span>
              <hs-week-view compact readonly .days=${fromPlan(plan)} .t=${t}></hs-week-view>
              <div class="buttons">
                <button class="btn" @click=${() => this.navigate(`/plans/${plan.id}`)}>
                  <hs-icon .path=${mdiPencil}></hs-icon>${t("plans.edit")}
                </button>
                ${plan.id === "house"
                  ? nothing
                  : html`<button class="btn danger" ?disabled=${this.busy} @click=${() => this.deletePlan(plan)}>
                      <hs-icon .path=${mdiDelete}></hs-icon>${t("common.delete")}
                    </button>`}
              </div>
            </article>`,
          )}
        </div>
        <button class="btn primary" @click=${this.openNew}>
          <hs-icon .path=${mdiPlusCircle}></hs-icon>${t("plans.new")}
        </button>
      </section>
      ${this.snapshot.rooms.length
        ? html`<section>
            <h2>${t("plans.rooms_title")}</h2>
            <div class="card assign">
              ${this.snapshot.rooms.map(
                (room) => html`<div class="assign-row">
                  <strong>${room.name}</strong>
                  <select
                    class="input"
                    aria-label=${`${room.name}: ${t("adv.rooms.plan")}`}
                    ?disabled=${this.busy}
                    @change=${(e: Event) => this.assign(room, (e.target as HTMLSelectElement).value)}
                  >
                    ${this.snapshot.plans.map(
                      (plan) =>
                        html`<option value=${plan.id} ?selected=${plan.id === room.plan_id}>${plan.name}</option>`,
                    )}
                  </select>
                  ${this.sharesPlan(room)
                    ? html`<button class="btn small" ?disabled=${this.busy} @click=${() => this.ownPlan(room)}>
                        ${t("plans.own_plan")}
                      </button>`
                    : html`<span></span>`}
                </div>`,
              )}
            </div>
          </section>`
        : nothing}
      <hs-dialog id="new" .heading=${t("plans.new")} .closeLabel=${t("common.cancel")}>
        <div class="form">
          <label class="field">
            <span>${t("plans.name")}</span>
            <input
              class="input"
              maxlength="60"
              .value=${this.newName}
              @input=${(e: Event) => (this.newName = (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="field">
            <span>${t("plans.start_from")}</span>
            <select class="input" @change=${(e: Event) => (this.newSource = (e.target as HTMLSelectElement).value)}>
              ${this.snapshot.plans.map(
                (plan) => html`<option value=${plan.id} ?selected=${plan.id === this.newSource}>${plan.name}</option>`,
              )}
            </select>
          </label>
        </div>
        <button slot="actions" class="btn" @click=${() => this.newDialog()?.close()}>${t("common.cancel")}</button>
        <button slot="actions" class="btn primary" ?disabled=${this.busy || !this.newName.trim()} @click=${this.create}>
          ${t("plans.create")}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-plans-view", HsPlansView);
