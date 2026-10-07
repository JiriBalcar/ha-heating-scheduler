// The sidebar icon module: HA loads it on every page as an extra module, so the panel's dial shows
// in the sidebar. It defines no element, so the order in which HA starts its app and its extra
// modules cannot break HA's app (home-assistant/frontend#53890); if HA drew the sidebar first, the
// dial is redrawn. The card loads as a dashboard resource.
import { redrawIcons, registerIcons } from "./icons";

registerIcons();
redrawIcons();
