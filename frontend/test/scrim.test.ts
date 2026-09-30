// @vitest-environment happy-dom
import { expect, it } from "vitest";
import { acquireScrim, releaseScrim } from "../src/scrim";

const root = document.documentElement.style;
const filter = () => root.getPropertyValue("--ha-dialog-scrim-backdrop-filter");
const color = () => root.getPropertyValue("--mdc-dialog-scrim-color");

it("HA's dialogs dim with an overlay while one of our elements is on the page", () => {
  // HA's own default, from its style sheet, is not a theme.
  const sheet = document.createElement("style");
  sheet.textContent = "html { --ha-dialog-scrim-backdrop-filter: brightness(68%); }";
  document.head.append(sheet);
  acquireScrim(); // the card
  acquireScrim(); // the panel
  expect(filter()).toBe("none");
  expect(color()).toBe("rgba(0, 0, 0, 0.32)");
  releaseScrim();
  expect(filter()).toBe("none");
  releaseScrim();
  expect(filter()).toBe("");
  expect(color()).toBe("");
  sheet.remove();
});

it("a theme's own dimming stays, also one chosen while our card is shown", () => {
  root.setProperty("--ha-dialog-scrim-backdrop-filter", "blur(4px)");
  acquireScrim();
  expect(filter()).toBe("blur(4px)");
  expect(color()).toBe("");
  releaseScrim();
  expect(filter()).toBe("blur(4px)");
  root.removeProperty("--ha-dialog-scrim-backdrop-filter");

  acquireScrim();
  root.setProperty("--ha-dialog-scrim-backdrop-filter", "blur(2px)"); // the user picks a theme
  releaseScrim();
  expect(filter()).toBe("blur(2px)");
  expect(color()).toBe("");
});
