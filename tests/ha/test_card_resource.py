"""The dashboard card is a dashboard resource that the integration keeps."""

from __future__ import annotations

from typing import Any

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest

from custom_components.heating_scheduler.const import PANEL_URL_PATH

from .conftest import setup_entry

CARD = "/heating_scheduler_static/heating-scheduler-card.js"


def stored_resources(hass_storage: dict[str, Any], items: list[dict[str, str]]) -> None:
    """Dashboard resources as Home Assistant stores them."""
    hass_storage["lovelace_resources"] = {
        "version": 1,
        "minor_version": 1,
        "key": "lovelace_resources",
        "data": {"items": items},
    }


async def resources(hass: HomeAssistant) -> list[dict[str, Any]]:
    collection = hass.data[LOVELACE_DATA].resources
    await collection.async_get_info()
    return list(collection.async_items())


def card_url(hass: HomeAssistant) -> str:
    """The card's URL with the version key the panel uses."""
    panel_url = hass.data["frontend_panels"][PANEL_URL_PATH].config["_panel_custom"]["module_url"]
    return f"{CARD}?v={panel_url.split('?v=')[1]}"


async def test_a_new_installation_adds_the_card_to_the_dashboards(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    await setup_entry(hass)
    ours = [item for item in await resources(hass) if CARD in item["url"]]
    assert [(item["type"], item["url"]) for item in ours] == [("module", card_url(hass))]


async def test_the_card_keeps_one_resource_at_the_current_url(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    stored_resources(
        hass_storage,
        [
            {"id": "old", "type": "module", "url": f"{CARD}?v=0123456789ab"},
            {"id": "twice", "type": "js", "url": CARD},
            {"id": "other", "type": "module", "url": "/hacsfiles/other-card.js"},
        ],
    )
    entry = await setup_entry(hass)
    items = [dict(item) for item in await resources(hass)]
    assert [(item["id"], item["type"], item["url"]) for item in items] == [
        ("old", "module", card_url(hass)),
        ("other", "module", "/hacsfiles/other-card.js"),
    ]

    # A reload leaves the resource as it is; removing the integration removes it.
    assert await hass.config_entries.async_reload(entry.entry_id)
    assert await resources(hass) == items
    assert (await hass.config_entries.async_remove(entry.entry_id))["require_restart"] is False
    assert [item["id"] for item in await resources(hass)] == ["other"]


async def test_yaml_resources_are_left_alone_and_the_log_says_what_to_add(
    hass: HomeAssistant, hass_storage: dict[str, Any], caplog: pytest.LogCaptureFixture
) -> None:
    assert await async_setup_component(hass, "lovelace", {"lovelace": {"resource_mode": "yaml"}})
    await setup_entry(hass)
    assert await resources(hass) == []
    assert f"add {CARD} as a resource of type module" in caplog.text
