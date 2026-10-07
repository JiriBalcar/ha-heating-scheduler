// The integration's own icons, for the sidebar and HA's icon picker: "heating-scheduler:dial" is the
// brand icon (a thermostat dial around a flame) in one colour. HA's <ha-icon> looks up prefixes other
// than mdi in window.customIcons, and draws `secondaryPath` at half opacity, like the dial's track.
// The sidebar icon module (sidebar-icons.ts) registers them on every page (HACS does the same), and
// redraws the dial if HA drew the sidebar first.

export const ICON_PREFIX = "heating-scheduler";

export interface CustomIcon {
  path: string;
  secondaryPath?: string;
  viewBox?: string;
}

export const ICONS: Record<string, CustomIcon> = {
  dial: {
    path: "M4.22 21.19A11 11 0 0 1 19.78 5.63L17.83 7.58A8.25 8.25 0 0 0 6.17 19.24A1.38 1.38 0 0 1 4.22 21.19ZM17.56 7.89A2.32 2.32 0 1 1 22.2 7.89A2.32 2.32 0 1 1 17.56 7.89ZM18.42 7.89A1.46 1.46 0 1 0 21.35 7.89A1.46 1.46 0 1 0 18.42 7.89ZM14.81 13.54C14.7 13.39 14.56 13.27 14.43 13.14C14.1 12.84 13.72 12.63 13.41 12.32C12.67 11.6 12.51 10.4 12.98 9.49C12.51 9.6 12.1 9.86 11.75 10.14C10.47 11.17 9.96 12.98 10.57 14.54C10.59 14.59 10.61 14.64 10.61 14.7C10.61 14.81 10.53 14.91 10.43 14.95C10.32 15 10.2 14.97 10.11 14.89C10.08 14.87 10.06 14.84 10.04 14.81C9.48 14.1 9.39 13.09 9.77 12.28C8.94 12.95 8.49 14.09 8.56 15.16C8.59 15.41 8.62 15.65 8.7 15.9C8.77 16.2 8.9 16.49 9.05 16.75C9.58 17.61 10.51 18.22 11.5 18.35C12.56 18.48 13.69 18.29 14.5 17.55C15.4 16.73 15.72 15.42 15.26 14.29L15.19 14.16C15.09 13.94 14.81 13.54 14.81 13.54M13.25 16.66C13.11 16.77 12.88 16.9 12.71 16.95C12.15 17.15 11.6 16.87 11.27 16.55C11.86 16.41 12.21 15.97 12.32 15.53C12.4 15.14 12.24 14.81 12.18 14.43C12.12 14.07 12.13 13.75 12.26 13.41C12.36 13.6 12.45 13.79 12.57 13.94C12.95 14.43 13.55 14.65 13.68 15.32C13.7 15.39 13.71 15.46 13.71 15.53C13.72 15.94 13.55 16.38 13.25 16.66H13.25Z",
    secondaryPath: "M21.97 8.76A11 11 0 0 1 19.78 21.19A1.38 1.38 0 0 1 17.83 19.24A8.25 8.25 0 0 0 19.48 9.92L21.97 8.76Z",
  },
};

interface CustomIconSet {
  getIcon(name: string): Promise<CustomIcon>;
  getIconList(): Promise<{ name: string }[]>;
}

declare global {
  interface Window {
    customIcons?: Record<string, CustomIconSet>;
  }
}

/** Add our icons to HA's custom icon sets, once. */
export function registerIcons(): void {
  window.customIcons ??= {};
  window.customIcons[ICON_PREFIX] ??= {
    getIcon: async (name) => ICONS[name] ?? { path: "" },
    getIconList: async () => Object.keys(ICONS).map((name) => ({ name })),
  };
}

/** HA's <ha-icon>, with its internal flag for the legacy <iron-icon>. */
interface HaIcon extends HTMLElement {
  icon?: string;
  _legacy?: boolean;
}

/**
 * Redraw our icons that HA drew before they were registered, such as the dial in the sidebar.
 *
 * <ha-icon> draws a prefix it does not know as the legacy <iron-icon>, which HA no longer has, and
 * never looks again: the sidebar shows an empty icon. This happens in pages opened before the
 * integration was added, and when HA draws the sidebar before the icon module ran. `_legacy` is
 * internal to HA (frontend 20260826.7): if HA renames it, this does nothing.
 */
export function redrawIcons(): void {
  for (const icon of haIcons(document)) {
    if (!icon._legacy || !icon.icon?.startsWith(`${ICON_PREFIX}:`)) continue;
    const name = icon.icon;
    icon._legacy = false;
    // A changed value makes <ha-icon> look the icon up again.
    icon.icon = undefined;
    icon.icon = name;
  }
}

/** Every <ha-icon> under `root`, in shadow roots too. */
function haIcons(root: ParentNode): HaIcon[] {
  const found: HaIcon[] = [];
  for (const element of root.querySelectorAll("*")) {
    if (element.localName === "ha-icon") found.push(element as HaIcon);
    if (element.shadowRoot) found.push(...haIcons(element.shadowRoot));
  }
  return found;
}
