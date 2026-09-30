// How HA's dialogs dim the page while our card or panel is on it.
//
// HA dims the page behind a dialog with `backdrop-filter: brightness(68%)`. Chrome can draw that
// filter with a seam: a thin line across the whole page, darkened twice. It shows on pages whose
// content has its own compositing layers, such as the house tile's selector (seen with HA's entity
// dialog on a dashboard with our cards, 2026-09-30). A black overlay of 32 % dims exactly as much
// and is drawn in one pass. Our own dialogs set it on themselves (hs-dialog.ts); HA's dialogs get
// it from the page root while one of our elements is on the page. A theme that sets its own
// dimming keeps it.

const FILTER = "--ha-dialog-scrim-backdrop-filter";
const COLOR = "--mdc-dialog-scrim-color";
const NO_FILTER = "none";
const OVERLAY = "rgba(0, 0, 0, 0.32)";

let users = 0;
let applied = false;

/** An element of ours is on the page: HA's dialogs dim with the overlay. */
export function acquireScrim(): void {
  users += 1;
  if (applied) return;
  // HA's own default comes from its style sheet; a theme sets its values on the page root itself.
  const root = document.documentElement.style;
  if (root.getPropertyValue(FILTER) || root.getPropertyValue(COLOR)) return;
  root.setProperty(FILTER, NO_FILTER);
  root.setProperty(COLOR, OVERLAY);
  applied = true;
}

/** An element of ours left the page; the last one gives HA its own dimming back. */
export function releaseScrim(): void {
  users = Math.max(0, users - 1);
  if (users > 0 || !applied) return;
  // Only our own values: a theme chosen in the meantime keeps its dimming.
  const root = document.documentElement.style;
  if (root.getPropertyValue(FILTER) === NO_FILTER) root.removeProperty(FILTER);
  if (root.getPropertyValue(COLOR) === OVERLAY) root.removeProperty(COLOR);
  applied = false;
}
