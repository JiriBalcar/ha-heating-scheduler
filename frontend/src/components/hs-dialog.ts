import { LitElement, css, html, nothing } from "lit";
import { mdiClose } from "@mdi/js";
import { baseStyles } from "../styles";
import { define } from "./define";
import "./hs-icon";

/**
 * A modal dialog on the native <dialog> element: a bottom sheet on phones,
 * a centred box on larger screens. Fires "hs-closed" when it closes.
 */
export class HsDialog extends LitElement {
  static override properties = {
    heading: {},
    closeLabel: { attribute: "close-label" },
    wide: { type: Boolean },
  };
  declare heading: string;
  declare closeLabel: string;
  declare wide: boolean;

  static override styles = [
    baseStyles,
    css`
      dialog {
        border: none;
        padding: 0;
        margin: auto auto 0;
        width: 100%;
        max-width: 100%;
        max-height: 92vh;
        border-radius: 22px 22px 0 0;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.25);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }
      @media (min-width: 640px) {
        dialog {
          margin: auto;
          max-width: 540px;
          border-radius: 22px;
        }
        :host([wide]) dialog {
          max-width: 760px;
        }
      }
      .frame {
        display: flex;
        flex-direction: column;
        max-height: 92vh;
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 18px 12px 8px 22px;
      }
      h2 {
        flex: 1;
        font-size: 22px;
        line-height: 1.25;
      }
      .close {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: none;
        background: transparent;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .body {
        padding: 8px 22px 16px;
        overflow-y: auto;
        font-size: 18px;
        line-height: 1.45;
      }
      .actions {
        display: flex;
        flex-wrap: wrap-reverse;
        gap: 12px;
        padding: 12px 22px calc(18px + env(safe-area-inset-bottom, 0px));
        border-top: 1px solid var(--divider-color, #e0e0e0);
      }
      ::slotted([slot="actions"]) {
        flex: 1 1 180px;
      }
    `,
  ];

  private get dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  async show(): Promise<void> {
    await this.updateComplete;
    const dialog = this.dialog;
    if (dialog && !dialog.open) dialog.showModal();
  }

  close(): void {
    const dialog = this.dialog;
    if (dialog?.open) dialog.close();
  }

  private onClosed() {
    this.dispatchEvent(new CustomEvent("hs-closed"));
  }

  private onClick(event: MouseEvent) {
    // A click on the backdrop closes the dialog.
    if (event.target === this.dialog) this.close();
  }

  override render() {
    return html`
      <dialog @close=${this.onClosed} @click=${this.onClick} aria-label=${this.heading ?? ""}>
        <div class="frame">
          <header>
            <h2>${this.heading ?? nothing}</h2>
            <button class="close" @click=${this.close} aria-label=${this.closeLabel ?? "Close"}>
              <hs-icon .path=${mdiClose}></hs-icon>
            </button>
          </header>
          <div class="body"><slot></slot></div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </dialog>
    `;
  }
}

define("hs-dialog", HsDialog);

export interface ConfirmOptions {
  heading: string;
  message: string;
  confirm: string;
  cancel: string;
  danger?: boolean;
}

/** A yes/no question. Use `confirmDialog()`. */
export class HsConfirm extends LitElement {
  static override properties = { options: { attribute: false } };
  declare options: ConfirmOptions;
  result = false;

  static override styles = [
    baseStyles,
    css`
      p {
        margin: 0;
      }
    `,
  ];

  get dialog(): HsDialog | null {
    return this.renderRoot.querySelector("hs-dialog");
  }

  private answer(value: boolean) {
    this.result = value;
    this.dialog?.close();
  }

  override render() {
    const o = this.options;
    return html`
      <hs-dialog .heading=${o.heading} .closeLabel=${o.cancel}>
        <p>${o.message}</p>
        <button slot="actions" class="btn" @click=${() => this.answer(false)}>${o.cancel}</button>
        <button
          slot="actions"
          class="btn primary ${o.danger ? "danger" : ""}"
          @click=${() => this.answer(true)}
        >
          ${o.confirm}
        </button>
      </hs-dialog>
    `;
  }
}

define("hs-confirm", HsConfirm);

/** Ask a yes/no question in a dialog. Resolves true if confirmed. */
export async function confirmDialog(host: HTMLElement, options: ConfirmOptions): Promise<boolean> {
  const element = document.createElement("hs-confirm") as HsConfirm;
  element.options = options;
  (host.shadowRoot ?? host).appendChild(element);
  await element.updateComplete;
  const dialog = element.dialog;
  if (!dialog) {
    element.remove();
    return false;
  }
  return new Promise((resolve) => {
    dialog.addEventListener(
      "hs-closed",
      () => {
        element.remove();
        resolve(element.result);
      },
      { once: true },
    );
    void dialog.show();
  });
}
