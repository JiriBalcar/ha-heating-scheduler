// The sidebar icon module: HA loads it on every page as an extra module, so the panel's dial shows
// in the sidebar. It defines no element, so the order in which HA starts its app and its extra
// modules cannot break HA's app (home-assistant/frontend#53890); if HA drew the sidebar first, the
// dial is redrawn. The card loads as a dashboard resource.
//
// Because it runs on every page, it also sets how HA's dialogs dim the page (scrim.ts): the seam
// Chrome draws with HA's own dimming showed on any page once the integration was installed.
import { redrawIcons, registerIcons } from "./icons";
import { acquireScrim } from "./scrim";

registerIcons();
redrawIcons();
acquireScrim();
