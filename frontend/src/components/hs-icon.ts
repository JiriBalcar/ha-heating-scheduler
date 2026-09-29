import { LitElement, css, html } from "lit";
import { define } from "./define";

/** An MDI icon from a bundled SVG path. */
export class HsIcon extends LitElement {
  static override properties = { path: {} };
  declare path: string;

  static override styles = css`
    :host {
      display: inline-flex;
      width: var(--hs-icon-size, 24px);
      height: var(--hs-icon-size, 24px);
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `;

  override render() {
    return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${this.path ?? ""}></path></svg>`;
  }
}

define("hs-icon", HsIcon);
