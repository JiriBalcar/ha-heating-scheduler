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
    expect(languageOf({ language: "cs-CZ" } as never)).toBe("cs");
    // Any other language gets English, also a language whose code only starts like Czech.
    expect(languageOf({ language: "de" } as never)).toBe("en");
    expect(languageOf({ language: "csb" } as never)).toBe("en");
    expect(languageOf(undefined)).toBe("en");
    // The user's own language in their profile wins over the language of the system.
    expect(languageOf({ language: "cs", locale: { language: "de" } } as never)).toBe("en");
    expect(translator("cs")("room.until", { until: "06:00" })).toBe("do 06:00");
  });
});
