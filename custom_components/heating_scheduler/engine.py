"""The engine: owns configuration and state, resolves targets, reconciles TRVs."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Collection, Coroutine, Iterable
from dataclasses import replace
from datetime import datetime, timedelta
from functools import partial
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_CORE_CONFIG_UPDATE
from homeassistant.core import (
    CALLBACK_TYPE,
    Context,
    Event,
    EventStateChangedData,
    HomeAssistant,
    State,
    callback,
)
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import (
    async_call_later,
    async_track_point_in_utc_time,
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    KNOB_SETTLE,
    SIGNAL_ROOMS_CHANGED,
    SIGNAL_UPDATE,
    SIGNAL_ZONES_CHANGED,
    VALVE_WINDOW_GRACE,
    WRITE_CONCURRENCY,
)
from .core.config_ops import put_zone_house
from .core.echo import Change, classify_setpoint_change
from .core.model import (
    HOUSE_MODES,
    Config,
    HouseMode,
    HouseState,
    Mode,
    OpenWindow,
    Override,
    OverrideOrigin,
    Room,
    RoomBoost,
    RoomTarget,
    RuntimeState,
    Vacation,
    Zone,
)
from .core.overrides import ExpiryKind, override_until
from .core.resolve import next_plan_change, resolve, room_inputs
from .core.schedule_ops import default_config
from .core.text import DEFAULT_NAMES, language
from .core.validation import SETTINGS_LIMITS, ValidationError, check_temperature, validate_config
from .core.window import DropDetector, DropRules, WindowSignals, is_open_state, window_open_at
from .health import Issue
from .log import EventLog, LogEntry, LogKind
from .storage import HeatingStorage
from .trv import Desired, TrvWorker, is_available, step_of, to_celsius

_LOGGER = logging.getLogger(__name__)

# The boost temperature of a room whose valves do not say their maximum (HA's default).
BOOST_FALLBACK_TEMPERATURE = 35.0


def _replaced_holiday(zone: Zone) -> HouseMode | None:
    """Return the mode a zone without Holiday runs during a holiday; None if it has Holiday."""
    return None if HouseMode.VACATION in zone.modes else zone.instead(HouseMode.VACATION)


class HeatingEngine:
    """Computes room targets with `resolve()` and drives every TRV toward them."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, storage: HeatingStorage) -> None:
        """Create the engine. Call `async_setup` next."""
        self.hass = hass
        self.entry = entry
        self.storage = storage
        self.config: Config = default_config()
        self.state = RuntimeState()
        self.targets: dict[str, RoomTarget] = {}
        self.health: dict[str, list[Issue]] = {}
        # Rooms whose window counts as open now.
        self.windows: dict[str, OpenWindow] = {}
        # Window entity -> (room id, True for a valve's own detection).
        self._window_entities: dict[str, tuple[str, bool]] = {}
        self._drops: dict[str, DropDetector] = {}
        self._valve_window_changed: dict[str, datetime] = {}
        self.workers: dict[str, TrvWorker] = {}
        self.log = EventLog(self._schedule_log_save)
        self.semaphore = asyncio.Semaphore(WRITE_CONCURRENCY)
        self._holds: dict[str, CALLBACK_TYPE] = {}
        self._listeners: list[Callable[[], None]] = []
        # Area last written to each room device (see entity.async_sync_devices).
        self.device_areas: dict[str, str | None] = {}
        self._unsubs: list[CALLBACK_TYPE] = []
        self._state_unsub: CALLBACK_TYPE | None = None
        self._timer_unsub: CALLBACK_TYPE | None = None
        self._timer_at: datetime | None = None
        self._tick_unsub: CALLBACK_TYPE | None = None
        self._tick_interval: timedelta | None = None
        self._reconcile_scheduled = False
        self._retry_failed = False
        self._notify_scheduled = False
        self._started = False

    # ----- lifecycle -----

    async def async_setup(self) -> None:
        """Load stored data and start listening. Raises ValidationError on broken config."""
        config = await self.storage.async_load_config()
        if config is None:
            plan_name, temps_name, zone_name = DEFAULT_NAMES[language(self.hass.config.language)]
            config = default_config(plan_name, temps_name, zone_name)
            await self.storage.async_save_config(config)
        else:
            validate_config(config)
        self.config = config

        stored = await self.storage.async_load_state()
        now = dt_util.utcnow()
        overrides = {
            room_id: item
            for room_id, item in stored.overrides.items()
            if room_id in config.rooms and item.until > now
        }
        house_modes = {key: mode for key, mode in stored.house_modes.items() if key in config.zones}
        boost = (
            stored.boost_until
            if stored.boost_until is not None and stored.boost_until > now
            else None
        )
        zone_boosts = {
            key: end for key, end in stored.zone_boosts.items() if key in config.zones and end > now
        }
        room_boosts = {
            key: end for key, end in stored.room_boosts.items() if key in config.rooms and end > now
        }
        self.state = RuntimeState(overrides, house_modes, boost, zone_boosts, room_boosts)
        if (
            overrides != dict(stored.overrides)
            or boost != stored.boost_until
            or zone_boosts != dict(stored.zone_boosts)
            or room_boosts != dict(stored.room_boosts)
        ):
            # Overrides and boosts that ended while Home Assistant was down are dropped.
            await self.storage.async_save_state(self.state)

        self.log.load(await self.storage.async_load_log())
        self._rebuild_workers()
        self._apply_tick_interval()
        self._unsubs.append(
            self.hass.bus.async_listen(EVENT_CORE_CONFIG_UPDATE, self._on_core_config_update)
        )
        self._unsubs.append(async_at_started(self.hass, self._on_started))

    async def async_unload(self) -> None:
        """Stop everything and save state."""
        self._started = False
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        for cancel in self._holds.values():
            cancel()
        self._holds.clear()
        for handle in (self._state_unsub, self._timer_unsub, self._tick_unsub):
            if handle is not None:
                handle()
        self._state_unsub = self._timer_unsub = self._tick_unsub = None
        for worker in self.workers.values():
            worker.stop()
        await self.storage.async_save_state(self.state)
        await self.storage.async_save_log(self.log.as_dict())

    @callback
    def _on_started(self, _hass: HomeAssistant) -> None:
        self._started = True
        self.request_reconcile(retry_failed=True)

    @callback
    def _on_core_config_update(self, _event: Event) -> None:
        # The time zone may have changed.
        self.request_reconcile()

    # ----- WorkerHost -----

    @property
    def dry_run(self) -> bool:
        """Return True if writes must not be sent."""
        return self.config.settings.dry_run

    def new_context(self) -> Context:
        """Return a new context for our writes (shown as ours in the logbook).

        Echo detection does not rely on it: see core/echo.py.
        """
        return Context()

    def log_event(self, room_id: str, entry: LogEntry) -> None:
        """Add a log entry for a room."""
        self.log.add(room_id, entry)

    @callback
    def worker_changed(self) -> None:
        """Recompute health now and notify listeners soon."""
        self._update_health(dt_util.utcnow())
        self._notify_soon()

    @callback
    def _notify_soon(self) -> None:
        """Notify listeners once, soon (several calls in one loop iteration notify once)."""
        if self._notify_scheduled:
            return
        self._notify_scheduled = True
        self.hass.loop.call_soon(self._notify_now)

    def create_task(self, target: Coroutine[Any, Any, None], name: str) -> asyncio.Task[None]:
        """Start a background task tied to the config entry."""
        return self.entry.async_create_background_task(self.hass, target, name)

    # ----- listeners -----

    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        """Call `listener` after every change of targets, state, config or health."""
        self._listeners.append(listener)

        @callback
        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return remove

    @callback
    def _notify_now(self) -> None:
        self._notify_scheduled = False
        self._update_health(dt_util.utcnow())
        self._notify()

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()
        async_dispatcher_send(self.hass, SIGNAL_UPDATE)

    # ----- reconcile -----

    @callback
    def request_reconcile(self, *, retry_failed: bool = False) -> None:
        """Run reconcile soon. Several requests in one loop iteration run it once."""
        self._retry_failed = self._retry_failed or retry_failed
        if self._reconcile_scheduled:
            return
        self._reconcile_scheduled = True
        self.hass.loop.call_soon(self._reconcile)

    @callback
    def _reconcile(self) -> None:
        self._reconcile_scheduled = False
        retry = self._retry_failed
        self._retry_failed = False
        if not self._started:
            return
        now = dt_util.utcnow()
        tz = dt_util.get_default_time_zone()
        self._housekeeping(now)
        self._update_windows(now)
        targets: dict[str, RoomTarget] = {}
        for room in self.config.rooms.values():
            try:
                target = self._resolve_room(room, now, tz)
            except ValueError:
                _LOGGER.exception("Cannot resolve the target of room %s", room.name)
                continue
            targets[room.id] = target
            if room.id in self._holds:
                continue
            desired = Desired(target.temperature, target.source, target.mode)
            for entity_id in room.trvs:
                if (worker := self.workers.get(entity_id)) is not None:
                    worker.set_desired(desired, retry=retry)
        self.targets = targets
        self._update_health(now)
        self._arm_timer(now)
        self._notify()

    def _resolve_room(self, room: Room, now: datetime, tz: Any) -> RoomTarget:
        plan, temperatures = room_inputs(room, self.config.plans, self.config.temp_sets)
        house = self.config.zone_of(room).house
        override = self.state.overrides.get(room.id)
        boost = self._room_boost(room, now)
        window = self._window(room, now)
        return resolve(now, house, plan, temperatures, override, tz, boost, window)

    # ----- open windows -----

    def _window(self, room: Room, now: datetime) -> OpenWindow | None:
        """Return the open window of a room, also one that counts as open only after the delay
        of its contact sensor; None while every signal of the room says closed."""
        drop = self._drops.get(room.id)
        signals = WindowSignals(
            contact=self._open_since(room.window_sensors),
            valve=self._open_since(room.valve_window_sensors),
            drop=None if drop is None else drop.since(now),
        )
        settings = self.config.settings
        since = window_open_at(signals, settings.window_delay)
        return None if since is None else OpenWindow(since, since + settings.window_limit)

    def _open_since(self, entity_ids: Iterable[str]) -> datetime | None:
        """Return since when the earliest of the open entities is open, or None."""
        changes = [
            state.last_changed
            for entity_id in entity_ids
            if (state := self.hass.states.get(entity_id)) is not None and is_open_state(state.state)
        ]
        return min(changes, default=None)

    def window_open(self, room: Room, now: datetime) -> bool:
        """Return True if a room's window counts as open at `now`."""
        window = self._window(room, now)
        return window is not None and window.since <= now

    def _update_windows(self, now: datetime) -> None:
        """Remember which rooms have an open window, and log when it opens and closes."""
        windows: dict[str, OpenWindow] = {}
        for room in self.config.rooms.values():
            window = self._window(room, now)
            if window is not None and window.since <= now:
                windows[room.id] = window
        for room_id in windows.keys() - self.windows.keys():
            self.log.add(room_id, LogEntry(now, LogKind.WINDOW_OPEN))
        for room_id in self.windows.keys() - windows.keys():
            if room_id in self.config.rooms:
                self.log.add(room_id, LogEntry(now, LogKind.WINDOW_CLOSED))
        self.windows = windows

    def _feed_drop(self, room: Room, now: datetime) -> None:
        """Give the room's temperature to its drop detector; reconcile if the window changed."""
        detector = self._drops.get(room.id)
        if detector is None:
            return
        temperature = self.room_temperature(room)
        if temperature is None:
            return
        before = detector.since(now)
        detector.add(now, temperature)
        if detector.since(now) != before:
            self.request_reconcile()

    @callback
    def _on_window_event(
        self, room_id: str, valve: bool, event: Event[EventStateChangedData]
    ) -> None:
        """A window sensor changed: reconcile. A valve that detects an open window by itself
        may have changed its setpoint just before: that is not a manual change."""
        old_state = event.data["old_state"]
        new_state = event.data["new_state"]
        opened = is_open_state(None if new_state is None else new_state.state)
        if opened == is_open_state(None if old_state is None else old_state.state):
            return
        now = dt_util.utcnow()
        if valve:
            self._valve_window_changed[room_id] = now
            override = self.state.overrides.get(room_id)
            if (
                opened
                and override is not None
                and override.origin is OverrideOrigin.DEVICE
                and now - override.created <= VALVE_WINDOW_GRACE
            ):
                self._set_override(room_id, None)
                self.log.add(
                    room_id,
                    LogEntry(
                        now,
                        LogKind.OVERRIDE_CLEARED,
                        value=override.temperature,
                        detail="valve window",
                    ),
                )
                if room_id in self._holds:
                    self._release_hold(room_id)
        self.request_reconcile()

    def _boost_end(self, room: Room, now: datetime, *, own: bool = True) -> datetime | None:
        """Return when the last boost that covers a room ends: the whole house's, its zone's,
        or (with `own`) its own. None if none runs."""
        state = self.state
        ends = [
            end
            for end in (
                state.boost_until,
                state.zone_boosts.get(self.config.zone_of(room).id),
                state.room_boosts.get(room.id) if own else None,
            )
            if end is not None and end > now
        ]
        return max(ends, default=None)

    def _room_boost(self, room: Room, now: datetime) -> RoomBoost | None:
        """Return the boost of a room: the highest setpoint any of its valves takes."""
        until = self._boost_end(room, now)
        if until is None or not room.trvs:
            return None
        limits = [
            limit
            for entity_id in room.trvs
            if (worker := self.workers.get(entity_id)) is not None
            and (limit := worker.max_temperature()) is not None
        ]
        # Each valve is then limited to its own maximum; HA's default maximum otherwise.
        return RoomBoost(until, max(limits, default=BOOST_FALLBACK_TEMPERATURE))

    def _housekeeping(self, now: datetime) -> None:
        """Drop expired overrides, end finished holidays and boosts, react to zone mode changes."""
        config = self.config
        for zone in config.zones.values():
            vacation = zone.house.vacation
            if vacation is not None and vacation.end is not None and vacation.end <= now:
                config = put_zone_house(config, zone.id, HouseState(zone.house.mode, None))
        if config is not self.config:
            self._commit_config_soon(config)

        rooms = self.config.rooms
        boost_until = self.state.boost_until
        if boost_until is not None and boost_until <= now:
            boost_until = None
            self._log_boost(LogKind.BOOST_ENDED, now, rooms.values())
        zone_boosts = dict(self.state.zone_boosts)
        for zone_id, end in list(zone_boosts.items()):
            if end <= now or zone_id not in self.config.zones:
                del zone_boosts[zone_id]
                self._log_boost(LogKind.BOOST_ENDED, now, self._zone_rooms(zone_id))
        room_boosts = dict(self.state.room_boosts)
        for room_id, end in list(room_boosts.items()):
            if end <= now or room_id not in rooms:
                del room_boosts[room_id]
                if room_id in rooms:
                    self.log.add(room_id, LogEntry(now, LogKind.BOOST_ENDED))

        overrides = dict(self.state.overrides)
        for room_id, item in list(overrides.items()):
            if item.until <= now:
                del overrides[room_id]
                self.log.add(
                    room_id, LogEntry(now, LogKind.OVERRIDE_EXPIRED, value=item.temperature)
                )

        # A change of a zone's mode ends the manual changes in that zone's rooms. Away,
        # Holiday or Off ends the zone's boost and those of its rooms: nobody is home there.
        # The boost of the whole house ends once no zone is Normal.
        house_modes: dict[str, HouseMode] = {}
        left = False
        for zone in self.config.zones.values():
            effective = zone.house.effective_mode(now)
            house_modes[zone.id] = effective
            previous = self.state.house_modes.get(zone.id)
            if previous is None or effective is previous:
                continue
            if effective is not HouseMode.AUTO:
                left = True
                zone_rooms = self._zone_rooms(zone.id)
                if zone_boosts.pop(zone.id, None) is not None:
                    self._log_boost(LogKind.BOOST_ENDED, now, zone_rooms)
                for room in zone_rooms:
                    if room_boosts.pop(room.id, None) is not None:
                        self._log_boost(LogKind.BOOST_ENDED, now, [room])
            for room in self.config.rooms.values():
                if self.config.zone_of(room).id != zone.id or room.id not in overrides:
                    continue
                item = overrides.pop(room.id)
                self.log.add(
                    room.id,
                    LogEntry(
                        now,
                        LogKind.OVERRIDE_CLEARED,
                        value=item.temperature,
                        detail=f"house mode {effective.value}",
                    ),
                )
        if left and boost_until is not None and HouseMode.AUTO not in house_modes.values():
            boost_until = None
            self._log_boost(LogKind.BOOST_ENDED, now, rooms.values())
        new_state = RuntimeState(overrides, house_modes, boost_until, zone_boosts, room_boosts)
        if new_state != self.state:
            self.state = new_state
            self._save_state()

    def _update_health(self, now: datetime) -> None:
        settings = self.config.settings
        self.health = {
            room.id: [
                issue
                for entity_id in room.trvs
                if entity_id in self.workers
                for issue in self.workers[entity_id].issues(now, settings, settings.dry_run)
            ]
            for room in self.config.rooms.values()
        }

    def _arm_timer(self, now: datetime) -> None:
        """Arm one timer at the earliest instant where any target can change."""
        candidates = [t.valid_until for t in self.targets.values() if t.valid_until is not None]
        candidates += [item.until for item in self.state.overrides.values()]
        candidates += [end for drop in self._drops.values() if (end := drop.ends()) is not None]
        for zone in self.config.zones.values():
            vacation = zone.house.vacation
            if vacation is not None:
                candidates.append(vacation.start)
                if vacation.end is not None:
                    candidates.append(vacation.end)
        at = min((c for c in candidates if c > now), default=None)
        if at == self._timer_at and (at is None or self._timer_unsub is not None):
            return
        if self._timer_unsub is not None:
            self._timer_unsub()
            self._timer_unsub = None
        self._timer_at = at
        if at is not None:
            self._timer_unsub = async_track_point_in_utc_time(self.hass, self._on_timer, at)

    @callback
    def _on_timer(self, _now: datetime) -> None:
        self._timer_unsub = None
        self._timer_at = None
        self.request_reconcile()

    def _apply_tick_interval(self) -> None:
        interval = self.config.settings.safety_interval
        if interval == self._tick_interval and self._tick_unsub is not None:
            return
        if self._tick_unsub is not None:
            self._tick_unsub()
        self._tick_interval = interval
        self._tick_unsub = async_track_time_interval(
            self.hass, self._on_tick, interval, name="heating_scheduler safety tick"
        )

    @callback
    def _on_tick(self, _now: datetime) -> None:
        self.request_reconcile(retry_failed=True)

    # ----- TRV events and manual changes -----

    def _rebuild_workers(self) -> None:
        registry = er.async_get(self.hass)
        wanted: dict[str, str] = {}
        for room in self.config.rooms.values():
            for entity_id in room.trvs:
                entry = registry.async_get(entity_id)
                if entry is not None and entry.platform == DOMAIN:
                    # Never drive our own room thermostats as TRVs.
                    _LOGGER.warning("Ignoring %s: it is a room thermostat, not a TRV", entity_id)
                    continue
                wanted[entity_id] = room.id
        for entity_id in list(self.workers):
            if wanted.get(entity_id) != self.workers[entity_id].room_id:
                self.workers.pop(entity_id).stop()
        for entity_id, room_id in wanted.items():
            if entity_id not in self.workers:
                self.workers[entity_id] = TrvWorker(self, entity_id, room_id)
        self._rebuild_tracking()

    def _sync_drops(self) -> None:
        """Keep one drop detector per room that detects a temperature drop. New rules in the
        settings start the detectors over."""
        rules = DropRules.of(self.config.settings)
        self._drops = {
            room.id: drop
            if (drop := self._drops.get(room.id)) is not None and drop.rules == rules
            else DropDetector(rules)
            for room in self.config.rooms.values()
            if room.window_drop
        }

    def _rebuild_tracking(self) -> None:
        """Follow the TRVs and the rooms' display temperature entities."""
        if self._state_unsub is not None:
            self._state_unsub()
            self._state_unsub = None
        rooms = self.config.rooms.values()
        self._sync_drops()
        self._window_entities = {
            entity_id: (room.id, valve)
            for room in rooms
            for valve, sensors in ((False, room.window_sensors), (True, room.valve_window_sensors))
            for entity_id in sensors
        }
        tracked = set(self.workers) | set(self._window_entities)
        tracked.update(
            room.temperature_entity for room in rooms if room.temperature_entity is not None
        )
        if tracked:
            self._state_unsub = async_track_state_change_event(
                self.hass, sorted(tracked), self._on_state_event
            )

    @callback
    def _on_state_event(self, event: Event[EventStateChangedData]) -> None:
        entity_id = event.data["entity_id"]
        old_state = event.data["old_state"]
        new_state = event.data["new_state"]
        if (window := self._window_entities.get(entity_id)) is not None:
            self._on_window_event(*window, event)
            return
        worker = self.workers.get(entity_id)
        now = dt_util.utcnow()
        if worker is None:
            # A display temperature entity: only the shown room temperature changed.
            for room in self.config.rooms.values():
                if room.temperature_entity == entity_id:
                    self._feed_drop(room, now)
            self._notify_soon()
            return
        old_value = worker.setpoint(old_state) if is_available(old_state) else None
        new_value = worker.setpoint(new_state) if is_available(new_state) else None
        change = classify_setpoint_change(
            old=old_value,
            new=new_value,
            pending=worker.pending,
            now=now,
            step=step_of(new_state),
        )
        worker.settle(new_state, now)
        worker.on_state_change(old_state, new_state)
        if _current(old_state) != _current(new_state):
            # The room temperature shown in the UI may use this TRV.
            if (trv_room := self.config.rooms.get(worker.room_id)) is not None:
                self._feed_drop(trv_room, now)
            self._notify_soon()
        if not self._started:
            return
        if change is Change.MANUAL:
            assert new_value is not None
            self._manual_change(worker, new_value, now)
            return
        moved = (
            old_state is not None
            and new_state is not None
            and is_available(old_state)
            and is_available(new_state)
            and (old_value != new_value or old_state.state != new_state.state)
        )
        if moved and worker.room_id not in self._holds:
            # A late or cancelled write may have left the TRV away from its target.
            worker.check_after_report()

    def _manual_change(self, worker: TrvWorker, value: float, now: datetime) -> None:
        """A person (or another automation) changed the setpoint on a TRV."""
        room = self.config.rooms.get(worker.room_id)
        if room is None:
            return
        house = self.config.zone_of(room).house
        house_mode = house.effective_mode(now)
        boosting = self._boost_end(room, now) is not None
        valve_window = self._valve_window_changed.get(room.id)
        window = self.window_open(room, now) or (
            valve_window is not None and now - valve_window <= VALVE_WINDOW_GRACE
        )
        if house_mode is not HouseMode.AUTO or window or boosting:
            # The zone's house mode, an open window or a boost wins: undo the change. A valve
            # that reacts to its own open-window detection is set back the same way.
            if house_mode is not HouseMode.AUTO:
                detail = f"house mode {house_mode.value}"
            else:
                detail = "window" if window else "boost"
            self.log.add(
                room.id,
                LogEntry(
                    now,
                    LogKind.MANUAL_IGNORED,
                    entity_id=worker.entity_id,
                    value=value,
                    detail=detail,
                ),
            )
            worker.reevaluate()
            return
        tz = dt_util.get_default_time_zone()
        plan, temperatures = room_inputs(room, self.config.plans, self.config.temp_sets)
        until = override_until(
            now,
            ExpiryKind.NEXT_CHANGE,
            next_change=next_plan_change(now, house, plan, temperatures, tz),
            max_duration=self.config.settings.max_override,
        )
        self._set_override(
            room.id, Override(value, until, now, OverrideOrigin.DEVICE, worker.entity_id)
        )
        self.log.add(
            room.id,
            LogEntry(now, LogKind.MANUAL, entity_id=worker.entity_id, value=value),
        )
        for entity_id in room.trvs:
            if (other := self.workers.get(entity_id)) is not None:
                other.suspend()
        self._hold(room.id)
        self.request_reconcile()

    def _hold(self, room_id: str) -> None:
        """Keep the TRVs of a room untouched until knob turns settle."""
        cancel = self._holds.pop(room_id, None)
        if cancel is not None:
            cancel()
        self._holds[room_id] = async_call_later(
            self.hass, KNOB_SETTLE, partial(self._release_hold, room_id)
        )

    @callback
    def _release_hold(self, room_id: str, _now: datetime | None = None) -> None:
        cancel = self._holds.pop(room_id, None)
        if cancel is not None and _now is None:
            cancel()
        self.request_reconcile()

    # ----- state and config changes -----

    def _set_override(self, room_id: str, override: Override | None) -> None:
        overrides = dict(self.state.overrides)
        if override is None:
            overrides.pop(room_id, None)
        else:
            overrides[room_id] = override
        self.state = replace(self.state, overrides=overrides)
        self._save_state()

    def _save_state(self) -> None:
        self.storage.schedule_state_save(lambda: self.state)

    def _schedule_log_save(self) -> None:
        self.storage.schedule_log_save(self.log.as_dict)

    def _commit_config_soon(self, config: Config) -> None:
        """Change the configuration from a callback; the save runs in the background."""
        self.config = replace(config, revision=self.config.revision + 1)
        self.entry.async_create_task(
            self.hass, self.storage.async_save_config(self.config), "heating_scheduler save"
        )

    async def _async_commit(self, config: Config) -> None:
        """Validate, store and apply a new configuration."""
        validate_config(config)
        old = self.config
        self.config = replace(config, revision=old.revision + 1)
        await self.storage.async_save_config(self.config)

        removed = set(old.rooms) - set(self.config.rooms)
        if removed:
            overrides = {k: v for k, v in self.state.overrides.items() if k not in removed}
            self.state = replace(self.state, overrides=overrides)
            self._save_state()
            for room_id in removed:
                self._valve_window_changed.pop(room_id, None)
                self.log.remove_room(room_id)
                cancel = self._holds.pop(room_id, None)
                if cancel is not None:
                    cancel()
        if self.config.settings.dry_run and not old.settings.dry_run:
            # Test mode: stop every write cycle now, nothing may be sent any more.
            for worker in self.workers.values():
                worker.halt()
        old_trvs = {(room.id, trv) for room in old.rooms.values() for trv in room.trvs}
        new_trvs = {(room.id, trv) for room in self.config.rooms.values() for trv in room.trvs}
        if old_trvs != new_trvs:
            self._rebuild_workers()
        elif old.rooms != self.config.rooms:
            self._rebuild_tracking()
        self._apply_tick_interval()
        self._sync_drops()
        if old.rooms != self.config.rooms:
            async_dispatcher_send(self.hass, SIGNAL_ROOMS_CHANGED)
        zone_names = {zone.id: zone.name for zone in self.config.zones.values()}
        if {zone.id: zone.name for zone in old.zones.values()} != zone_names:
            async_dispatcher_send(self.hass, SIGNAL_ZONES_CHANGED)
        self.request_reconcile(retry_failed=True)

    # ----- public API (services, websocket, entities) -----

    def room(self, room_id: str) -> Room:
        """Return a room or raise ValidationError."""
        room = self.config.rooms.get(room_id)
        if room is None:
            raise ValidationError("not_found", f"unknown room {room_id!r}", id=room_id)
        return room

    async def async_set_override(
        self,
        room_id: str,
        temperature: float | None,
        kind: ExpiryKind = ExpiryKind.NEXT_CHANGE,
        *,
        duration: timedelta | None = None,
        until: datetime | None = None,
    ) -> Override:
        """Set a manual change for a room from the app, a service or voice."""
        room = self.room(room_id)
        now = dt_util.utcnow()
        house = self.config.zone_of(room).house
        house_mode = house.effective_mode(now)
        if house_mode is not HouseMode.AUTO:
            raise ValidationError(
                "house_mode_active",
                f"the zone is in mode {house_mode.value}",
                house_mode=house_mode.value,
            )
        if self._boost_end(room, now, own=False) is not None:
            raise ValidationError("boost_active", "a boost of the house or the zone is running")
        if self.window_open(room, now):
            raise ValidationError("window_open", "a window of the room is open")
        if temperature is not None:
            check_temperature(temperature)
        tz = dt_util.get_default_time_zone()
        plan, temperatures = room_inputs(room, self.config.plans, self.config.temp_sets)
        try:
            end = override_until(
                now,
                kind,
                next_change=next_plan_change(now, house, plan, temperatures, tz),
                max_duration=self.config.settings.max_override,
                duration=duration,
                until=until,
            )
        except ValueError as err:
            raise ValidationError("invalid_duration", str(err)) from err
        override = Override(temperature, end, now, OverrideOrigin.USER)
        # A change for the room replaces its own boost (a preset picked on its thermostat).
        self._end_room_boost(room.id, now)
        self._set_override(room.id, override)
        self.log.add(room.id, LogEntry(now, LogKind.OVERRIDE_SET, value=temperature))
        if room.id in self._holds:
            self._release_hold(room.id)
        self.request_reconcile()
        return override

    async def async_clear_override(self, room_id: str) -> None:
        """Go back to the plan in a room; this also ends the room's own boost."""
        room = self.room(room_id)
        self._end_room_boost(room.id, dt_util.utcnow())
        if room.id in self.state.overrides:
            self._set_override(room.id, None)
            self.log.add(room.id, LogEntry(dt_util.utcnow(), LogKind.OVERRIDE_CLEARED))
        if room.id in self._holds:
            self._release_hold(room.id)
        self.request_reconcile()

    def find_zone(self, key: str) -> Zone:
        """Return the zone whose id or name (any case) is `key`."""
        wanted = key.strip().casefold()
        for zone in self.config.zones.values():
            if zone.id == key or zone.name.strip().casefold() == wanted:
                return zone
        raise ValidationError("not_found", f"unknown zone {key!r}", id=key)

    def zones_for(self, zone_ids: Collection[str] | None) -> list[Zone]:
        """Return the zones with `zone_ids`, or every zone for None."""
        if zone_ids is None:
            return list(self.config.zones.values())
        for zone_id in zone_ids:
            if zone_id not in self.config.zones:
                raise ValidationError("not_found", f"unknown zone {zone_id!r}", id=zone_id)
        return [zone for zone in self.config.zones.values() if zone.id in zone_ids]

    def house_mode(self, now: datetime | None = None) -> HouseMode | None:
        """Return the mode of the whole house, or None if the zones differ.

        A zone that runs its replacement for a mode it does not offer counts as in that mode:
        after Holiday for the whole house, a zone without Holiday runs its replacement.
        """
        at = now or dt_util.utcnow()
        zones = list(self.config.zones.values())
        for mode in HOUSE_MODES:
            if all(zone.house.effective_mode(at) is zone.instead(mode) for zone in zones):
                return mode
        return None

    async def async_set_house_mode(
        self, mode: HouseMode, zone_ids: Collection[str] | None = None
    ) -> None:
        """Select a house mode in some zones (None: all zones).

        A zone that does not offer `mode` runs its replacement instead. Selecting vacation
        starts a planned vacation now (keeping its end), or an open-ended vacation if none is
        planned; in a zone without Holiday, its replacement runs for those dates. An active
        vacation stays as it is.
        """
        now = dt_util.utcnow()
        config = self.config
        for zone in self.zones_for(zone_ids):
            house = zone.house
            vacation = house.vacation
            if mode is HouseMode.VACATION:
                if vacation is not None and house.vacation_active(now):
                    continue
                end = vacation.end if vacation is not None else None
                if end is not None and end <= now:
                    end = None
                kind = vacation.mode if vacation is not None else config.settings.vacation_mode
                house = HouseState(house.mode, Vacation(now, end, kind, _replaced_holiday(zone)))
            else:
                if vacation is not None and house.vacation_active(now):
                    # Choosing another mode ends an active vacation. A planned one stays.
                    vacation = None
                house = HouseState(zone.instead(mode), vacation)
            config = put_zone_house(config, zone.id, house)
        if config is not self.config:
            await self._async_commit(config)

    async def async_set_vacation(
        self,
        start: datetime | None,
        end: datetime | None,
        mode: Mode | None,
        zone_ids: Collection[str] | None = None,
    ) -> None:
        """Set an active or planned vacation in some zones (None: all zones)."""
        now = dt_util.utcnow()
        begin = now if start is None or start < now else start
        if end is not None and end <= begin:
            raise ValidationError("vacation_order", "the vacation must end after it starts")
        vacation = Vacation(begin, end, mode or self.config.settings.vacation_mode)
        config = self.config
        for zone in self.zones_for(zone_ids):
            zone_vacation = replace(vacation, replacement=_replaced_holiday(zone))
            config = put_zone_house(config, zone.id, HouseState(zone.house.mode, zone_vacation))
        await self._async_commit(config)

    async def async_cancel_vacation(self, zone_ids: Collection[str] | None = None) -> None:
        """Cancel an active or planned vacation in some zones (None: all zones)."""
        config = self.config
        for zone in self.zones_for(zone_ids):
            if zone.house.vacation is not None:
                config = put_zone_house(config, zone.id, HouseState(zone.house.mode, None))
        if config is not self.config:
            await self._async_commit(config)

    async def async_apply_config(self, config: Config, expected_revision: int | None) -> None:
        """Replace the configuration, if nobody changed it since `expected_revision`."""
        if expected_revision is not None and expected_revision != self.config.revision:
            raise ValidationError("revision_conflict", "the configuration was changed elsewhere")
        await self._async_commit(config)

    @property
    def boost_until(self) -> datetime | None:
        """Return the end of the whole house's boost while it runs."""
        return self._running(self.state.boost_until)

    def zone_boost_until(self, zone_id: str) -> datetime | None:
        """Return the end of a zone's own boost while it runs."""
        return self._running(self.state.zone_boosts.get(zone_id))

    def room_boost_until(self, room_id: str) -> datetime | None:
        """Return the end of a room's own boost while it runs."""
        return self._running(self.state.room_boosts.get(room_id))

    @staticmethod
    def _running(end: datetime | None) -> datetime | None:
        return end if end is not None and end > dt_util.utcnow() else None

    def _boost_length(self, duration: timedelta | None) -> timedelta:
        length = duration if duration is not None else self.config.settings.boost
        low, high = SETTINGS_LIMITS["boost"]
        if not low <= length <= high:
            raise ValidationError("boost_duration", "the boost length is out of range")
        return length

    def _zone_rooms(self, zone_id: str) -> list[Room]:
        return [
            room for room in self.config.rooms.values() if self.config.zone_of(room).id == zone_id
        ]

    async def async_start_boost(
        self, duration: timedelta | None = None, zone_ids: Collection[str] | None = None
    ) -> None:
        """Heat the rooms of the whole house (`zone_ids` None) or of some zones at their valves'
        maximum for `duration` (the setting by default).

        A boost means someone is home: the zones it covers leave Away, Holiday and Off first.
        """
        length = self._boost_length(duration)
        now = dt_util.utcnow()
        zones = self.zones_for(zone_ids)
        leaving = [
            zone.id for zone in zones if zone.house.effective_mode(now) is not HouseMode.AUTO
        ]
        if leaving:
            await self.async_set_house_mode(HouseMode.AUTO, leaving)
        end = now + length
        if zone_ids is None:
            self.state = replace(self.state, boost_until=end)
            rooms = list(self.config.rooms.values())
        else:
            ids = {zone.id for zone in zones}
            self.state = replace(
                self.state, zone_boosts={**self.state.zone_boosts, **dict.fromkeys(ids, end)}
            )
            rooms = [room for zone_id in ids for room in self._zone_rooms(zone_id)]
        self._save_state()
        self._log_boost(LogKind.BOOST_STARTED, now, rooms)
        self.request_reconcile()

    async def async_stop_boost(self, zone_ids: Collection[str] | None = None) -> None:
        """End the boost of the whole house (`zone_ids` None) or of some zones. Other boosts
        go on: each boost is on its own."""
        now = dt_util.utcnow()
        state = self.state
        if zone_ids is None:
            if state.boost_until is None:
                return
            self.state = replace(state, boost_until=None)
            self._log_boost(LogKind.BOOST_ENDED, now, self.config.rooms.values())
        else:
            ids = {zone.id for zone in self.zones_for(zone_ids)} & set(state.zone_boosts)
            if not ids:
                return
            zone_boosts = {key: end for key, end in state.zone_boosts.items() if key not in ids}
            self.state = replace(state, zone_boosts=zone_boosts)
            for zone_id in ids:
                self._log_boost(LogKind.BOOST_ENDED, now, self._zone_rooms(zone_id))
        self._save_state()
        self.request_reconcile()

    async def async_start_room_boost(self, room_id: str, duration: timedelta | None = None) -> None:
        """Heat one room at its valves' maximum. Only while its zone is Normal, like a manual
        change."""
        room = self.room(room_id)
        length = self._boost_length(duration)
        now = dt_util.utcnow()
        house_mode = self.config.zone_of(room).house.effective_mode(now)
        if house_mode is not HouseMode.AUTO:
            raise ValidationError(
                "house_mode_active",
                f"the zone is in mode {house_mode.value}",
                house_mode=house_mode.value,
            )
        self.state = replace(
            self.state, room_boosts={**self.state.room_boosts, room.id: now + length}
        )
        self._save_state()
        self._log_boost(LogKind.BOOST_STARTED, now, [room])
        self.request_reconcile()

    async def async_stop_room_boost(self, room_id: str) -> None:
        """End a room's own boost; boosts of its zone or the house go on."""
        if self._end_room_boost(self.room(room_id).id, dt_util.utcnow()):
            self.request_reconcile()

    def _end_room_boost(self, room_id: str, now: datetime) -> bool:
        """End a room's own boost; return True if one ran."""
        if room_id not in self.state.room_boosts:
            return False
        room_boosts = {key: end for key, end in self.state.room_boosts.items() if key != room_id}
        self.state = replace(self.state, room_boosts=room_boosts)
        self._save_state()
        self._log_boost(LogKind.BOOST_ENDED, now, [self.config.rooms[room_id]])
        return True

    def _log_boost(self, kind: LogKind, now: datetime, rooms: Iterable[Room]) -> None:
        for room in rooms:
            self.log.add(room.id, LogEntry(now, kind))

    @callback
    def reconcile_now(self) -> None:
        """Reconcile every TRV now, and retry failed ones."""
        self.request_reconcile(retry_failed=True)

    def room_temperature(self, room: Room) -> float | None:
        """Return the temperature to show for a room, in °C."""
        unit = self.hass.config.units.temperature_unit
        if room.temperature_entity is not None:
            state = self.hass.states.get(room.temperature_entity)
            if state is not None and is_available(state):
                if state.domain == "climate":
                    value = _celsius(state.attributes.get("current_temperature"), unit)
                else:
                    source_unit = state.attributes.get("unit_of_measurement") or unit
                    value = _celsius(state.state, str(source_unit))
                if value is not None:
                    return round(value, 1)
        values: list[float] = []
        for entity_id in room.trvs:
            state = self.hass.states.get(entity_id)
            if state is None or not is_available(state):
                continue
            value = _celsius(state.attributes.get("current_temperature"), unit)
            if value is not None:
                values.append(value)
        return round(sum(values) / len(values), 1) if values else None


def _current(state: State | None) -> Any:
    """Return the current temperature attribute of a state, if any."""
    return None if state is None else state.attributes.get("current_temperature")


def _celsius(raw: Any, unit: str) -> float | None:
    """Parse a temperature in `unit` and return it in °C, or None."""
    if raw is None or isinstance(raw, bool):
        return None
    try:
        return to_celsius(float(raw), unit)
    except TypeError, ValueError, HomeAssistantError:
        return None
