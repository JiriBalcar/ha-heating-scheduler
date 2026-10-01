// The sidebar icon module: HA loads it on every page as an extra module, so the panel's dial shows
// in the sidebar. It defines no element, so the order in which HA starts its app and its extra
// modules cannot break it (home-assistant/frontend#53890). The card loads as a dashboard resource.
import { registerIcons } from "./icons";

registerIcons();
