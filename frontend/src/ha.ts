// Home Assistant's own elements, dialogs and messages.
//
// HA guarantees none of its elements to a custom panel: they come with chunks that HA loads in
// the background (mostly for its entity dialog). The panel waits for the ones it uses.

/** HA elements that the panel and the card use. */
export const HA_ELEMENTS = [
  "hass-tabs-subpage",
  "ha-card",
  "ha-alert",
  "ha-button",
  "ha-icon-button",
  "ha-svg-icon",
  "ha-dialog",
  "ha-dialog-header",
  "ha-dialog-footer",
  "ha-tile-container",
  "ha-tile-icon",
  "ha-tile-info",
  "ha-tile-badge",
  "ha-control-button",
  "ha-control-button-group",
  "ha-control-number-buttons",
  "ha-control-select",
] as const;

/** Wait until the given elements are defined, at most `timeout` ms. Returns those still missing. */
export async function whenDefined(tags: readonly string[], timeout = 10000): Promise<string[]> {
  const pending = tags.filter((tag) => !customElements.get(tag));
  if (pending.length) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      Promise.all(pending.map((tag) => customElements.whenDefined(tag))),
      new Promise((resolve) => (timer = setTimeout(resolve, timeout))),
    ]);
    clearTimeout(timer);
  }
  return tags.filter((tag) => !customElements.get(tag));
}

/** Fire an event that crosses shadow roots, as HA's own `fireEvent` does. */
export function fire<T>(node: EventTarget, type: string, detail?: T): void {
  node.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
}

/** Show a short message in HA's own toast. */
export function showToast(node: HTMLElement, message: string): void {
  fire(node, "hass-notification", { message });
}

/**
 * Open one of our dialogs through HA's dialog manager. HA creates the element once, gives it
 * `hass`, calls `showDialog(params)` and closes the top dialog on Back.
 */
export function showDialog<P>(node: HTMLElement, dialogTag: string, dialogParams: P): void {
  fire(node, "show-dialog", {
    dialogTag,
    dialogImport: () => customElements.whenDefined(dialogTag),
    dialogParams,
  });
}
