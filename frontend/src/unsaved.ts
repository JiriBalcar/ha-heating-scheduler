// Unsaved edits: a view with changes that are not saved tells the panel, and the panel asks before a
// tab switch would drop them.

export const UNSAVED_EVENT = "hs-unsaved";

/** Tell the panel whether `element` has unsaved changes. Call it when that changes. */
export function reportUnsaved(element: HTMLElement, unsaved: boolean): void {
  element.dispatchEvent(new CustomEvent(UNSAVED_EVENT, { detail: unsaved, bubbles: true, composed: true }));
}
