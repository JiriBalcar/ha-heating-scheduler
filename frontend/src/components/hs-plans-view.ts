import { LitElement, css, html, nothing } from "lit";
import { mdiDelete, mdiPencil, mdiPlus } from "@mdi/js";
import { showDialog } from "../ha";
import { languageOf, translator, type Translate } from "../i18n";
import { roomPayload, uniqueName } from "../payload";
import { fromPlan } from "../schedule/ops";
import { errorText, storeFor, toast } from "../store";
import { baseStyles } from "../styles";
import type { HomeAssistant, PlanData, RoomData, Snapshot } from "../types";
import { define } from "./define";
import { HsHaDialog, confirmDialog } from "./hs-dialog";
import "./hs-plan-editor";
import "./hs-week-view";

/** Which plan each room follows, the list of plans, and the plan editor. */
export class HsPlansView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    planId: { attribute: false },
    busy: { state: true },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare planId: string | null;
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
        gap: var(--ha-space-6, 24px);
      }
      .plans {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        align-items: start;
        gap: var(--ha-space-2, 8px);
      }
      .card-content {
        padding: 0 var(--ha-space-4, 16px) var(--ha-space-4, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      .card-actions {
        display: flex;
        gap: var(--ha-space-2, 8px);
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
      .new {
        align-self: flex-start;
      }
      ha-settings-row {
        border-top: 1px solid var(--divider-color);
      }
      ha-settings-row:first-of-type {
        border-top: none;
      }
      .assign {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--ha-space-2, 8px);
      }
      ha-select {
        width: 220px;
      }
      .own {
        min-width: 130px;
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
      const result = await store.call<{ plan_id: string; revision: number }>("plan/save", {
        revision,
        plan: { name, days: source.days },
      });
      await store.call("room/save", {
        revision: result.revision,
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

  private async openNew() {
    const choice = await new Promise<NewPlan | null>((resolve) =>
      showDialog(this, "hs-new-plan-dialog", {
        name: uniqueName(this.t("plans.new"), this.snapshot.plans.map((plan) => plan.name)),
        plans: this.snapshot.plans,
        resolve,
      }),
    );
    const source = this.snapshot.plans.find((plan) => plan.id === choice?.source);
    if (!choice || !source || !choice.name.trim()) return;
    const created = await this.run(() =>
      storeFor(this.hass).call<{ plan_id: string }>("plan/save", {
        revision: this.snapshot.revision,
        plan: { name: choice.name.trim(), days: source.days },
      }),
    );
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
    const planOptions = this.snapshot.plans.map((plan) => ({ value: plan.id, label: plan.name }));
    return html`
      <div class="plans">
        ${this.snapshot.plans.map(
          (plan) => html`<ha-card .header=${plan.name}>
            <div class="card-content">
              <span class="muted">
                ${plan.id === "house" ? `${t("plans.house_badge")} · ` : ""}${plan.used_by?.length
                  ? t("plans.used_by", { rooms: this.roomNames(plan.used_by) })
                  : t("plans.unused")}
              </span>
              <hs-week-view compact readonly .days=${fromPlan(plan)} .t=${t}></hs-week-view>
            </div>
            <div class="card-actions">
              <ha-button appearance="plain" @click=${() => this.navigate(`/plans/${plan.id}`)}>
                <ha-svg-icon slot="start" .path=${mdiPencil}></ha-svg-icon>${t("plans.edit")}
              </ha-button>
              ${plan.id === "house"
                ? nothing
                : html`<ha-button
                    appearance="plain"
                    variant="danger"
                    .disabled=${this.busy}
                    @click=${() => this.deletePlan(plan)}
                  >
                    <ha-svg-icon slot="start" .path=${mdiDelete}></ha-svg-icon>${t("common.delete")}
                  </ha-button>`}
            </div>
          </ha-card>`,
        )}
      </div>
      <ha-button class="new" @click=${this.openNew}>
        <ha-svg-icon slot="start" .path=${mdiPlus}></ha-svg-icon>${t("plans.new")}
      </ha-button>
      ${this.snapshot.rooms.length
        ? html`<ha-card class="rooms" .header=${t("plans.rooms_title")}>
            ${this.snapshot.rooms.map(
              (room) => html`<ha-settings-row>
                <span slot="heading">${room.name}</span>
                <div class="assign">
                  <ha-select
                    .label=${t("adv.rooms.plan")}
                    .options=${planOptions}
                    .value=${room.plan_id}
                    .disabled=${this.busy}
                    @selected=${(e: CustomEvent<{ value?: string }>) => {
                      if (e.detail.value && e.detail.value !== room.plan_id) void this.assign(room, e.detail.value);
                    }}
                  ></ha-select>
                  ${this.sharesPlan(room)
                    ? html`<ha-button
                        class="own"
                        appearance="plain"
                        .disabled=${this.busy}
                        @click=${() => this.ownPlan(room)}
                      >
                        ${t("plans.own_plan")}
                      </ha-button>`
                    : html`<span class="own"></span>`}
                </div>
              </ha-settings-row>`,
            )}
          </ha-card>`
        : nothing}
    `;
  }
}

define("hs-plans-view", HsPlansView);

interface NewPlan {
  name: string;
  source: string;
}

interface NewPlanParams {
  name: string;
  plans: PlanData[];
  resolve: (choice: NewPlan | null) => void;
}

/** Name a new plan and pick the plan it starts from. */
export class HsNewPlanDialog extends HsHaDialog<NewPlanParams> {
  static override properties = {
    data: { state: true },
  };
  declare data: NewPlan;
  private result: NewPlan | null = null;

  override showDialog(params: NewPlanParams): void {
    this.args?.resolve(null);
    this.data = { name: params.name, source: "house" };
    this.result = null;
    super.showDialog(params);
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.result);
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  private create() {
    if (!this.data.name.trim()) return;
    this.result = this.data;
    this.closeDialog();
  }

  override render() {
    if (!this.args) return nothing;
    const t = this.t;
    const schema = [
      { name: "name", required: true, selector: { text: {} } },
      {
        name: "source",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: this.args.plans.map((plan) => ({ value: plan.id, label: plan.name })),
          },
        },
      },
    ];
    const labels: Record<string, string> = { name: t("plans.name"), source: t("plans.start_from") };
    return html`
      <ha-dialog .open=${this.open} header-title=${t("plans.new")} @closed=${this.onClosed}>
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${schema}
          .computeLabel=${(field: { name: string }) => labels[field.name] ?? field.name}
          @value-changed=${(e: CustomEvent<{ value: NewPlan }>) => (this.data = { ...this.data, ...e.detail.value })}
        ></ha-form>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${!this.data.name.trim()} @click=${this.create}>
            ${t("plans.create")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-new-plan-dialog", HsNewPlanDialog);
