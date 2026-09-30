import { LitElement, type PropertyDeclarations } from "lit";
import { fire, haDialogs } from "../ha";
import type { Translate } from "../i18n";
import type { HomeAssistant } from "../types";

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

/**
 * Ask a yes/no question in HA's own confirmation dialog. Resolves true if confirmed. Without HA's
 * dialogs, the browser asks.
 */
export async function confirmDialog(host: HTMLElement, options: ConfirmOptions): Promise<boolean> {
  const dialogs = await haDialogs();
  if (!dialogs) return window.confirm(`${options.heading}\n\n${options.message}`);
  return dialogs.showConfirmationDialog(host, {
    title: options.heading,
    text: options.message,
    confirmText: options.confirm,
    dismissText: options.cancel,
    destructive: options.danger,
  });
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

export interface PromptOptions {
  heading: string;
  label: string;
  value: string;
  confirm: string;
  cancel: string;
}

/** Ask for a text in HA's own prompt dialog. Resolves the text, or null if cancelled. */
export async function promptDialog(host: HTMLElement, options: PromptOptions): Promise<string | null> {
  const dialogs = await haDialogs();
  if (!dialogs) return window.prompt(options.heading, options.value);
  return dialogs.showPromptDialog(host, {
    title: options.heading,
    inputLabel: options.label,
    defaultValue: options.value,
    confirmText: options.confirm,
    dismissText: options.cancel,
  });
}

/** Tell something in HA's own alert dialog. */
export async function alertDialog(host: HTMLElement, heading: string, message: string): Promise<void> {
  const dialogs = await haDialogs();
  if (dialogs) await dialogs.showAlertDialog(host, { title: heading, text: message });
  else window.alert(`${heading}\n\n${message}`);
}
