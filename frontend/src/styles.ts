// Shared styles. Sizes, fonts and colours come from Home Assistant's theme tokens.
import { css } from "lit";

export const baseStyles = css`
  :host {
    font-family: var(--ha-font-family-body, Roboto, Noto, sans-serif);
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.6);
    color: var(--primary-text-color, #212121);
    -webkit-font-smoothing: var(--ha-font-smoothing, antialiased);
    -webkit-tap-highlight-color: transparent;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  button {
    font: inherit;
    color: inherit;
  }
  button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .muted {
    color: var(--secondary-text-color);
  }
  h2,
  h3 {
    margin: 0;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;

/**
 * Rows of HA's lists (`ha-list-item-button` in `ha-list-base`). HA cuts a row's texts to one line
 * with "…"; ours wrap, so a long valve name or description stays readable on a phone. HA's own
 * pages do the same through these parts.
 */
export const listStyles = css`
  ha-list-item-button::part(headline),
  ha-list-item-button::part(supporting-text) {
    white-space: normal;
  }
  ha-list-item-button > ha-svg-icon[slot="end"] {
    color: var(--secondary-text-color);
  }
`;
