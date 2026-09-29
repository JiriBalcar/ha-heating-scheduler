"""Constants of the Heating Scheduler integration."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

DOMAIN: Final = "heating_scheduler"
VERSION: Final = "1.0.0"

# Dispatcher signals.
SIGNAL_UPDATE: Final = f"{DOMAIN}_update"
SIGNAL_ROOMS_CHANGED: Final = f"{DOMAIN}_rooms_changed"

# Frontend.
PANEL_URL_PATH: Final = "heating-scheduler"
PANEL_COMPONENT: Final = "heating-scheduler-panel"
STATIC_URL: Final = f"/{DOMAIN}_static"
PANEL_FILE: Final = "heating-scheduler-panel.js"
CARD_FILE: Final = "heating-scheduler-card.js"

# TRV writes.
VERIFY_TIMEOUTS: Final[tuple[timedelta, ...]] = (
    timedelta(seconds=30),
    timedelta(seconds=60),
    timedelta(seconds=120),
)
SERVICE_CALL_TIMEOUT: Final = timedelta(seconds=30)
WRITE_CONCURRENCY: Final = 2
# After a write is settled, late or stale reports are still treated as echoes this long.
PENDING_GRACE: Final = timedelta(seconds=30)
# Knob turns are collected this long before the value goes to the other TRVs of the room.
KNOB_SETTLE: Final = timedelta(seconds=3)
OWN_CONTEXT_TTL: Final = timedelta(minutes=15)

# Stores.
STATE_SAVE_DELAY: Final = 2
LOG_SAVE_DELAY: Final = 60
LOG_LIMIT: Final = 100
