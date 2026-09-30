// @vitest-environment happy-dom
// HA's dialog manager treats an element with a `params` property as its newer dialog type: it
// drops the element after closing and creates the next one without `hass`. Ours must not have one.
import { beforeAll, describe, expect, it } from "vitest";
import "../src/panel";
import { alertDialog, confirmDialog, promptDialog } from "../src/components/hs-dialog";

const DIALOGS = [
  "hs-problem-dialog",
  "hs-holiday-dialog",
  "hs-house-dialog",
  "hs-block-sheet",
  "hs-copy-dialog",
  "hs-save-plan-dialog",
  "hs-new-plan-dialog",
  "hs-room-dialog",
  "hs-import-rooms-dialog",
];

beforeAll(async () => {
  customElements.define("home-assistant", class extends HTMLElement {});
  await Promise.all(DIALOGS.map((tag) => customElements.whenDefined(tag)));
});

describe("dialogs", () => {
  it.each(DIALOGS)("%s is a dialog HA keeps and gives hass", (tag) => {
    const element = document.createElement(tag);
    expect("showDialog" in element).toBe(true);
    expect("params" in element).toBe(false);
    expect("dialogNext" in element).toBe(false);
  });

  it.each(DIALOGS)("%s dims the page with an overlay, not a backdrop filter", (tag) => {
    const element = document.createElement(tag);
    document.body.appendChild(element);
    expect(element.style.getPropertyValue("--ha-dialog-scrim-backdrop-filter")).toBe("none");
    expect(element.style.getPropertyValue("--mdc-dialog-scrim-color")).toBe("rgba(0, 0, 0, 0.32)");
    element.remove();
  });
});

describe("a dialog opened again while it closes", () => {
  it("answers the first caller and ignores the late close of the old ha-dialog", async () => {
    type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const dialog = document.createElement("hs-save-plan-dialog") as Any;
    dialog.hass = { language: "en", locale: { language: "en" } };
    document.body.appendChild(dialog);
    const closed: string[] = [];
    dialog.addEventListener("dialog-closed", () => closed.push("dialog-closed"));
    const answers: boolean[] = [];
    const days = Array.from({ length: 7 }, () => [{ start: 0, mode: "night" }]);
    const ask = (used: string) =>
      dialog.showDialog({ days, changed: new Set(), used, resolve: (save: boolean) => answers.push(save) });

    ask("first");
    await dialog.updateComplete;
    const first = dialog.shadowRoot.querySelector("ha-dialog");
    dialog.answer(true); // Save: the ha-dialog starts closing.
    ask("second"); // Opened again before the first "closed".
    await dialog.updateComplete;
    await dialog.updateComplete;
    expect(answers).toEqual([true]);
    const second = dialog.shadowRoot.querySelector("ha-dialog");
    expect(second).not.toBe(first);
    expect(dialog.args.used).toBe("second");

    first.dispatchEvent(new Event("closed")); // The late close of the first ha-dialog.
    await dialog.updateComplete;
    expect(dialog.args.used).toBe("second");
    expect(closed).toEqual([]);

    second.dispatchEvent(new Event("closed"));
    expect(answers).toEqual([true, false]);
    expect(closed).toEqual(["dialog-closed"]);
  });
});

describe("HA's own dialogs", () => {
  it("ask the questions for confirmations, names and notices", async () => {
    const calls: [string, unknown][] = [];
    window.loadCardHelpers = async () => ({
      showAlertDialog: async (_element, params) => calls.push(["alert", params]),
      showConfirmationDialog: async (_element, params) => (calls.push(["confirm", params]), true),
      showPromptDialog: async (_element, params) => (calls.push(["prompt", params]), "Attic"),
    });
    const host = document.body;
    const confirmed = await confirmDialog(host, {
      heading: "Off",
      message: "Turn off the heating?",
      confirm: "Yes, turn off",
      cancel: "Cancel",
      danger: true,
    });
    const name = await promptDialog(host, { heading: "New zone", label: "Name", value: "", confirm: "Save", cancel: "Cancel" });
    await alertDialog(host, "Floors", "No room is on a floor.");
    expect(confirmed).toBe(true);
    expect(name).toBe("Attic");
    expect(calls).toEqual([
      ["confirm", { title: "Off", text: "Turn off the heating?", confirmText: "Yes, turn off", dismissText: "Cancel", destructive: true }],
      ["prompt", { title: "New zone", inputLabel: "Name", defaultValue: "", confirmText: "Save", dismissText: "Cancel" }],
      ["alert", { title: "Floors", text: "No room is on a floor." }],
    ]);
    delete window.loadCardHelpers;
  });
});
