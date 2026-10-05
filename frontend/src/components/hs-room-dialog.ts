import { css, html, nothing } from "lit";
import { formatContext, formatTemp } from "../format";
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

interface RoomForm {
  name: string;
  trvs: string[];
  temperature_entity?: string;
  plan_id: string;
  temp_set_id: string;
  zone_id: string;
  window_sensors: string[];
  valve_window_sensors: string[];
  window_drop: boolean;
}

const LABELS: Record<keyof RoomForm, TextKey> = {
  name: "adv.rooms.name",
  trvs: "adv.rooms.trvs",
  temperature_entity: "adv.rooms.temperature_entity",
  plan_id: "adv.rooms.plan",
  temp_set_id: "adv.rooms.temp_set",
  zone_id: "adv.rooms.zone",
  window_sensors: "adv.rooms.window_sensors",
  valve_window_sensors: "adv.rooms.valve_window_sensors",
  window_drop: "adv.rooms.window_drop",
};

const HELPERS: Partial<Record<keyof RoomForm, TextKey>> = {
  window_sensors: "adv.rooms.window_sensors_hint",
  valve_window_sensors: "adv.rooms.valve_window_sensors_hint",
};

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
      window_sensors: [...(room?.window_sensors ?? [])],
      valve_window_sensors: [...(room?.valve_window_sensors ?? [])],
      window_drop: room?.window_drop ?? false,
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
      window_sensors: this.data.window_sensors,
      valve_window_sensors: this.data.valve_window_sensors,
      window_drop: this.data.window_drop,
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

  private schema(candidates: Candidates) {
    // Valves of other rooms can't be chosen.
    const free = candidates.climates
      .filter((climate) => !climate.room_id || climate.room_id === this.room?.id)
      .map((climate) => climate.entity_id);
    const sensors = [
      ...candidates.temperature_entities.map((sensor) => sensor.entity_id),
      ...candidates.climates.map((climate) => climate.entity_id),
    ];
    // The valves' own detection: their window entities if Home Assistant knows any.
    const valveWindows = candidates.valve_window_entities.map((entity) => entity.entity_id);
    const valveSelector = valveWindows.length
      ? { entity: { multiple: true, include_entities: [...new Set([...valveWindows, ...this.data.valve_window_sensors])] } }
      : { entity: { multiple: true, filter: [{ domain: "binary_sensor" }, { domain: "sensor" }] } };
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
      { name: "window_sensors", selector: { entity: { multiple: true, filter: WINDOW_FILTER } } },
      { name: "valve_window_sensors", selector: valveSelector },
      { name: "window_drop", selector: { boolean: {} } },
    ];
  }

  private label = (field: { name: string }): string => this.t(LABELS[field.name as keyof RoomForm]);

  private helper = (field: { name: string }): string | undefined => {
    const t = this.t;
    if (field.name === "temperature_entity") return `${t("adv.rooms.sensor_empty")} ${t("adv.rooms.sensor_hint")}`;
    if (field.name === "trvs" && this.args?.candidates.climates.length === 0) return t("adv.rooms.no_climates");
    if (field.name === "window_drop") {
      const settings = this.snapshot.settings;
      const ctx = formatContext(this.hass, languageOf(this.hass), this.snapshot);
      return t("adv.rooms.window_drop_hint", {
        degrees: formatTemp(settings.window_drop_degrees, ctx),
        minutes: settings.window_drop_minutes,
      });
    }
    const hint = HELPERS[field.name as keyof RoomForm];
    return hint ? t(hint) : undefined;
  };

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
