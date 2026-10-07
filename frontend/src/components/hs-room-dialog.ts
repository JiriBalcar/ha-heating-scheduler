import { css, html, nothing } from "lit";
import { mdiThermometerMinus, mdiThermostat } from "@mdi/js";
import { formatContext, formatDuration, formatTemp } from "../format";
import { showDialog } from "../ha";
import { languageOf, translator, type TextKey } from "../i18n";
import { roomPayload } from "../payload";
import { errorText, storeFor } from "../store";
import type { Candidates, RoomData, Snapshot } from "../types";
import { define } from "./define";
import { HsHaDialog, keepMineDialog } from "./hs-dialog";

interface RoomParams {
  snapshot: Snapshot;
  candidates: Candidates;
  room: RoomData | null;
}

/** How a room detects an open window: one way only (the integration refuses more). */
type WindowMethod = "off" | "sensors" | "drop" | "valves";

interface RoomForm {
  name: string;
  trvs: string[];
  temperature_entity?: string;
  plan_id: string;
  temp_set_id: string;
  zone_id: string;
  window_method: WindowMethod;
  window_sensors: string[];
}

const LABELS: Record<keyof RoomForm, TextKey> = {
  name: "adv.rooms.name",
  trvs: "adv.rooms.trvs",
  temperature_entity: "adv.rooms.temperature_entity",
  plan_id: "adv.rooms.plan",
  temp_set_id: "adv.rooms.temp_set",
  zone_id: "adv.rooms.zone",
  window_method: "adv.rooms.window_method",
  window_sensors: "adv.rooms.window_sensors",
};

const METHODS: Record<WindowMethod, { label: TextKey; description: TextKey }> = {
  off: { label: "adv.rooms.method.off", description: "adv.rooms.method.off_hint" },
  sensors: { label: "adv.rooms.method.sensors", description: "adv.rooms.method.sensors_hint" },
  drop: { label: "adv.rooms.method.drop", description: "adv.rooms.method.drop_hint" },
  valves: { label: "adv.rooms.method.valves", description: "adv.rooms.method.valves_hint" },
};

/** The way a stored room detects an open window. */
function windowMethodOf(room: RoomData | null): WindowMethod {
  if (room?.window_sensors.length) return "sensors";
  if (room?.valve_window_sensors.length) return "valves";
  if (room?.window_drop) return "drop";
  return "off";
}

// Window contact sensors: binary sensors of windows and doors, or helpers.
const WINDOW_FILTER = [
  { domain: "binary_sensor", device_class: ["window", "door", "opening", "garage_door"] },
  { domain: "input_boolean" },
];

/** Create or change a room: name, valves, shown temperature, plan, temperatures. */
export class HsRoomDialog extends HsHaDialog<RoomParams> {
  static override properties = {
    snapshot: { state: true },
    room: { state: true },
    data: { state: true },
    error: { state: true },
    saving: { state: true },
  };
  declare snapshot: Snapshot;
  declare room: RoomData | null;
  declare data: RoomForm;
  declare error: string;
  declare saving: boolean;

  private unsubscribe: (() => void) | null = null;

  static override styles = css`
    ha-alert {
      display: block;
      margin-top: var(--ha-space-4, 16px);
    }
    /* What the chosen way of detecting an open window does, when it has nothing to choose. */
    .window-info {
      display: flex;
      gap: var(--ha-space-3, 12px);
      align-items: flex-start;
      margin-top: var(--ha-space-4, 16px);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      border-radius: var(--ha-border-radius-lg, 12px);
      background: var(--input-fill-color, var(--secondary-background-color));
      font-size: var(--ha-font-size-m, 14px);
      line-height: 20px;
    }
    .window-info ha-svg-icon {
      flex: none;
      color: var(--secondary-text-color);
    }
  `;

  protected override dialogOpened(params: RoomParams): void {
    this.snapshot = params.snapshot;
    this.room = params.room;
    this.prepare();
    // Follow newer snapshots (revision, plans, sets) while keeping the draft.
    this.unsubscribe?.();
    this.unsubscribe = storeFor(this.hass).subscribe((latest) => {
      if (latest) this.snapshot = latest;
    });
  }

  protected override dialogClosed(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private prepare(): void {
    const room = this.room;
    this.data = {
      name: room?.name ?? "",
      trvs: [...(room?.trvs ?? [])],
      temperature_entity: room?.temperature_entity ?? undefined,
      plan_id: room?.plan_id ?? "house",
      temp_set_id: room?.temp_set_id ?? "house",
      zone_id: room?.zone_id ?? this.snapshot.zones[0]?.id ?? "house",
      window_method: windowMethodOf(room),
      window_sensors: [...(room?.window_sensors ?? [])],
    };
    this.error = "";
    this.saving = false;
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  /** The room as it is now on the server, if it changed since the dialog opened. */
  private changedElsewhere(): RoomData | null {
    if (!this.room) return null;
    const current = this.snapshot.rooms.find((room) => room.id === this.room!.id);
    if (!current) return null;
    const fields = [
      "name",
      "trvs",
      "plan_id",
      "temp_set_id",
      "temperature_entity",
      "area_id",
      "zone_id",
      "window_sensors",
      "valve_window_sensors",
      "window_drop",
    ] as const;
    const same = fields.every((field) => JSON.stringify(current[field]) === JSON.stringify(this.room![field]));
    return same ? null : current;
  }

  async save() {
    const t = this.t;
    const current = this.changedElsewhere();
    if (current) {
      if (!(await keepMineDialog(this, t))) {
        this.room = current;
        this.prepare();
        return;
      }
      this.room = current;
    }
    const windows = this.windowFields();
    if (typeof windows === "string") {
      this.error = t(windows);
      return;
    }
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
      zone_id: this.data.zone_id,
      window_sensors: [],
      valve_window_sensors: [],
      window_drop: false,
      current_temperature: null,
      target: null,
      override: null,
      window: null,
      issues: [],
      trv_status: [],
    };
    const payload = roomPayload(base, {
      name: this.data.name.trim(),
      trvs: this.data.trvs,
      temperature_entity: this.data.temperature_entity || null,
      plan_id: this.data.plan_id,
      temp_set_id: this.data.temp_set_id,
      zone_id: this.data.zone_id,
      ...windows,
    });
    try {
      await storeFor(this.hass).call("room/save", {
        revision: this.snapshot.revision,
        room: { ...payload, id: this.room ? payload.id : null },
      });
      this.closeDialog();
    } catch (error) {
      this.error = errorText(error, t);
    } finally {
      this.saving = false;
    }
  }

  /** The stored fields of the chosen way to detect an open window, or what is missing for it. */
  private windowFields():
    | Pick<RoomData, "window_sensors" | "valve_window_sensors" | "window_drop">
    | TextKey {
    const method = this.data.window_method;
    if (method === "sensors" && !this.data.window_sensors.length) return "adv.rooms.window_sensors_missing";
    const valves = method === "valves" ? this.valveWindows() : [];
    if (method === "valves" && !valves.length) return "adv.rooms.window_valves_missing";
    return {
      window_sensors: method === "sensors" ? this.data.window_sensors : [],
      valve_window_sensors: valves,
      window_drop: method === "drop",
    };
  }

  /**
   * The valves' own open-window entities: those of the room's chosen valves. A room that has
   * others (1.1 let them be chosen by hand) keeps them while its valves offer none.
   */
  private valveWindows(): string[] {
    const trvs = new Set(this.data.trvs);
    const found = (this.args?.candidates.valve_window_entities ?? [])
      .filter((entity) => entity.trvs.some((trv) => trvs.has(trv)))
      .map((entity) => entity.entity_id);
    return found.length ? found : [...(this.room?.valve_window_sensors ?? [])];
  }

  private schema(candidates: Candidates) {
    // Valves of other rooms can't be chosen.
    const free = candidates.climates
      .filter((climate) => !climate.room_id || climate.room_id === this.room?.id)
      .map((climate) => climate.entity_id);
    const sensors = [
      ...candidates.temperature_entities.map((sensor) => sensor.entity_id),
      ...candidates.climates.map((climate) => climate.entity_id),
    ];
    // The valves' own detection only where the room's valves report an open window.
    const methods: WindowMethod[] = ["off", "sensors", "drop"];
    if (this.valveWindows().length) methods.push("valves");
    const zones =
      this.snapshot.zones.length > 1
        ? [
            {
              name: "zone_id",
              required: true,
              selector: {
                select: {
                  mode: "dropdown",
                  options: this.snapshot.zones.map((zone) => ({ value: zone.id, label: zone.name })),
                },
              },
            },
          ]
        : [];
    return [
      { name: "name", required: true, selector: { text: {} } },
      ...zones,
      { name: "trvs", selector: { entity: { multiple: true, include_entities: free } } },
      { name: "temperature_entity", selector: { entity: { include_entities: sensors } } },
      {
        name: "plan_id",
        required: true,
        selector: {
          select: { mode: "dropdown", options: this.snapshot.plans.map((plan) => ({ value: plan.id, label: plan.name })) },
        },
      },
      {
        name: "temp_set_id",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: this.snapshot.temp_sets.map((set) => ({ value: set.id, label: set.name })),
          },
        },
      },
      {
        name: "window_method",
        selector: {
          select: {
            mode: "box",
            box_max_columns: 1,
            options: methods.map((method) => ({
              value: method,
              label: this.t(METHODS[method].label),
              description: this.t(METHODS[method].description),
            })),
          },
        },
      },
      ...(this.data.window_method === "sensors"
        ? [{ name: "window_sensors", selector: { entity: { multiple: true, filter: WINDOW_FILTER } } }]
        : []),
    ];
  }

  private label = (field: { name: string }): string => this.t(LABELS[field.name as keyof RoomForm]);

  private helper = (field: { name: string }): string | undefined => {
    const t = this.t;
    if (field.name === "temperature_entity") return `${t("adv.rooms.sensor_empty")} ${t("adv.rooms.sensor_hint")}`;
    if (field.name === "trvs" && this.args?.candidates.climates.length === 0) return t("adv.rooms.no_climates");
    if (field.name === "window_sensors") {
      const seconds = this.snapshot.settings.window_delay_seconds;
      if (seconds === 0) return t("adv.rooms.window_sensors_hint_now");
      const delay =
        seconds % 60 === 0 ? t("adv.settings.minutes", { n: seconds / 60 }) : t("adv.settings.seconds", { n: seconds });
      return t("adv.rooms.window_sensors_hint", { delay });
    }
    return undefined;
  };

  /** What the temperature drop or the valves' own detection does: there is nothing to choose. */
  private windowInfo() {
    const t = this.t;
    if (this.data.window_method === "drop") {
      const settings = this.snapshot.settings;
      const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
      const entity = this.data.temperature_entity;
      const sensor = entity
        ? ((this.hass.states[entity]?.attributes.friendly_name as string | undefined) ?? entity)
        : t("adv.rooms.window_drop_valves");
      return html`<div class="window-info">
        <ha-svg-icon .path=${mdiThermometerMinus}></ha-svg-icon>
        <span>
          ${t("adv.rooms.window_drop_info", {
            sensor,
            degrees: formatTemp(settings.window_drop_degrees, ctx),
            minutes: settings.window_drop_minutes,
            rise: formatTemp(settings.window_drop_rise, ctx),
            hold: formatDuration(settings.window_drop_hold_minutes),
          })}
        </span>
      </div>`;
    }
    if (this.data.window_method === "valves") {
      // The valves whose detection is used; for entities kept from 1.1, the entities.
      const trvs = new Set(this.data.trvs);
      const reporting = (this.args?.candidates.valve_window_entities ?? []).flatMap((entity) =>
        entity.trvs.filter((trv) => trvs.has(trv)),
      );
      const shown = reporting.length ? [...new Set(reporting)] : this.valveWindows();
      const names = shown.map(
        (entity) => (this.hass.states[entity]?.attributes.friendly_name as string | undefined) ?? entity,
      );
      return html`<div class="window-info">
        <ha-svg-icon .path=${mdiThermostat}></ha-svg-icon>
        <span>
          ${names.length
            ? t("adv.rooms.window_valves_info", { valves: names.join(", ") })
            : t("adv.rooms.window_valves_missing")}
        </span>
      </div>`;
    }
    return nothing;
  }

  override render() {
    if (!this.args || !this.hass || !this.snapshot) return nothing;
    const t = this.t;
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${this.room ? t("adv.rooms.edit_title") : t("adv.rooms.new_title")}
        @closed=${this.onClosed}
      >
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.schema(this.args.candidates)}
          .computeLabel=${this.label}
          .computeHelper=${this.helper}
          @value-changed=${(e: CustomEvent<{ value: RoomForm }>) => (this.data = { ...this.data, ...e.detail.value })}
        ></ha-form>
        ${this.windowInfo()}
        ${this.error ? html`<ha-alert alert-type="error">${this.error}</ha-alert>` : nothing}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button
            slot="primaryAction"
            .disabled=${this.saving || !this.data.name.trim()}
            .loading=${this.saving}
            @click=${this.save}
          >
            ${t("common.save")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-room-dialog", HsRoomDialog);

export function openRoomDialog(
  host: HTMLElement,
  snapshot: Snapshot,
  candidates: Candidates,
  room: RoomData | null,
): void {
  showDialog(host, "hs-room-dialog", { snapshot, candidates, room });
}
