// Shared styles. Colours come from the Home Assistant theme, so light and dark work.
import { css } from "lit";

export const baseStyles = css`
  :host {
    /* Filled buttons: white text on this colour passes WCAG AA in light and dark themes. */
    --hs-accent: #1565c0;
    font-family: var(
      --ha-font-family-body,
      var(--paper-font-body1_-_font-family, Roboto, "Noto Sans", system-ui, sans-serif)
    );
    color: var(--primary-text-color, #212121);
    -webkit-tap-highlight-color: transparent;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  button,
  input,
  select {
    font: inherit;
    color: inherit;
  }
  .btn {
    min-height: 52px;
    min-width: 52px;
    padding: 0 20px;
    border-radius: 14px;
    border: 2px solid var(--divider-color, #c4c4c4);
    background: var(--card-background-color, #fff);
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
    touch-action: manipulation;
  }
  .btn.primary {
    background: var(--hs-accent, #1565c0);
    border-color: var(--hs-accent, #1565c0);
    color: #fff;
  }
  .btn.danger {
    color: var(--error-color, #c62828);
    border-color: var(--error-color, #c62828);
  }
  .btn.danger.primary {
    background: #c62828;
    border-color: #c62828;
    color: #fff;
  }
  .btn.wide {
    width: 100%;
  }
  .btn.small {
    min-height: 48px;
    font-size: 15px;
    padding: 0 14px;
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--primary-color, #1565c0);
    outline-offset: 2px;
  }
  .card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 16px);
    box-shadow: var(--ha-card-box-shadow, none);
    border: var(--ha-card-border-width, 1px) solid
      var(--ha-card-border-color, var(--divider-color, #e0e0e0));
  }
  .muted {
    color: var(--secondary-text-color, #5f6368);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px 6px 10px;
    border-radius: 999px;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    white-space: nowrap;
    --hs-icon-size: 22px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 16px;
  }
  .field > span {
    font-weight: 600;
  }
  .input,
  select.input {
    min-height: 52px;
    padding: 0 14px;
    border-radius: 12px;
    border: 2px solid var(--divider-color, #c4c4c4);
    background: var(--card-background-color, #fff);
    font-size: 18px;
    width: 100%;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .grow {
    flex: 1 1 auto;
    min-width: 0;
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
