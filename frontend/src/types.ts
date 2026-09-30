// Types of the Home Assistant frontend objects we use, and of the integration's data.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface MessageBase {
  type: string;
  [key: string]: unknown;
}

export interface Connection {
  subscribeMessage<T>(
    callback: (message: T) => void,
    subscribeMessage: MessageBase,
  ): Promise<() => Promise<void>>;
}

export interface HassLocale {
  language: string;
  number_format?: string;
  time_format?: string;
  time_zone?: string;
}

export interface HomeAssistant {
  connection: Connection;
  states: Record<string, HassEntity>;
  language: string;
  locale?: HassLocale;
  config: { time_zone: string; unit_system?: { temperature?: string } };
  panels?: Record<string, { config?: { _panel_custom?: { module_url?: string } } | null }>;
  user?: { name: string; is_admin: boolean };
  themes?: { darkMode?: boolean };
  localize?: (key: string) => string;
  /** HA's device and entity registries, as its frontend holds them. */
  devices?: Record<string, { id: string; identifiers?: [string, string][] }>;
  entities?: Record<string, { entity_id: string; device_id?: string | null }>;
  callWS<T>(message: MessageBase): Promise<T>;
}

/** Options of the Lovelace card. */
export interface CardConfig {
  type: string;
  /** A zone's id; without it, the whole house. */
  zone?: string;
  /** Set by HA's dashboard editor in a sections view. */
  grid_options?: { rows?: number | "auto"; columns?: number | "full" };
}

export type Mode = "comfort" | "eco" | "night" | "away" | "frost" | "off";
export type TargetMode = Mode | "manual" | "boost";
export type HouseMode = "auto" | "away" | "vacation" | "off";
export type Source = "plan" | "manual" | "house_away" | "vacation" | "house_off" | "boost";

export const MODES: readonly Mode[] = ["comfort", "eco", "night", "away", "frost", "off"];
export const TEMPERATURE_MODES: readonly Mode[] = ["comfort", "eco", "night", "away", "frost"];
export const HOUSE_MODES: readonly HouseMode[] = ["auto", "away", "vacation", "off"];

export interface SlotData {
  start: string; // "HH:MM"
  mode: Mode;
}

export interface PlanData {
  id: string;
  name: string;
  days: SlotData[][];
  used_by?: string[];
}

export interface TempSetData {
  id: string;
  name: string;
  temperatures: Partial<Record<Mode, number>>;
  used_by?: string[];
}

export interface TargetData {
  mode: TargetMode;
  temperature: number | null;
  source: Source;
  valid_until: string | null;
  next: { mode: TargetMode; temperature: number | null; source: Source } | null;
}

export interface OverrideData {
  temperature: number | null;
  until: string;
  created: string;
  origin: "device" | "user";
  entity_id: string | null;
}

export type IssueKind = "unavailable" | "write_failed" | "mismatch";

export interface IssueData {
  kind: IssueKind;
  entity_id: string;
  since: string | null;
}

export interface TrvStatus {
  entity_id: string;
  phase: "idle" | "writing" | "waiting" | "failed";
  available: boolean;
  desired: number | null;
  setpoint: number | null;
  hvac_mode: string | null;
  last_error: string | null;
  last_write: string | null;
  mismatch_since: string | null;
  unavailable_since: string | null;
  failed_since: string | null;
}

export interface RoomData {
  id: string;
  name: string;
  trvs: string[];
  plan_id: string;
  temp_set_id: string;
  temperature_entity: string | null;
  area_id: string | null;
  zone_id: string;
  current_temperature: number | null;
  target: TargetData | null;
  override: OverrideData | null;
  issues: IssueData[];
  trv_status: TrvStatus[];
}

export interface VacationData {
  start: string;
  end: string | null;
  mode: "frost" | "away";
  active: boolean;
}

export interface SettingsData {
  max_override_minutes: number;
  safety_interval_minutes: number;
  mismatch_alert_minutes: number;
  vacation_mode: "frost" | "away";
  dry_run: boolean;
  boost_minutes: number;
}

/** The house mode and holiday of a zone. */
export interface HouseData {
  mode: HouseMode;
  effective: HouseMode;
  vacation: VacationData | null;
}

/** A part of the house, e.g. a floor, with its own mode and holiday. */
export interface ZoneData {
  id: string;
  name: string;
  house: HouseData;
  rooms: string[];
}

export interface Snapshot {
  revision: number;
  time_zone: string;
  zones: ZoneData[];
  settings: SettingsData;
  /** The end of the boost while one runs. */
  boost_until: string | null;
  plans: PlanData[];
  temp_sets: TempSetData[];
  rooms: RoomData[];
}

export interface LogEntryData {
  at: string;
  kind: string;
  entity_id: string | null;
  value: number | null;
  hvac_mode: string | null;
  source: string | null;
  mode: string | null;
  detail: string | null;
}

export interface Candidates {
  climates: { entity_id: string; name: string; area_id: string | null; room_id: string | null }[];
  temperature_entities: {
    entity_id: string;
    name: string;
    area_id: string | null;
    unit: string | null;
  }[];
  areas: { area_id: string; name: string; climates: string[]; temperature_entity: string | null }[];
  floors: { floor_id: string; name: string; rooms: string[] }[];
}
