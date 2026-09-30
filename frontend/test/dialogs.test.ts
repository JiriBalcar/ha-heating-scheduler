// @vitest-environment happy-dom
// HA's dialog manager treats an element with a `params` property as its newer dialog type: it
// drops the element after closing and creates the next one without `hass`. Ours must not have one.
import { beforeAll, describe, expect, it } from "vitest";
import "../src/panel";

const DIALOGS = [
  "hs-confirm-dialog",
  "hs-problem-dialog",
  "hs-holiday-dialog",
  "hs-house-dialog",
  "hs-block-sheet",
  "hs-copy-dialog",
  "hs-save-plan-dialog",
  "hs-new-plan-dialog",
  "hs-room-dialog",
  "hs-import-rooms-dialog",
  "hs-zone-dialog",
  "hs-floors-dialog",
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
    const dialog = document.createElement("hs-confirm-dialog") as Any;
    dialog.hass = { language: "en", locale: { language: "en" } };
    document.body.appendChild(dialog);
    const closed: string[] = [];
    dialog.addEventListener("dialog-closed", () => closed.push("dialog-closed"));
    const answers: boolean[] = [];
    const ask = (message: string) =>
      dialog.showDialog({ heading: "Heading", message, confirm: "Yes", cancel: "No", resolve: (ok: boolean) => answers.push(ok) });

    ask("first");
    await dialog.updateComplete;
    const first = dialog.shadowRoot.querySelector("ha-dialog");
    dialog.answer(true); // Yes: the ha-dialog starts closing.
    ask("second"); // Opened again before the first "closed".
    await dialog.updateComplete;
    await dialog.updateComplete;
    expect(answers).toEqual([true]);
    const second = dialog.shadowRoot.querySelector("ha-dialog");
    expect(second).not.toBe(first);
    expect(dialog.args.message).toBe("second");

    first.dispatchEvent(new Event("closed")); // The late close of the first ha-dialog.
    await dialog.updateComplete;
    expect(dialog.args.message).toBe("second");
    expect(closed).toEqual([]);

    second.dispatchEvent(new Event("closed"));
    expect(answers).toEqual([true, false]);
    expect(closed).toEqual(["dialog-closed"]);
  });
});
