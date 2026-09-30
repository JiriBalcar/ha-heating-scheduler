// @vitest-environment happy-dom
// Elements are defined only after Home Assistant has defined its root element (and so has
// installed its scoped custom element registry polyfill).
import { describe, expect, it } from "vitest";
import { define } from "../src/components/define";

describe("define", () => {
  it("waits for Home Assistant, then defines at once", async () => {
    class Early extends HTMLElement {}
    define("hs-test-early", Early);
    await Promise.resolve();
    expect(customElements.get("hs-test-early")).toBeUndefined();

    customElements.define("home-assistant", class extends HTMLElement {});
    await customElements.whenDefined("hs-test-early");
    expect(customElements.get("hs-test-early")).toBe(Early);

    class Late extends HTMLElement {}
    define("hs-test-late", Late);
    expect(customElements.get("hs-test-late")).toBe(Late);
  });

  it("keeps the first definition", () => {
    class Other extends HTMLElement {}
    define("hs-test-late", Other);
    expect(customElements.get("hs-test-late")).not.toBe(Other);
  });
});
