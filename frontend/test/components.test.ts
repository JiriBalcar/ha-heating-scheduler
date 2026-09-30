// @vitest-environment happy-dom
// Component tests for the findings of the code review of 2026-09-30 (F05-F07).
import { beforeAll, describe, expect, it } from "vitest";
import "../src/card";
import "../src/components/hs-adv-rooms";
import "../src/components/hs-adv-settings";
import "../src/components/hs-block-sheet";
import "../src/components/hs-house-card";
import "../src/components/hs-house-dialog";
import "../src/components/hs-plan-editor";
import "../src/components/hs-room-card";
import "../src/components/hs-temps-view";
import { openRoomDialog } from "../src/components/hs-room-dialog";
import type { Candidates, HomeAssistant, HouseData, PlanData, RoomData, Snapshot, ZoneData } from "../src/types";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

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
    zones: [{ id: "house", name: "House", house: { mode: "auto", effective: "auto", vacation: null }, rooms: [] }],
    settings: {
      max_override_minutes: 240,
      safety_interval_minutes: 5,
      mismatch_alert_minutes: 20,
      vacation_mode: "frost",
      dry_run: false,
    },
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
      "hs-card",
      "hs-house-card",
      "hs-house-dialog",
      "hs-plan-editor",
      "hs-room-card",
      "hs-room-dialog",
      "hs-temps-view",
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
    const candidates: Candidates = { climates: [], temperature_entities: [], areas: [], floors: [] };
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
  { id: "down", name: "Ground floor", house: AUTO, rooms: ["kitchen"] },
  { id: "up", name: "1st floor", house: AWAY, rooms: ["bed"] },
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
  current_temperature: 19,
  target: { mode: "away", temperature: 16, source: "house_away", valid_until: null, next: null },
  override: null,
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
      "This part of the house is set to Away.",
    );
    expect(await secondary("hs-room-card", { snapshot: data, room: BEDROOM })).toBe("19.0 °C · 1st floor: Away");
  });
});

describe("house dialog", () => {
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
    expect(text(dialog.shadowRoot, ".detail")).toBe("The rooms are kept at 16.0 °C.");
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
  it("shows only the house tile without rooms", async () => {
    const hass = fakeHass(async () => undefined);
    const card = document.createElement("hs-card") as Any;
    card.setConfig({ type: "custom:heating-scheduler-card", show_rooms: false });
    card.hass = hass;
    document.body.appendChild(card);
    hass.push(snapshot(1, { zones: ZONES, rooms: [BEDROOM, KITCHEN] }));
    await card.updateComplete;
    expect(card.shadowRoot.querySelectorAll("hs-house-card")).toHaveLength(1);
    expect(card.shadowRoot.querySelectorAll("hs-room-card")).toHaveLength(0);
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
    expect(row(0)).toEqual({ text: "own", value: 23, reset: true });
    expect(row(1)).toEqual({ text: "as house", value: 19, reset: false });

    const change = new CustomEvent("value-changed", { detail: { value: 19.5 } });
    rows()[1].querySelector("ha-control-number-buttons").dispatchEvent(change);
    await view.updateComplete;
    expect(row(1)).toEqual({ text: "own", value: 19.5, reset: true });

    rows()[0].querySelector("ha-icon-button").click();
    await view.updateComplete;
    expect(row(0)).toEqual({ text: "as house", value: 21, reset: false });
  });
});
