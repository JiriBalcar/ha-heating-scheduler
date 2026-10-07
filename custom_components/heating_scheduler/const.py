"""Constants of the Heating Scheduler integration."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

DOMAIN: Final = "heating_scheduler"
VERSION: Final = "1.1.0"

# Dispatcher signals.
SIGNAL_UPDATE: Final = f"{DOMAIN}_update"
SIGNAL_ROOMS_CHANGED: Final = f"{DOMAIN}_rooms_changed"
SIGNAL_ZONES_CHANGED: Final = f"{DOMAIN}_zones_changed"

# Frontend.
PANEL_URL_PATH: Final = "heating-scheduler"
PANEL_COMPONENT: Final = "heating-scheduler-panel"
STATIC_URL: Final = f"/{DOMAIN}_static"
PANEL_FILE: Final = "heating-scheduler-panel.js"
CARD_FILE: Final = "heating-scheduler-card.js"
ICONS_FILE: Final = "heating-scheduler-icons.js"
# The brand dial in one colour; the sidebar icon module registers it (frontend/src/icons.ts).
PANEL_ICON: Final = "heating-scheduler:dial"
# The project's name, in every language (user's decision, 2026-09-30).
PANEL_TITLE: Final = "Heating Scheduler"

# TRV writes.
VERIFY_TIMEOUTS: Final[tuple[timedelta, ...]] = (
    timedelta(seconds=30),
    timedelta(seconds=60),
    timedelta(seconds=120),
)
SERVICE_CALL_TIMEOUT: Final = timedelta(seconds=30)
WRITE_CONCURRENCY: Final = 2
# Reports of a write are expected until its last verify timeout plus this grace time.
PENDING_GRACE: Final = timedelta(seconds=30)
# Knob turns are collected this long before the value goes to the other TRVs of the room.
KNOB_SETTLE: Final = timedelta(seconds=3)
# A valve that detects an open window by itself may change its setpoint too, just before or
# after it reports the window. Setpoint changes this close to such a report are not manual.
VALVE_WINDOW_GRACE: Final = timedelta(seconds=10)

# Stores.
STATE_SAVE_DELAY: Final = 2
LOG_SAVE_DELAY: Final = 60
LOG_LIMIT: Final = 100
