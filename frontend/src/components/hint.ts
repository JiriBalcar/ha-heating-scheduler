// An info alert with a text and one action, as the house tile and the house dialog show them.
import { css, html } from "lit";

/**
 * HA's alert makes the button of its own action slot as narrow as the button's longest word, and its
 * narrow layout puts a short text at the right. The text and the button share one wrapping row
 * instead.
 */
export const hintStyles = css`
  ha-alert {
    display: block;
  }
  .hint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
  }
  .hint ha-button {
    margin-inline-start: auto;
  }
`;

export function hint(text: string, action: string, onAction: () => void, disabled: boolean) {
  return html`<ha-alert alert-type="info">
    <div class="hint">
      <span>${text}</span>
      <ha-button appearance="plain" ?disabled=${disabled} @click=${onAction}>${action}</ha-button>
    </div>
  </ha-alert>`;
}
