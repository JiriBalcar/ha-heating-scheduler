import { LitElement, html, nothing } from "lit";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";

/** Advanced settings (Phase 6). */
export class HsAdvancedView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    section: { attribute: false },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare section: string;

  static override styles = [baseStyles];

  override render() {
    return nothing ?? html``;
  }
}

define("hs-advanced-view", HsAdvancedView);
