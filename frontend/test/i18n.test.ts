import { describe, expect, it } from "vitest";
import { cs, en, languageOf, translator } from "../src/i18n";

describe("translations", () => {
  it("have the same keys in Czech and English", () => {
    expect(Object.keys(cs).sort()).toEqual(Object.keys(en).sort());
  });
  it("keep the same placeholders", () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(cs[key]), key).toEqual(placeholders(en[key]));
    }
  });
  it("pick the language and fill placeholders", () => {
    expect(languageOf({ language: "en-GB" } as never)).toBe("en");
    expect(languageOf({ language: "cs" } as never)).toBe("cs");
    expect(languageOf({ language: "de" } as never)).toBe("cs");
    expect(translator("cs")("room.until", { until: "06:00" })).toBe("do 06:00");
  });
});
