// @vitest-environment happy-dom
// HA's dialog manager treats an element with a `params` property as its newer dialog type: it
// drops the element after closing and creates the next one without `hass`. Ours must not have one.
import { beforeAll, describe, expect, it } from "vitest";
import "../src/panel";

const DIALOGS = [
  "hs-confirm-dialog",
  "hs-problem-dialog",
  "hs-holiday-dialog",
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
});
