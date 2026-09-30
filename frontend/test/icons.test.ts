// @vitest-environment happy-dom
import { expect, it } from "vitest";
import "../src/card-loader";

it("the card loader gives HA the sidebar dial as a custom icon", async () => {
  const icons = window.customIcons?.["heating-scheduler"];
  expect(icons).toBeDefined();
  const dial = await icons!.getIcon("dial");
  expect(dial.path).toMatch(/^M[MLHVCAZ0-9 .-]+Z$/);
  expect(dial.secondaryPath).toMatch(/^M[MLHVCAZ0-9 .-]+Z$/);
  expect(await icons!.getIconList()).toEqual([{ name: "dial" }]);
  expect(await icons!.getIcon("missing")).toEqual({ path: "" });
});
