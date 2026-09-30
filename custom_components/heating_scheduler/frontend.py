"""Serve the frontend bundles, register the sidebar panel and load the card."""

from __future__ import annotations

import hashlib
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http.server import StaticPathConfig
from homeassistant.core import HomeAssistant, callback

from .const import (
    CARD_FILE,
    DOMAIN,
    PANEL_COMPONENT,
    PANEL_FILE,
    PANEL_URL_PATH,
    STATIC_URL,
    VERSION,
)
from .core.text import language

DIST = Path(__file__).parent / "dist"
_DATA_KEY = f"{DOMAIN}_frontend"
SIDEBAR_TITLES = {"cs": "Topení", "en": "Heating"}


def _cache_key() -> str:
    """Return a short hash of the bundles, so browsers load new code after updates."""
    digest = hashlib.sha256(VERSION.encode())
    for name in (PANEL_FILE, CARD_FILE):
        path = DIST / name
        if path.exists():
            digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Serve `dist/`, add the panel and the card module."""
    data: dict[str, str] = hass.data.setdefault(_DATA_KEY, {})
    if "key" not in data:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(DIST), cache_headers=False)]
        )
        data["key"] = await hass.async_add_executor_job(_cache_key)
    key = data["key"]
    card_url = f"{STATIC_URL}/{CARD_FILE}?v={key}"
    data["card_url"] = card_url
    frontend.add_extra_js_url(hass, card_url)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title=SIDEBAR_TITLES[language(hass.config.language)],
        sidebar_icon="mdi:radiator",
        module_url=f"{STATIC_URL}/{PANEL_FILE}?v={key}",
        require_admin=False,
        config={},
        # The panel uses HA's page layout, which keeps clear of the safe areas itself.
        handle_safe_area=True,
    )


@callback
def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Remove the panel and the card module."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    data: dict[str, str] = hass.data.get(_DATA_KEY, {})
    if card_url := data.pop("card_url", None):
        frontend.remove_extra_js_url(hass, card_url)
