"""The engine: owns configuration and state, resolves targets, reconciles TRVs."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
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
    callback,
)
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
    WRITE_CONCURRENCY,
)
from .core.config_ops import put_house
from .core.echo import Change, classify_setpoint_change
from .core.model import (
    Config,
    HouseMode,
    HouseState,
    Mode,
    Override,
    OverrideOrigin,
    Room,
    RoomTarget,
    RuntimeState,
    Vacation,
)
from .core.overrides import ExpiryKind, override_until
from .core.resolve import next_plan_change, resolve, room_inputs
from .core.schedule_ops import default_config
from .core.text import DEFAULT_NAMES, language
from .core.validation import ValidationError, check_temperature, validate_config
from .health import Issue
from .log import EventLog, LogEntry, LogKind
from .storage import HeatingStorage
from .trv import Desired, TrvWorker, is_available, setpoint_of, step_of

_LOGGER = logging.getLogger(__name__)


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
        self.workers: dict[str, TrvWorker] = {}
        self.log = EventLog(self._schedule_log_save)
        self.semaphore = asyncio.Semaphore(WRITE_CONCURRENCY)
        self._holds: dict[str, CALLBACK_TYPE] = {}
        self._listeners: list[Callable[[], None]] = []
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
            plan_name, temps_name = DEFAULT_NAMES[language(self.hass.config.language)]
            config = default_config(plan_name, temps_name)
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
        self.state = RuntimeState(overrides, stored.house_mode)
        if overrides != dict(stored.overrides):
            # Overrides that expired while Home Assistant was down are dropped.
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
        return resolve(
            now, self.config.house, plan, temperatures, self.state.overrides.get(room.id), tz
        )

    def _housekeeping(self, now: datetime) -> None:
        """Drop expired overrides, end a finished vacation, react to house mode changes."""
        house = self.config.house
        vacation = house.vacation
        if vacation is not None and vacation.end is not None and vacation.end <= now:
            self._commit_config_soon(put_house(self.config, HouseState(house.mode, None)))

        overrides = dict(self.state.overrides)
        for room_id, item in list(overrides.items()):
            if item.until <= now:
                del overrides[room_id]
                self.log.add(
                    room_id, LogEntry(now, LogKind.OVERRIDE_EXPIRED, value=item.temperature)
                )

        effective = self.config.house.effective_mode(now)
        previous = self.state.house_mode
        if previous is not None and effective is not previous:
            for room_id, item in overrides.items():
                self.log.add(
                    room_id,
                    LogEntry(
                        now,
                        LogKind.OVERRIDE_CLEARED,
                        value=item.temperature,
                        detail=f"house mode {effective.value}",
                    ),
                )
            overrides = {}
        new_state = RuntimeState(overrides, effective)
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
        vacation = self.config.house.vacation
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
        if self._state_unsub is not None:
            self._state_unsub()
            self._state_unsub = None
        if wanted:
            self._state_unsub = async_track_state_change_event(
                self.hass, list(wanted), self._on_trv_event
            )

    @callback
    def _on_trv_event(self, event: Event[EventStateChangedData]) -> None:
        entity_id = event.data["entity_id"]
        worker = self.workers.get(entity_id)
        if worker is None:
            return
        old_state = event.data["old_state"]
        new_state = event.data["new_state"]
        now = dt_util.utcnow()
        old_value = setpoint_of(old_state) if is_available(old_state) else None
        new_value = setpoint_of(new_state) if is_available(new_state) else None
        change = classify_setpoint_change(
            old=old_value,
            new=new_value,
            pending=worker.pending,
            now=now,
            step=step_of(new_state),
        )
        worker.settle(new_state, now)
        worker.on_state_change(old_state, new_state)
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
        house_mode = self.config.house.effective_mode(now)
        if house_mode is not HouseMode.AUTO:
            # The house mode wins: undo the change.
            self.log.add(
                room.id,
                LogEntry(
                    now,
                    LogKind.MANUAL_IGNORED,
                    entity_id=worker.entity_id,
                    value=value,
                    detail=f"house mode {house_mode.value}",
                ),
            )
            worker.reevaluate()
            return
        tz = dt_util.get_default_time_zone()
        plan, temperatures = room_inputs(room, self.config.plans, self.config.temp_sets)
        until = override_until(
            now,
            ExpiryKind.NEXT_CHANGE,
            next_change=next_plan_change(now, self.config.house, plan, temperatures, tz),
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
                self.log.remove_room(room_id)
                cancel = self._holds.pop(room_id, None)
                if cancel is not None:
                    cancel()
        old_trvs = {(room.id, trv) for room in old.rooms.values() for trv in room.trvs}
        new_trvs = {(room.id, trv) for room in self.config.rooms.values() for trv in room.trvs}
        if old_trvs != new_trvs:
            self._rebuild_workers()
        self._apply_tick_interval()
        if old.rooms != self.config.rooms:
            async_dispatcher_send(self.hass, SIGNAL_ROOMS_CHANGED)
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
        house_mode = self.config.house.effective_mode(now)
        if house_mode is not HouseMode.AUTO:
            raise ValidationError(
                "house_mode_active",
                f"the house is in mode {house_mode.value}",
                house_mode=house_mode.value,
            )
        if temperature is not None:
            check_temperature(temperature)
        tz = dt_util.get_default_time_zone()
        plan, temperatures = room_inputs(room, self.config.plans, self.config.temp_sets)
        try:
            end = override_until(
                now,
                kind,
                next_change=next_plan_change(now, self.config.house, plan, temperatures, tz),
                max_duration=self.config.settings.max_override,
                duration=duration,
                until=until,
            )
        except ValueError as err:
            raise ValidationError("invalid_duration", str(err)) from err
        override = Override(temperature, end, now, OverrideOrigin.USER)
        self._set_override(room.id, override)
        self.log.add(room.id, LogEntry(now, LogKind.OVERRIDE_SET, value=temperature))
        if room.id in self._holds:
            self._release_hold(room.id)
        self.request_reconcile()
        return override

    async def async_clear_override(self, room_id: str) -> None:
        """Go back to the plan in a room."""
        room = self.room(room_id)
        if room.id in self.state.overrides:
            self._set_override(room.id, None)
            self.log.add(room.id, LogEntry(dt_util.utcnow(), LogKind.OVERRIDE_CLEARED))
        if room.id in self._holds:
            self._release_hold(room.id)
        self.request_reconcile()

    async def async_set_house_mode(self, mode: HouseMode) -> None:
        """Select a house mode.

        Selecting vacation starts a planned vacation now (keeping its end), or an
        open-ended vacation if none is planned. An active vacation stays as it is.
        """
        if mode is HouseMode.VACATION:
            vacation = self.config.house.vacation
            if vacation is not None and self.config.house.vacation_active(dt_util.utcnow()):
                return
            if vacation is not None:
                await self.async_set_vacation(None, vacation.end, vacation.mode)
            else:
                await self.async_set_vacation(None, None, None)
            return
        house = self.config.house
        vacation = house.vacation
        if vacation is not None and house.vacation_active(dt_util.utcnow()):
            # Choosing another mode ends an active vacation. A planned one stays.
            vacation = None
        await self._async_commit(put_house(self.config, HouseState(mode, vacation)))

    async def async_set_vacation(
        self, start: datetime | None, end: datetime | None, mode: Mode | None
    ) -> None:
        """Set an active or planned vacation."""
        now = dt_util.utcnow()
        begin = now if start is None or start < now else start
        if end is not None and end <= begin:
            raise ValidationError("vacation_order", "the vacation must end after it starts")
        vacation = Vacation(begin, end, mode or self.config.settings.vacation_mode)
        house = HouseState(self.config.house.mode, vacation)
        await self._async_commit(put_house(self.config, house))

    async def async_cancel_vacation(self) -> None:
        """Cancel an active or planned vacation."""
        if self.config.house.vacation is None:
            return
        house = HouseState(self.config.house.mode, None)
        await self._async_commit(put_house(self.config, house))

    async def async_apply_config(self, config: Config, expected_revision: int | None) -> None:
        """Replace the configuration, if nobody changed it since `expected_revision`."""
        if expected_revision is not None and expected_revision != self.config.revision:
            raise ValidationError("revision_conflict", "the configuration was changed elsewhere")
        await self._async_commit(config)

    @callback
    def reconcile_now(self) -> None:
        """Reconcile every TRV now, and retry failed ones."""
        self.request_reconcile(retry_failed=True)

    def room_temperature(self, room: Room) -> float | None:
        """Return the temperature to show for a room."""
        if room.temperature_entity is not None:
            state = self.hass.states.get(room.temperature_entity)
            if state is not None and is_available(state):
                raw: Any = state.attributes.get("current_temperature")
                if raw is None and state.domain != "climate":
                    raw = state.state
                try:
                    return round(float(raw), 1)
                except TypeError, ValueError:
                    pass
        values: list[float] = []
        for entity_id in room.trvs:
            state = self.hass.states.get(entity_id)
            if state is None or not is_available(state):
                continue
            try:
                values.append(float(state.attributes["current_temperature"]))
            except KeyError, TypeError, ValueError:
                continue
        return round(sum(values) / len(values), 1) if values else None
