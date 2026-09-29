import { LitElement, html, nothing } from "lit";
import { baseStyles } from "../styles";
import type { HomeAssistant, Snapshot } from "../types";
import { define } from "./define";

/** Plans list and plan editor (Phase 5). */
export class HsPlansView extends LitElement {
  static override properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    planId: { attribute: false },
  };
  declare hass: HomeAssistant;
  declare snapshot: Snapshot;
  declare planId: string | null;

  static override styles = [baseStyles];

  override render() {
    return nothing ?? html``;
  }
}

define("hs-plans-view", HsPlansView);
