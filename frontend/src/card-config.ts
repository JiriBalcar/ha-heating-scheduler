// The dashboard card's configuration and its size in a dashboard's grid (sections view). The
// card is the house tile, or a zone's tile: a row for the name and a row for the modes, like HA's
// tile card with one feature. Rooms and boosts use HA's own tile cards (user's decision,
// 2026-10-01). Shared by the small card loader and the card itself.
import type { CardConfig } from "./types";

export interface GridOptions {
  columns: number;
  min_columns: number;
  rows: number;
  min_rows: number;
}

/** Check a card configuration. */
export function checkCardConfig(config: CardConfig): void {
  if (!config || typeof config !== "object") throw new Error("Invalid configuration");
  if (config.zone !== undefined && typeof config.zone !== "string") throw new Error("zone must be a zone id");
}

export function gridOptions(): GridOptions {
  return { columns: 12, min_columns: 6, rows: 2, min_rows: 2 };
}

/**
 * True when the grid gives the card a fixed height, as HA's tile card decides it: the tile then
 * fills it with HA's fixed info height, and the hints above the tile have no room.
 */
export function fixedHeight(config: CardConfig | undefined, layout: string | undefined): boolean {
  return layout === "grid" && config?.grid_options?.rows !== "auto";
}
