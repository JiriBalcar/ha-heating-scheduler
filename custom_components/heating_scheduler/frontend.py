"""Serve the frontend bundles, and register the sidebar panel, its icon and the dashboard card.

The card loads as a dashboard resource, the way Home Assistant documents cards: dashboards load
their resources after Home Assistant's app has started. An extra module (`add_extra_js_url`)
starts in parallel with the app and can define its elements before the app's element registry is
in place (home-assistant/frontend#53890); with the card loaded that way, the Android app showed
"Custom element doesn't exist" on every start (2026-10-01). Only the sidebar icon stays an extra
module, because it must load on every page; it defines no element.

Home Assistant has no public API for an integration's dashboard resource. Like HACS, this uses
Lovelace's resource collection.
"""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http.server import StaticPathConfig
from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
import probatio

from .const import (
    CARD_FILE,
    DOMAIN,
    ICONS_FILE,
    PANEL_COMPONENT,
    PANEL_FILE,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STATIC_URL,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

DIST = Path(__file__).parent / "dist"
CARD_PATH = f"{STATIC_URL}/{CARD_FILE}"
_DATA_KEY = f"{DOMAIN}_frontend"


def _cache_key() -> str:
    """Return a short hash of the bundles, so browsers load new code after updates."""
    digest = hashlib.sha256(VERSION.encode())
    for name in (PANEL_FILE, CARD_FILE, ICONS_FILE):
        path = DIST / name
        if path.exists():
            digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


def _is_card(resource: dict[str, Any]) -> bool:
    """Return True for a dashboard resource that loads our card, in any version."""
    return urlsplit(str(resource.get("url", ""))).path == CARD_PATH


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Serve `dist/`; add the panel, the sidebar icon module and the card's dashboard resource."""
    data: dict[str, str] = hass.data.setdefault(_DATA_KEY, {})
    if "key" not in data:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(DIST), cache_headers=False)]
        )
        data["key"] = await hass.async_add_executor_job(_cache_key)
    key = data["key"]
    icons_url = f"{STATIC_URL}/{ICONS_FILE}?v={key}"
    data["icons_url"] = icons_url
    frontend.add_extra_js_url(hass, icons_url)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{STATIC_URL}/{PANEL_FILE}?v={key}",
        require_admin=False,
        config={},
        # The panel uses HA's page layout, which keeps clear of the safe areas itself.
        handle_safe_area=True,
    )
    await _async_keep_card_resource(hass, f"{CARD_PATH}?v={key}")


async def _async_keep_card_resource(hass: HomeAssistant, url: str) -> None:
    """Keep exactly one dashboard resource for the card, at `url`.

    Resources kept in YAML cannot be changed from here: the log says what to add.
    """
    resources = hass.data[LOVELACE_DATA].resources
    if not isinstance(resources, ResourceStorageCollection):
        if not any(_is_card(item) for item in resources.async_items()):
            _LOGGER.warning(
                "Dashboard resources are kept in YAML: add %s as a resource of type module "
                "to show the Heating Scheduler card",
                CARD_PATH,
            )
        return
    try:
        await resources.async_get_info()  # Loads the stored resources.
        ours = [item for item in resources.async_items() if _is_card(item)]
        if not ours:
            await resources.async_create_item({"res_type": "module", "url": url})
            return
        first, *others = ours
        if first.get("url") != url or first.get("type") != "module":
            await resources.async_update_item(first["id"], {"res_type": "module", "url": url})
        for item in others:
            await resources.async_delete_item(item["id"])
    except (HomeAssistantError, probatio.Invalid) as err:
        _LOGGER.warning("Could not add the Heating Scheduler card to the dashboards: %s", err)


async def async_remove_card_resource(hass: HomeAssistant) -> None:
    """Remove the card's dashboard resource, when the integration is removed."""
    resources = hass.data[LOVELACE_DATA].resources
    if not isinstance(resources, ResourceStorageCollection):
        return
    await resources.async_get_info()
    for item in [item for item in resources.async_items() if _is_card(item)]:
        await resources.async_delete_item(item["id"])


@callback
def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Remove the panel and the sidebar icon module.

    The card's dashboard resource stays until the integration is removed, so a reload does not
    change the stored resources.
    """
    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    data: dict[str, str] = hass.data.get(_DATA_KEY, {})
    if icons_url := data.pop("icons_url", None):
        frontend.remove_extra_js_url(hass, icons_url)
