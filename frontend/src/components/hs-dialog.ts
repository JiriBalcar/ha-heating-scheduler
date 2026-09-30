import { LitElement, css, html, nothing, type PropertyDeclarations } from "lit";
import { mdiClose } from "@mdi/js";
import { fire, showDialog } from "../ha";
import type { Translate } from "../i18n";
import { baseStyles } from "../styles";
import type { HomeAssistant } from "../types";
import { define } from "./define";
import "./hs-icon";

/**
 * Legacy: a modal dialog on the native <dialog> element, until every dialog uses HsHaDialog.
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

/**
 * A dialog that Home Assistant's dialog manager shows (see `showDialog` in ../ha). HA creates the
 * element once, sets `hass`, calls `showDialog(params)`, and calls `closeDialog()` on Back.
 * Subclasses render `<ha-dialog .open=${this.open} @closed=${this.onClosed}>`.
 */
export class HsHaDialog<P> extends LitElement {
  static override properties: PropertyDeclarations = {
    hass: { attribute: false },
    params: { state: true },
    open: { state: true },
  };
  declare hass: HomeAssistant;
  declare params: P | undefined;
  declare open: boolean;

  constructor() {
    super();
    this.open = false;
  }

  showDialog(params: P): void {
    this.params = params;
    this.open = true;
  }

  closeDialog(): boolean {
    this.open = false;
    return true;
  }

  /** Runs when the dialog has closed, before `params` is cleared. */
  protected dialogClosed(): void {}

  protected onClosed(event: Event): void {
    // Only the dialog itself, not a "closed" event of a field inside it.
    if (event.target !== event.currentTarget) return;
    this.dialogClosed();
    this.params = undefined;
    fire(this, "dialog-closed", { dialog: this.localName });
  }
}

export interface ConfirmOptions {
  heading: string;
  message: string;
  confirm: string;
  cancel: string;
  danger?: boolean;
}

interface ConfirmParams extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/** A yes/no question. Use `confirmDialog()`. */
export class HsConfirmDialog extends HsHaDialog<ConfirmParams> {
  private confirmed = false;

  static override styles = css`
    p {
      margin: 0;
    }
  `;

  override showDialog(params: ConfirmParams): void {
    // A new question replaces one that is still open.
    this.params?.resolve(false);
    this.confirmed = false;
    super.showDialog(params);
  }

  protected override dialogClosed(): void {
    this.params?.resolve(this.confirmed);
  }

  private answer(confirmed: boolean) {
    this.confirmed = confirmed;
    this.closeDialog();
  }

  override render() {
    const p = this.params;
    if (!p) return nothing;
    return html`
      <ha-dialog .open=${this.open} type="alert" prevent-scrim-close @closed=${this.onClosed}>
        <ha-dialog-header slot="header">
          <span slot="title">${p.heading}</span>
        </ha-dialog-header>
        <p>${p.message}</p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.answer(false)}>
            ${p.cancel}
          </ha-button>
          <ha-button
            slot="primaryAction"
            variant=${p.danger ? "danger" : "brand"}
            @click=${() => this.answer(true)}
          >
            ${p.confirm}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-confirm-dialog", HsConfirmDialog);

/** Ask a yes/no question in HA's dialog. Resolves true if confirmed. */
export function confirmDialog(host: HTMLElement, options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => showDialog(host, "hs-confirm-dialog", { ...options, resolve }));
}

/** Ask what to do when the edited item was changed elsewhere. Resolves true to keep mine. */
export function keepMineDialog(host: HTMLElement, t: Translate): Promise<boolean> {
  return confirmDialog(host, {
    heading: t("common.conflict_title"),
    message: t("common.conflict_message"),
    confirm: t("common.overwrite"),
    cancel: t("common.discard_mine"),
  });
}
