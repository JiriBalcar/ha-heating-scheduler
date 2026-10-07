// @vitest-environment happy-dom
import { beforeAll, expect, it } from "vitest";
import "../src/panel";
import { reportFab } from "../src/fab";
import { reportUnsaved } from "../src/unsaved";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

beforeAll(async () => {
  // Our elements are defined once Home Assistant has defined its root element.
  customElements.define("home-assistant", class extends HTMLElement {});
  await customElements.whenDefined("heating-scheduler-panel");
});

const settle = () => new Promise((resolve) => setTimeout(resolve));

it("asks before a tab switch drops unsaved edits, and stays unless they are discarded", async () => {
  const asked: unknown[] = [];
  let discard = false;
  window.loadCardHelpers = async () => ({
    showAlertDialog: async () => undefined,
    showConfirmationDialog: async (_element, params) => (asked.push(params), discard),
    showPromptDialog: async () => null,
  });
  const panel = document.createElement("heating-scheduler-panel") as Any;
  panel.hass = {
    language: "en",
    locale: { language: "en" },
    config: { time_zone: "Europe/Prague" },
    states: {},
    connection: { subscribeMessage: async () => async () => undefined },
    callWS: async () => undefined,
  };
  panel.route = { prefix: "/heating-scheduler", path: "/temperatures" };
  document.body.appendChild(panel);
  await panel.updateComplete;

  // A view on the Temperatures tab has unsaved edits; HA switches to the Plans tab.
  const view = panel.appendChild(document.createElement("div"));
  reportUnsaved(view, true);
  history.pushState(null, "", "/heating-scheduler/plans");
  panel.route = { prefix: "/heating-scheduler", path: "/plans" };
  await panel.updateComplete;
  await settle();
  expect(asked).toHaveLength(1);
  expect(panel.path).toBe("/temperatures");
  expect(location.pathname).toBe("/heating-scheduler/temperatures");

  // Discard: the panel goes to the tab.
  discard = true;
  panel.route = { prefix: "/heating-scheduler", path: "/plans" };
  await panel.updateComplete;
  await settle();
  expect(asked).toHaveLength(2);
  expect(location.pathname).toBe("/heating-scheduler/plans");
  panel.route = { prefix: "/heating-scheduler", path: "/plans" };
  await panel.updateComplete;
  expect(panel.path).toBe("/plans");

  // Without unsaved edits, no question.
  panel.route = { prefix: "/heating-scheduler", path: "/advanced" };
  await panel.updateComplete;
  expect(asked).toHaveLength(2);
  expect(panel.path).toBe("/advanced");
  delete window.loadCardHelpers;
});

it("shows a view's Save as HA's floating button, until another view is on screen", async () => {
  const panel = document.createElement("heating-scheduler-panel") as Any;
  panel.hass = {
    language: "en",
    locale: { language: "en" },
    config: { time_zone: "Europe/Prague" },
    states: {},
    connection: { subscribeMessage: async () => async () => undefined },
    callWS: async () => undefined,
  };
  panel.route = { prefix: "/heating-scheduler", path: "/advanced/settings" };
  document.body.appendChild(panel);
  panel.ready = true;
  await panel.updateComplete;

  let saved = 0;
  const view = panel.appendChild(document.createElement("div"));
  const fab = { label: "Save", icon: "M0,0H24V24H0Z", shown: false, busy: false, run: () => (saved += 1) };
  const button = () => panel.shadowRoot.querySelector('ha-button[slot="fab"]');
  reportFab(view, fab);
  await panel.updateComplete;
  expect(button().classList.contains("shown")).toBe(false);
  expect(panel.shadowRoot.querySelector("hass-tabs-subpage").hasFab).toBe(true);
  reportFab(view, { ...fab, shown: true });
  await panel.updateComplete;
  expect(button().classList.contains("shown")).toBe(true);
  button().click();
  expect(saved).toBe(1);

  panel.route = { prefix: "/heating-scheduler", path: "/advanced/rooms" };
  await panel.updateComplete;
  expect(button()).toBeNull();
  panel.remove();
});
