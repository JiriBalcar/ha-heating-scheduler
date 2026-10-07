// @vitest-environment happy-dom
import { expect, it } from "vitest";
import { ICONS, redrawIcons, registerIcons } from "../src/icons";
import "../src/sidebar-icons";

/** HA's <ha-icon> (frontend 20260930.2), reduced to how it looks up an icon. */
class FakeHaIcon extends HTMLElement {
  _legacy = false;
  path?: string;
  private name?: string;

  get icon(): string | undefined {
    return this.name;
  }

  set icon(name: string | undefined) {
    this.name = name;
    if (!name) return;
    const [prefix, icon] = name.split(":", 2);
    if (prefix === "mdi") {
      this._legacy = false;
      this.path = `mdi:${icon}`;
      return;
    }
    // A prefix it does not know: the legacy <iron-icon>, for good. A known one keeps the flag.
    const icons = window.customIcons?.[prefix];
    if (!icons) {
      this._legacy = true;
      return;
    }
    void icons.getIcon(icon).then((found) => {
      if (this.name === name) this.path = found.path;
    });
  }
}
customElements.define("ha-icon", FakeHaIcon);

const settle = () => new Promise((resolve) => setTimeout(resolve));

it("the sidebar icon module gives HA the dial as a custom icon", async () => {
  const icons = window.customIcons?.["heating-scheduler"];
  expect(icons).toBeDefined();
  const dial = await icons!.getIcon("dial");
  expect(dial.path).toMatch(/^M[MLHVCAZ0-9 .-]+Z$/);
  expect(dial.secondaryPath).toMatch(/^M[MLHVCAZ0-9 .-]+Z$/);
  expect(await icons!.getIconList()).toEqual([{ name: "dial" }]);
  expect(await icons!.getIcon("missing")).toEqual({ path: "" });
});

it("a dial that HA drew before the icons were registered is drawn again", async () => {
  delete window.customIcons?.["heating-scheduler"];
  const sidebar = document.body.appendChild(document.createElement("div"));
  const root = sidebar.attachShadow({ mode: "open" });
  const icon = (name: string) => {
    const element = root.appendChild(document.createElement("ha-icon")) as FakeHaIcon;
    element.icon = name;
    return element;
  };
  const dial = icon("heating-scheduler:dial");
  const foreign = icon("other:icon");
  const mdi = icon("mdi:radiator");
  expect(dial._legacy).toBe(true);

  registerIcons();
  redrawIcons();
  await settle();
  expect(dial._legacy).toBe(false);
  expect(dial.icon).toBe("heating-scheduler:dial");
  expect(dial.path).toBe(ICONS.dial.path);
  // Not ours: left as HA drew them.
  expect(foreign._legacy).toBe(true);
  expect(mdi.path).toBe("mdi:radiator");
  sidebar.remove();
});
