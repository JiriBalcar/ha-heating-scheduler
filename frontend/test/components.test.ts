// @vitest-environment happy-dom
// Component tests for the findings of the code review of 2026-09-30 (F05-F07).
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/card";
import "../src/components/hs-adv-rooms";
import "../src/components/hs-adv-settings";
import "../src/components/hs-adv-zones";
import "../src/components/hs-block-sheet";
import "../src/components/hs-boost-card";
import "../src/components/hs-copy-dialog";
import "../src/components/hs-holiday-dialog";
import "../src/components/hs-house-card";
import "../src/components/hs-house-dialog";
import "../src/components/hs-house-hints";
import "../src/components/hs-plan-editor";
import "../src/components/hs-room-card";
import "../src/components/hs-temps-view";
import "../src/components/hs-zone-modes-dialog";
import { gridOptions } from "../src/card-config";
import { openRoomDialog } from "../src/components/hs-room-dialog";
import { fitReplacements, type ZoneModes } from "../src/components/hs-zone-modes-dialog";
import type { Candidates, HomeAssistant, HouseData, HouseMode, PlanData, RoomData, Snapshot, ZoneData } from "../src/types";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const ALL_MODES: HouseMode[] = ["auto", "away", "vacation", "frost", "off"];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function fakeHass(callWS: (message: Any) => Promise<unknown>): HomeAssistant & { push: (s: Snapshot) => void } {
  let listener: ((snapshot: Snapshot) => void) | null = null;
  return {
    language: "en",
    locale: { language: "en" },
    config: { time_zone: "Europe/Prague" },
    states: {},
    connection: {
      subscribeMessage: async (callback: (snapshot: Snapshot) => void) => {
        listener = callback;
        return async () => undefined;
      },
    },
    callWS,
    push: (snapshot: Snapshot) => listener?.(snapshot),
  } as unknown as HomeAssistant & { push: (s: Snapshot) => void };
}

const PLAN: PlanData = {
  id: "house",
  name: "House",
  days: Array.from({ length: 7 }, () => [{ start: "00:00", mode: "night" as const }]),
  used_by: [],
};

function snapshot(revision: number, extra: Partial<Snapshot> = {}): Snapshot {
  return {
    revision,
    time_zone: "Europe/Prague",
    zones: [{ id: "house", name: "House", house: { mode: "auto", effective: "auto", vacation: null }, modes: ALL_MODES, replacements: {}, rooms: [] }],
    settings: {
      max_override_minutes: 240,
      safety_interval_minutes: 5,
      mismatch_alert_minutes: 20,
      vacation_mode: "frost",
      dry_run: false,
      boost_minutes: 60,
      window_delay_seconds: 30,
      window_limit_minutes: 60,
      window_drop_degrees: 1,
      window_drop_minutes: 5,
      window_drop_rise: 0.3,
      window_drop_hold_minutes: 30,
    },
    boost_until: null,
    plans: [PLAN],
    temp_sets: [{ id: "house", name: "House", temperatures: { comfort: 21 }, used_by: [] }],
    rooms: [],
    ...extra,
  };
}

beforeAll(async () => {
  // happy-dom may lack modal dialogs; the tests do not need the top layer.
  const proto = HTMLDialogElement.prototype as Any;
  if (!proto.showModal) proto.showModal = function (this: Any) { this.open = true; };
  // Our elements are defined once Home Assistant has defined its root element.
  customElements.define("home-assistant", class extends HTMLElement {});
  await Promise.all(
    [
      "hs-adv-rooms",
      "hs-adv-settings",
      "hs-block-sheet",
      "hs-boost-card",
      "hs-copy-dialog",
      "hs-holiday-dialog",
      "hs-house-hints",
      "hs-card",
      "hs-house-card",
      "hs-house-dialog",
      "hs-plan-editor",
      "hs-room-card",
      "hs-room-dialog",
      "hs-temps-view",
      "hs-zone-modes-dialog",
    ].map((name) => customElements.whenDefined(name)),
  );
});

describe("hs-block-sheet (F06)", () => {
  async function sheetWith(index: number): Promise<Any> {
    const sheet = document.createElement("hs-block-sheet") as Any;
    sheet.hass = { language: "en", locale: { language: "en" } };
    document.body.appendChild(sheet);
    sheet.showDialog({
      day: [
        { start: 0, mode: "night" },
        { start: 360, mode: "comfort" },
        { start: 720, mode: "eco" },
      ],
      index,
      minute: null,
      dayName: "Monday",
      onChange: () => undefined,
    });
    await sheet.updateComplete;
    return sheet;
  }

  it("keeps editing the morning after it merges with the night before", async () => {
    const sheet = await sheetWith(1);
    sheet.setMode("night");
    expect(sheet.day).toEqual([
      { start: 0, mode: "night" },
      { start: 720, mode: "eco" },
    ]);
    expect(sheet.index).toBe(0);
    sheet.setMode("frost");
    expect(sheet.day).toEqual([
      { start: 0, mode: "frost" },
      { start: 720, mode: "eco" },
    ]);
  });

  it("keeps editing the morning after it merges with the afternoon", async () => {
    const sheet = await sheetWith(1);
    sheet.setMode("eco");
    expect(sheet.day).toEqual([
      { start: 0, mode: "night" },
      { start: 360, mode: "eco" },
    ]);
    expect(sheet.index).toBe(1);
    sheet.setMode("comfort");
    expect(sheet.day[1]).toEqual({ start: 360, mode: "comfort" });
  });
});

describe("saving keeps edits made while waiting (F05)", () => {
  it("plan editor", async () => {
    const reply = deferred<unknown>();
    const sent: Any[] = [];
    const hass = fakeHass((message) => {
      sent.push(message);
      return reply.promise;
    });
    const editor = document.createElement("hs-plan-editor") as Any;
    editor.hass = hass;
    editor.snapshot = snapshot(1);
    editor.plan = PLAN;
    document.body.appendChild(editor);
    await editor.updateComplete;
    editor.name = "Before save";
    const saving = editor.save();
    editor.name = "Changed while waiting";
    reply.resolve({ plan_id: "house", revision: 2 });
    await saving;
    expect(sent[0].plan.name).toBe("Before save");
    expect(editor.dirty).toBe(true);
  });

  it("settings", async () => {
    const reply = deferred<unknown>();
    const sent: Any[] = [];
    const hass = fakeHass((message) => {
      sent.push(message);
      return reply.promise;
    });
    const settings = document.createElement("hs-adv-settings") as Any;
    settings.hass = hass;
    settings.snapshot = snapshot(1);
    document.body.appendChild(settings);
    await settings.updateComplete;
    settings.set("dry_run", true);
    const saving = settings.save();
    settings.set("max_override_minutes", 480);
    reply.resolve({ revision: 2 });
    await saving;
    expect(sent[0].settings.max_override_minutes).toBe(240);
    expect(sent[0].settings.dry_run).toBe(true);
    expect(settings.dirty).toBe(true);
  });

  it("settings offer the open-window rules", async () => {
    const sent: Any[] = [];
    const hass = fakeHass(async (message) => {
      sent.push(message);
      return { revision: 2 };
    });
    const settings = document.createElement("hs-adv-settings") as Any;
    settings.hass = hass;
    settings.snapshot = snapshot(1);
    document.body.appendChild(settings);
    await settings.updateComplete;
    const selects = [...settings.shadowRoot.querySelectorAll("ha-select")] as Any[];
    const labels = selects.map((select) => select.options.map((option: Any) => option.label));
    expect(labels).toContainEqual(["0.5 °C", "0.8 °C", "1.0 °C", "1.5 °C", "2.0 °C", "3.0 °C"]);
    expect(labels).toContainEqual(["At once", "15 s", "30 s", "1 min", "2 min", "5 min", "10 min"]);
    settings.set("window_drop_degrees", 1.5);
    settings.set("window_drop_hold_minutes", 45);
    await settings.save();
    expect(sent[0].settings.window_drop_degrees).toBe(1.5);
    expect(sent[0].settings.window_drop_hold_minutes).toBe(45);
    expect(sent[0].settings.window_drop_minutes).toBe(5);
  });
});

/** Stands in for HA's dialog manager: create the dialog once, give it hass, show it. */
function installDialogManager(hass: HomeAssistant) {
  document.addEventListener("show-dialog", async (event) => {
    const { dialogTag, dialogImport, dialogParams } = (event as CustomEvent).detail;
    await dialogImport();
    let element = document.body.querySelector(dialogTag) as Any;
    if (!element) element = document.body.appendChild(document.createElement(dialogTag));
    element.hass = hass;
    element.showDialog(dialogParams);
  });
}

async function shownDialog(tag: string): Promise<Any> {
  await new Promise((resolve) => setTimeout(resolve));
  const element = document.body.querySelector(tag) as Any;
  await element.updateComplete;
  return element;
}

describe("room dialog (F07)", () => {
  it("saves with the newest revision after a conflict", async () => {
    const revisions: number[] = [];
    const hass = fakeHass(async (message) => {
      revisions.push(message.revision);
      if (message.revision !== 2) throw { code: "revision_conflict", message: "conflict" };
      return { room_id: "room_new", revision: 3 };
    });
    installDialogManager(hass);
    const candidates: Candidates = {
      climates: [],
      temperature_entities: [],
      valve_window_entities: [],
      areas: [],
      floors: [],
    };
    openRoomDialog(document.body, snapshot(1), candidates, null);
    const dialog = await shownDialog("hs-room-dialog");
    dialog.data = { ...dialog.data, name: "New room" };
    await dialog.save();
    expect(dialog.error).not.toBe("");
    hass.push(snapshot(2));
    await dialog.save();
    expect(revisions).toEqual([1, 2]);
    expect(dialog.error).toBe("");
  });
});

const AUTO: HouseData = { mode: "auto", effective: "auto", vacation: null };
const AWAY: HouseData = { mode: "away", effective: "away", vacation: null };
const ZONES: ZoneData[] = [
  { id: "down", name: "Ground floor", house: AUTO, modes: ALL_MODES, replacements: {}, rooms: ["kitchen"] },
  { id: "up", name: "1st floor", house: AWAY, modes: ALL_MODES, replacements: {}, rooms: ["bed"] },
];
const BEDROOM: RoomData = {
  id: "bed",
  name: "Bedroom",
  trvs: ["climate.bed"],
  plan_id: "house",
  temp_set_id: "house",
  temperature_entity: null,
  area_id: null,
  zone_id: "up",
  window_sensors: [],
  valve_window_sensors: [],
  window_drop: false,
  current_temperature: 19,
  target: { mode: "away", temperature: 16, source: "house_away", valid_until: null, next: null },
  override: null,
  window: null,
  issues: [],
  trv_status: [],
};
const KITCHEN: RoomData = { ...BEDROOM, id: "kitchen", name: "Kitchen", zone_id: "down" };

async function mount(tag: string, props: Record<string, unknown>): Promise<Any> {
  const element = document.createElement(tag) as Any;
  Object.assign(element, { hass: fakeHass(async () => undefined), ...props });
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function text(root: ParentNode, selector: string): string {
  return root.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

describe("zones on the overview", () => {
  async function secondary(tag: string, props: Record<string, unknown>): Promise<string> {
    return text((await mount(tag, props)).shadowRoot, '[slot="secondary"]');
  }

  it("shows each zone when the zones differ", async () => {
    const data = snapshot(1, { zones: ZONES, rooms: [BEDROOM] });
    expect(await secondary("hs-house-card", { snapshot: data })).toBe("Ground floor: Normal · 1st floor: Away");
  });

  it("speaks of the zone, not the whole house", async () => {
    const data = snapshot(1, { zones: ZONES, rooms: [BEDROOM] });
    expect(await secondary("hs-house-card", { snapshot: data, zone: ZONES[1] })).toBe(
      "This part of the house is set to Away",
    );
    expect(await secondary("hs-room-card", { snapshot: data, room: BEDROOM })).toBe("19.0 °C · 1st floor: Away");
  });

  it("a zone without Holiday shows its replacement until the holiday ends", async () => {
    const replaced: HouseData = {
      mode: "auto",
      effective: "frost",
      vacation: { start: "2026-10-01T06:00:00Z", end: null, mode: "frost", replacement: "frost", active: true },
    };
    const upstairs: ZoneData = { ...ZONES[1]!, house: replaced, modes: ["auto", "away", "frost", "off"], replacements: { vacation: "frost" } };
    const data = snapshot(1, { zones: [ZONES[0]!, upstairs], rooms: [BEDROOM] });
    expect(await secondary("hs-house-card", { snapshot: data, zone: upstairs })).toBe("Frost guard for the holiday");
  });
});

describe("open window on a room tile", () => {
  it("shows the window and offers no − / +", async () => {
    const zones = [{ ...ZONES[0]!, rooms: ["kitchen"] }];
    const open: RoomData = {
      ...KITCHEN,
      window_sensors: ["binary_sensor.kitchen_window"],
      target: { mode: "window", temperature: 7, source: "window", valid_until: null, next: null },
      window: { since: "2026-10-05T09:00:00Z", limit: "2026-10-05T10:00:00Z" },
    };
    const card = await mount("hs-room-card", { snapshot: snapshot(1, { zones, rooms: [open] }), room: open });
    expect(text(card.shadowRoot, '[slot="secondary"]')).toBe("19.0 °C · Window open");
    expect(card.shadowRoot.querySelector("ha-tile-icon").title).toBe("Window open");
    expect(card.shadowRoot.querySelector("ha-control-number-buttons").disabled).toBe(true);
  });
});

describe("house dialog", () => {
  it("has the names of the modes; the tile shows icons only", async () => {
    const data = snapshot(1, { zones: ZONES, rooms: [BEDROOM] });
    const tile = await mount("hs-house-card", { snapshot: data });
    expect(tile.shadowRoot.querySelector("ha-control-select").hasAttribute("hide-option-label")).toBe(true);
    const dialog = await mount("hs-house-dialog", {});
    dialog.showDialog({ zoneId: null, snapshot: data });
    await dialog.updateComplete;
    expect(dialog.shadowRoot.querySelector("ha-control-select").hasAttribute("hide-option-label")).toBe(false);
  });

  it("shows the state of the whole house or of a zone in big letters", async () => {
    const temp_sets = [{ id: "house", name: "House", temperatures: { comfort: 21, away: 16 }, used_by: [] }];
    const data = snapshot(1, { zones: ZONES, rooms: [BEDROOM], temp_sets });
    const dialog = await mount("hs-house-dialog", {});
    dialog.showDialog({ zoneId: null, snapshot: data });
    await dialog.updateComplete;
    expect(text(dialog.shadowRoot, ".state")).toBe("Mixed");
    expect(text(dialog.shadowRoot, ".detail")).toBe("Ground floor: Normal · 1st floor: Away");
    expect(dialog.shadowRoot.querySelector("ha-control-select").value).toBeUndefined();
    // A new opening replaces the open one; it shows after one more update.
    dialog.showDialog({ zoneId: "up", snapshot: data });
    await dialog.updateComplete;
    await dialog.updateComplete;
    expect(text(dialog.shadowRoot, ".state")).toBe("Away");
    expect(text(dialog.shadowRoot, ".detail")).toBe("The rooms are kept at 16.0 °C");
    expect(dialog.shadowRoot.querySelector("ha-control-select").value).toBe("away");
  });
});

describe("rooms in Advanced", () => {
  it("are grouped by zone", async () => {
    const data = snapshot(1, { zones: ZONES, rooms: [BEDROOM, KITCHEN] });
    const page = await mount("hs-adv-rooms", { snapshot: data });
    const groups = [...page.shadowRoot.querySelectorAll("section")].map((section: Element) => ({
      zone: text(section, "h2"),
      rooms: [...section.querySelectorAll('[slot="headline"]')].map((item) => item.textContent?.trim()),
    }));
    expect(groups).toEqual([
      { zone: "Ground floor", rooms: ["Kitchen"] },
      { zone: "1st floor", rooms: ["Bedroom"] },
    ]);
  });
});

describe("card", () => {
  async function card(config: Record<string, unknown>, layout?: string): Promise<Any> {
    const hass = fakeHass(async () => undefined);
    const element = document.createElement("hs-card") as Any;
    element.setConfig({ type: "custom:heating-scheduler-card", ...config });
    element.layout = layout;
    element.hass = hass;
    document.body.appendChild(element);
    hass.push(snapshot(1, { zones: ZONES, rooms: [BEDROOM, KITCHEN] }));
    await element.updateComplete;
    return element;
  }

  it("is the tile of the whole house or of a zone, with the hints above it", async () => {
    const house = await card({});
    expect(house.shadowRoot.querySelectorAll("hs-house-card")).toHaveLength(1);
    expect(house.shadowRoot.querySelector("hs-house-card").zone).toBeNull();
    expect(house.shadowRoot.querySelector("hs-house-hints")).not.toBeNull();
    expect(house.shadowRoot.querySelectorAll("hs-room-card, hs-boost-card")).toHaveLength(0);
    const upstairs = await card({ zone: "up" });
    expect(upstairs.shadowRoot.querySelector("hs-house-card").zone.id).toBe("up");
  });

  it("fills two rows of a dashboard grid like HA's tile, without the hints", async () => {
    const element = await card({ zone: "up" }, "grid");
    const tile = element.shadowRoot.querySelector("hs-house-card");
    expect(tile.fixed).toBe(true);
    expect(element.shadowRoot.querySelector("hs-house-hints")).toBeNull();
    await tile.updateComplete;
    expect(tile.shadowRoot.querySelector("ha-tile-container").fixedInfoHeight).toBe(true);
    // Rows set to "auto" in HA's editor: the tile takes its own height, with the hints.
    const auto = await card({ zone: "up", grid_options: { rows: "auto" } }, "grid");
    expect(auto.shadowRoot.querySelector("hs-house-card").fixed).toBe(false);
    expect(gridOptions()).toEqual({ columns: 12, min_columns: 6, rows: 2, min_rows: 2 });
  });

  it("has HA's round icon, which opens the house dialog", async () => {
    const element = await card({});
    const tile = element.shadowRoot.querySelector("hs-house-card");
    await tile.updateComplete;
    expect(tile.shadowRoot.querySelector("ha-tile-icon").interactive).toBe(true);
  });
});

describe("boost tile", () => {
  afterEach(() => {
    delete window.loadCardHelpers;
    vi.useRealTimers();
  });

  /** A boost tile whose question gets `answer`, with the questions asked and the commands sent. */
  async function boostTile(data: Snapshot, answer: boolean) {
    const asked: Any[] = [];
    const sent: Any[] = [];
    window.loadCardHelpers = async () =>
      ({ showConfirmationDialog: async (_element: HTMLElement, params: Any) => (asked.push(params), answer) }) as Any;
    const element = await mount("hs-boost-card", {
      snapshot: data,
      hass: fakeHass(async (message) => void sent.push(message)),
    });
    return { element, asked, sent };
  }

  it("offers the length from the settings and says that Away ends", async () => {
    const { element, asked, sent } = await boostTile(snapshot(1, { zones: ZONES }), true);
    expect(text(element.shadowRoot, '[slot="secondary"]')).toBe("Every room at full heat for 1 h");
    expect(text(element.shadowRoot, "ha-control-button")).toBe("Start");
    const button = element.shadowRoot.querySelector("ha-control-button");
    button.click();
    await element.updateComplete;
    expect(button.disabled).toBe(true); // Until the new state: no second question.
    await vi.waitFor(() => expect(sent).toEqual([{ type: "heating_scheduler/boost/start" }]));
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    expect(asked.map((params) => [params.text, params.confirmText])).toEqual([
      ["Heat every room at full power for 1 h? Away, Holiday and Off end.", "Yes, heat"],
    ]);
  });

  it("sends nothing when the question is declined", async () => {
    const base = snapshot(1);
    const { element, asked, sent } = await boostTile(
      snapshot(1, { settings: { ...base.settings, boost_minutes: 90 } }),
      false,
    );
    await element.toggle();
    expect(asked.map((params) => params.text)).toEqual(["Heat every room at full power for 1 h 30 min?"]);
    expect(sent).toEqual([]);
  });

  it("shows the end of a running boost and stops it", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-05T10:00:00Z")); // 12:00 in Prague
    const { element, asked, sent } = await boostTile(snapshot(1, { boost_until: "2026-10-05T11:00:00Z" }), true);
    expect(text(element.shadowRoot, '[slot="secondary"]')).toBe("Full heat until 1:00 PM");
    expect(text(element.shadowRoot, "ha-control-button")).toBe("Stop");
    await element.toggle();
    expect(asked.map((params) => params.confirmText)).toEqual(["Yes, stop"]);
    expect(sent).toEqual([{ type: "heating_scheduler/boost/stop" }]);
  });

  it("keeps − / + of the rooms off while it runs", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-05T10:00:00Z"));
    const until = "2026-10-05T11:00:00Z";
    const boosted: RoomData = {
      ...KITCHEN,
      target: { mode: "boost", temperature: 35, source: "boost", valid_until: until, next: null },
    };
    const data = snapshot(1, { zones: ZONES, rooms: [boosted], boost_until: until });
    const tile = await mount("hs-room-card", { snapshot: data, room: boosted });
    expect(tile.shadowRoot.querySelector("ha-control-number-buttons").disabled).toBe(true);
    expect(text(tile.shadowRoot, '[slot="secondary"]')).toBe("19.0 °C · Boost until 1:00 PM");
  });
});

describe("temperature sets", () => {
  it("have − / + in every row; a change makes a value own, reset returns it to the house", async () => {
    const temp_sets = [
      { id: "house", name: "House", temperatures: { comfort: 21, eco: 19, night: 18, away: 16, frost: 7 }, used_by: [] },
      { id: "bath", name: "Bath", temperatures: { comfort: 23 }, used_by: [] },
    ];
    const view = await mount("hs-temps-view", { snapshot: snapshot(1, { temp_sets }) });
    const rows = (): Any[] => {
      const card = [...view.shadowRoot.querySelectorAll("ha-card")].find((item: Any) => item.header === "Bath") as Any;
      return [...card.querySelectorAll("ha-settings-row")];
    };
    const row = (index: number) => {
      const item = rows()[index];
      return {
        text: text(item, '[slot="description"]'),
        value: item.querySelector("ha-control-number-buttons").value,
        reset: item.querySelector("ha-icon-button") !== null,
      };
    };
    expect(row(0)).toEqual({ text: "Own", value: 23, reset: true });
    expect(row(1)).toEqual({ text: "As house", value: 19, reset: false });

    const change = new CustomEvent("value-changed", { detail: { value: 19.5 } });
    rows()[1].querySelector("ha-control-number-buttons").dispatchEvent(change);
    await view.updateComplete;
    expect(row(1)).toEqual({ text: "Own", value: 19.5, reset: true });

    rows()[0].querySelector("ha-icon-button").click();
    await view.updateComplete;
    expect(row(0)).toEqual({ text: "As house", value: 21, reset: false });
  });
});

describe("house hints", () => {
  const hints = async (props: Record<string, unknown>) => {
    const element = await mount("hs-house-hints", props);
    return {
      hidden: element.hidden as boolean,
      texts: [...element.shadowRoot.querySelectorAll(".hint span")].map((span: Element) => span.textContent?.trim()),
    };
  };

  it("show one hint for the whole house, one per zone while the zones differ, and none in Normal", async () => {
    const away = [
      { ...ZONES[0]!, house: AWAY },
      { ...ZONES[1]!, house: AWAY },
    ];
    expect(await hints({ snapshot: snapshot(1, { zones: away }) })).toEqual({
      hidden: false,
      texts: ["The whole house is set to Away. When you are back, switch to Normal."],
    });
    expect(await hints({ snapshot: snapshot(1, { zones: ZONES }) })).toEqual({
      hidden: false,
      texts: ["1st floor is set to Away. When you are back, switch to Normal."],
    });
    expect(await hints({ snapshot: snapshot(1) })).toEqual({ hidden: true, texts: [] });
  });

  it("show a planned holiday of a zone with its name", async () => {
    const planned: HouseData = {
      mode: "auto",
      effective: "auto",
      vacation: { start: "2026-10-10T06:00:00Z", end: "2026-10-12T10:00:00Z", mode: "frost", replacement: null, active: false },
    };
    const zones = [ZONES[0]!, { ...ZONES[1]!, house: planned }];
    const result = await hints({ snapshot: snapshot(1, { zones }), zone: zones[1] });
    expect(result.texts).toEqual(["1st floor: holiday planned from Sat 10 Oct 8:00 AM to Mon 12 Oct 12:00 PM"]);
  });

  it("are not repeated in the house tiles", async () => {
    const tile = await mount("hs-house-card", { snapshot: snapshot(1, { zones: ZONES }), zone: ZONES[1] });
    expect(tile.shadowRoot.querySelector("ha-alert")).toBeNull();
  });
});

describe("room tile status", () => {
  it("says first when a valve has a problem", async () => {
    const data = snapshot(1, { zones: ZONES, rooms: [BEDROOM] });
    const broken = { ...BEDROOM, issues: [{ kind: "unavailable" as const, entity_id: "climate.bed", since: null }] };
    const tile = await mount("hs-room-card", { snapshot: data, room: broken });
    const status = tile.shadowRoot.querySelector('[slot="secondary"]');
    expect(status.textContent.trim()).toBe("19.0 °C · A valve does not respond");
    expect(status.classList.contains("problem")).toBe(true);
  });

  it("opens HA's dialog of the room's thermostat, like HA's tile", async () => {
    const hass = fakeHass(async () => undefined) as Any;
    hass.devices = { dev1: { id: "dev1", identifiers: [["heating_scheduler", "bed"]] } };
    hass.entities = {
      "sensor.bed_mode": { entity_id: "sensor.bed_mode", device_id: "dev1" },
      "climate.bedroom": { entity_id: "climate.bedroom", device_id: "dev1" },
    };
    const tile = await mount("hs-room-card", { hass, snapshot: snapshot(1, { zones: ZONES, rooms: [BEDROOM] }), room: BEDROOM });
    const opened: string[] = [];
    tile.addEventListener("hass-more-info", (event: CustomEvent<{ entityId: string }>) => opened.push(event.detail.entityId));
    tile.shadowRoot.querySelector("ha-tile-container").dispatchEvent(new CustomEvent("action", { detail: { action: "tap" } }));
    tile.shadowRoot.querySelector("ha-tile-icon").dispatchEvent(new CustomEvent("action", { detail: { action: "tap" } }));
    expect(opened).toEqual(["climate.bedroom", "climate.bedroom"]);
  });
});

describe("holiday dialog", () => {
  it("opens with the dates of a planned holiday, to change them", async () => {
    const planned: HouseData = {
      mode: "auto",
      effective: "auto",
      vacation: { start: "2026-10-10T06:00:00Z", end: "2026-10-12T10:00:00Z", mode: "away", replacement: null, active: false },
    };
    const zone = { ...ZONES[1]!, house: planned };
    const dialog = await mount("hs-holiday-dialog", {});
    dialog.showDialog({ snapshot: snapshot(1, { zones: [ZONES[0]!, zone] }), zone });
    await dialog.updateComplete;
    expect(dialog.data).toEqual({
      leave: "later",
      start_date: "2026-10-10",
      start_time: "08:00",
      end_date: "2026-10-12",
      end_time: "12:00",
      mode: "away",
    });
  });
});

describe("copy dialog", () => {
  it("chooses days with large rows; the source day cannot be chosen", async () => {
    const chosen: number[][] = [];
    const dialog = await mount("hs-copy-dialog", {});
    dialog.showDialog({ source: 2, resolve: (days: number[]) => chosen.push(days) });
    await dialog.updateComplete;
    const rows = () => [...dialog.shadowRoot.querySelectorAll("ha-md-list-item")] as Any[];
    expect(rows()).toHaveLength(7);
    expect(rows()[2].hasAttribute("disabled")).toBe(true);
    rows()[0].click();
    rows()[4].click();
    await dialog.updateComplete;
    expect(rows().map((row) => row.getAttribute("aria-pressed"))).toEqual(["true", "false", "true", "false", "true", "false", "false"]);
    dialog.copy();
    dialog.shadowRoot.querySelector("ha-dialog").dispatchEvent(new Event("closed"));
    expect(chosen).toEqual([[0, 4]]);
  });
});

describe("zone modes dialog", () => {
  // 1st floor without Holiday: Frost guard instead.
  const upstairs: ZoneData = { ...ZONES[1]!, modes: ["auto", "away", "frost", "off"], replacements: { vacation: "frost" } };

  async function open(zone: ZoneData) {
    const chosen: (ZoneModes | null)[] = [];
    const dialog = await mount("hs-zone-modes-dialog", {});
    dialog.showDialog({ zone, resolve: (choice: ZoneModes | null) => chosen.push(choice) });
    await dialog.updateComplete;
    const close = () => dialog.shadowRoot.querySelector("ha-dialog").dispatchEvent(new Event("closed"));
    return { dialog, chosen, close };
  }

  it("shows a switch for each mode but Normal, and a choice instead of each mode left out", async () => {
    const { dialog } = await open(upstairs);
    const switches = [...dialog.shadowRoot.querySelectorAll("ha-switch")] as Any[];
    expect(switches.map((item) => item.checked)).toEqual([true, false, true, true]);
    const selects = [...dialog.shadowRoot.querySelectorAll("ha-select")] as Any[];
    expect(selects).toHaveLength(1);
    expect(selects[0].value).toBe("frost");
    expect(selects[0].options.map((option: Any) => option.value)).toEqual(["auto", "away", "frost", "off"]);
  });

  it("leaving out the replacement makes Normal the replacement; Save gives the choice", async () => {
    const { dialog, chosen, close } = await open(upstairs);
    dialog.offer("frost", false);
    await dialog.updateComplete;
    expect(dialog.replacements).toEqual({ vacation: "auto", frost: "auto" });
    dialog.save();
    close();
    expect(chosen).toEqual([{ modes: ["auto", "away", "off"], replacements: { vacation: "auto", frost: "auto" } }]);
  });

  it("gives nothing when cancelled", async () => {
    const { dialog, chosen, close } = await open(upstairs);
    dialog.offer("vacation", true);
    dialog.closeDialog();
    close();
    expect(chosen).toEqual([null]);
  });

  it("never replaces with Holiday or with a mode left out", () => {
    expect(fitReplacements(["auto", "vacation"], { away: "vacation", frost: "off", off: "auto" })).toEqual({
      away: "auto",
      frost: "auto",
      off: "auto",
    });
  });

  it("the zones page saves the choice with the zone's current name and revision", async () => {
    const calls: Any[] = [];
    const hass = fakeHass(async (message) => {
      calls.push(message);
      return {};
    });
    const data = snapshot(7, { zones: [ZONES[0]!, upstairs] });
    const page = await mount("hs-adv-zones", { hass, snapshot: data });
    const choice: ZoneModes = { modes: ["auto", "off"], replacements: { away: "off", vacation: "off", frost: "auto" } };
    let params: Any;
    page.addEventListener("show-dialog", (e: Any) => (params = e.detail.dialogParams));
    const saving = page.modes(upstairs);
    // Renamed elsewhere while the dialog is open.
    page.snapshot = snapshot(8, { zones: [ZONES[0]!, { ...upstairs, name: "Attic" }] });
    params.resolve(choice);
    await saving;
    expect(calls.find((call) => call.type.endsWith("zone/save"))).toMatchObject({
      revision: 8,
      zone: { id: "up", name: "Attic", ...choice },
    });
  });
});
