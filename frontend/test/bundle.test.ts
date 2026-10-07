// @vitest-environment happy-dom
import { beforeAll, expect, it } from "vitest";
import "../src/panel";

beforeAll(() => {
  // Our elements are defined once Home Assistant has defined its root element.
  customElements.define("home-assistant", class extends HTMLElement {});
});

it("the panel bundle defines the dashboard card too, for pages opened before the card loader", async () => {
  await customElements.whenDefined("heating-scheduler-card");
  expect(window.customCards?.filter((card) => card.type === "heating-scheduler-card")).toHaveLength(1);
});

it("the panel bundle registers the sidebar dial too, for pages opened before the icon module", () => {
  expect(window.customIcons?.["heating-scheduler"]).toBeDefined();
});
