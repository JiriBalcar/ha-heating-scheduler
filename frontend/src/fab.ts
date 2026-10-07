// A view's Save as HA's floating button: the view tells the panel, and the panel shows the button in
// its page's `fab` slot, where HA's editors show theirs. Only a page's direct child can fill that
// slot, so the view cannot show it itself.

export const FAB_EVENT = "hs-fab";

export interface Fab {
  label: string;
  icon: string;
  /** The button slides in while there is something to save. */
  shown: boolean;
  busy: boolean;
  run: () => void;
}

/** Tell the panel how `element`'s floating button looks now. */
export function reportFab(element: HTMLElement, fab: Fab): void {
  element.dispatchEvent(new CustomEvent(FAB_EVENT, { detail: fab, bubbles: true, composed: true }));
}
