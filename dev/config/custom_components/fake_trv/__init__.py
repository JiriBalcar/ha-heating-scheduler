"""Development only: simulated Sonoff TRVZB valves and room temperature sensors.

Valves answer 1-8 s after a command (like battery Zigbee devices), so both the
immediate and the late echo paths of Heating Scheduler are exercised.
"""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import discovery
from homeassistant.helpers.typing import ConfigType

DOMAIN = "fake_trv"

# Room name, area name, number of valves, starting temperature.
ROOMS: list[tuple[str, str, int, float]] = [
    ("obyvak", "Obývák", 2, 20.4),
    ("loznice", "Ložnice", 1, 18.9),
    ("koupelna", "Koupelna", 1, 21.8),
    ("kuchyn", "Kuchyň", 1, 20.9),
    ("pokoj_hoste", "Pokoj pro hosty", 1, 17.2),
]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Load the climate and sensor platforms."""
    hass.data[DOMAIN] = {slug: start for slug, _, _, start in ROOMS}
    for platform in (Platform.CLIMATE, Platform.SENSOR):
        hass.async_create_task(
            discovery.async_load_platform(hass, platform, DOMAIN, {}, config)
        )
    return True
