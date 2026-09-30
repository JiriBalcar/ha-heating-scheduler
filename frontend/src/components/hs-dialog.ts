import { LitElement, css, html, nothing, type PropertyDeclarations } from "lit";
import { fire, showDialog } from "../ha";
import type { Translate } from "../i18n";
import type { HomeAssistant } from "../types";
import { define } from "./define";

/**
 * A dialog that Home Assistant's dialog manager shows (see `showDialog` in ../ha). HA creates the
 * element once, sets `hass`, calls `showDialog(params)`, and calls `closeDialog()` on Back.
 * Subclasses render `<ha-dialog .open=${this.open} @closed=${this.onClosed}>` while `args` is set,
 * and nothing without it.
 *
 * The parameters are kept in `args`, not `params`: HA takes an element with a `params` property
 * for its newer dialog type, drops it after closing and creates the next one without `hass`.
 */
export class HsHaDialog<P> extends LitElement {
  static override properties: PropertyDeclarations = {
    hass: { attribute: false },
    args: { state: true },
    open: { state: true },
  };
  declare hass: HomeAssistant;
  declare args: P | undefined;
  declare open: boolean;

  constructor() {
    super();
    this.open = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // HA dims the page behind a dialog with `backdrop-filter: brightness(68%)`. Browsers can draw
    // that filter with a seam: a thin line across the whole page that is darkened twice. A black
    // overlay of 32 % dims exactly as much and has no seams.
    this.style.setProperty("--ha-dialog-scrim-backdrop-filter", "none");
    this.style.setProperty("--mdc-dialog-scrim-color", "rgba(0, 0, 0, 0.32)");
  }

  showDialog(params: P): void {
    if (this.args === undefined) {
      this.start(params);
      return;
    }
    // The last opening is still shown, or still closing. It ends here, and its caller gets what was
    // chosen. A new ha-dialog shows the new opening: the old one's "closed" can come later, and it
    // must not close the new opening (onClosed ignores an ha-dialog that is no longer shown).
    this.dialogClosed();
    this.args = undefined;
    void this.updateComplete.then(() => this.start(params));
  }

  private start(params: P) {
    this.dialogOpened(params);
    this.args = params;
    this.open = true;
  }

  closeDialog(): boolean {
    this.open = false;
    return true;
  }

  /** Runs when an opening starts, before `args` is set: subclasses set their fields up here. */
  protected dialogOpened(_params: P): void {}

  /** Runs when an opening has ended (closed, or replaced by a new one), before `args` is cleared. */
  protected dialogClosed(): void {}

  protected onClosed(event: Event): void {
    // Only the ha-dialog on screen: not a "closed" event of a field inside it, and not the late
    // "closed" of an ha-dialog that a new opening has replaced.
    if (event.target !== event.currentTarget || !(event.target as Element).isConnected) return;
    this.dialogClosed();
    this.args = undefined;
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

  protected override dialogOpened(): void {
    this.confirmed = false;
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.confirmed);
  }

  private answer(confirmed: boolean) {
    this.confirmed = confirmed;
    this.closeDialog();
  }

  override render() {
    const p = this.args;
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
