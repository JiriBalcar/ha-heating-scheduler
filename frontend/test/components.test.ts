// @vitest-environment happy-dom
// Component tests for the findings of the code review of 2026-09-30 (F05-F07).
import { beforeAll, describe, expect, it } from "vitest";
import "../src/components/hs-adv-settings";
import "../src/components/hs-block-sheet";
import "../src/components/hs-plan-editor";
import { openRoomDialog } from "../src/components/hs-room-dialog";
import type { Candidates, HomeAssistant, PlanData, Snapshot } from "../src/types";

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
    house: { mode: "auto", effective: "auto", vacation: null },
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
    ["hs-adv-settings", "hs-block-sheet", "hs-plan-editor", "hs-room-dialog"].map((name) =>
      customElements.whenDefined(name),
    ),
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

describe("room dialog (F07)", () => {
  it("saves with the newest revision after a conflict", async () => {
    const revisions: number[] = [];
    const hass = fakeHass(async (message) => {
      revisions.push(message.revision);
      if (message.revision !== 2) throw { code: "revision_conflict", message: "conflict" };
      return { room_id: "room_new", revision: 3 };
    });
    const candidates: Candidates = { climates: [], temperature_entities: [], areas: [] };
    await openRoomDialog(document.body, hass, snapshot(1), candidates, null);
    const dialog = document.body.querySelector("hs-room-dialog") as Any;
    dialog.name = "New room";
    await dialog.save();
    expect(dialog.error).not.toBe("");
    hass.push(snapshot(2));
    await dialog.save();
    expect(revisions).toEqual([1, 2]);
    expect(dialog.error).toBe("");
  });
});
