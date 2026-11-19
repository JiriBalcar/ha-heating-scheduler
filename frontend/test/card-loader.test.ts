// @vitest-environment happy-dom
// The card's entry in HA's card picker: Czech for Czech users, English for everybody else.
import { afterEach, expect, it, vi } from "vitest";

const pickerEntries = () => window.customCards ?? [];

/** Load the card loader afresh, as on a page in `language`, and return its picker entry. */
async function pickerEntry(language: string) {
  document.documentElement.lang = language;
  delete window.customCards;
  vi.resetModules();
  await import("../src/card-loader");
  return pickerEntries().find((card) => card.type === "heating-scheduler-card");
}

afterEach(() => {
  document.documentElement.lang = "";
});

it.each(["cs", "cs-CZ"])("describes the card in Czech for %s", async (language) => {
  expect((await pickerEntry(language))?.description).toMatch(/^Režim domu nebo zóny/);
});

it.each(["en-GB", "de", "sk"])("describes the card in English for %s", async (language) => {
  expect((await pickerEntry(language))?.description).toMatch(/^The mode of the house or a zone/);
});
