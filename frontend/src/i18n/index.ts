// Translation lookup. Czech is the default; English is used for English users.
import { cs } from "./cs";
import { en, type TextKey } from "./en";
import type { HomeAssistant } from "../types";

export type Lang = "cs" | "en";
export type { TextKey };

const DICTIONARIES: Record<Lang, Record<TextKey, string>> = { cs, en };

/** Pick the language from the user's Home Assistant language. */
export function languageOf(hass: Pick<HomeAssistant, "language" | "locale"> | undefined): Lang {
  const tag = (hass?.locale?.language ?? hass?.language ?? "").toLowerCase();
  if (tag.startsWith("en")) return "en";
  return "cs";
}

export type Translate = (key: TextKey, params?: Record<string, string | number>) => string;

export function translator(lang: Lang): Translate {
  const dictionary = DICTIONARIES[lang];
  return (key, params) => {
    let text: string = dictionary[key] ?? en[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.split(`{${name}}`).join(String(value));
      }
    }
    return text;
  };
}

export const ALL_KEYS = Object.keys(en) as TextKey[];
export { cs, en };
