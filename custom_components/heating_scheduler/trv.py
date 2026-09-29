"""TRV worker: bring one TRV to its desired state, verify, retry, wait while unavailable."""

from __future__ import annotations

import asyncio
from collections.abc import Coroutine
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import StrEnum
import logging
from typing import Any, Protocol

from homeassistant.components.climate.const import (
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_MAX_TEMP,
    ATTR_MIN_TEMP,
    ATTR_TARGET_TEMP_STEP,
    DOMAIN as CLIMATE_DOMAIN,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
    HVACMode,
)
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_TEMPERATURE,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Context, HomeAssistant, State
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import PENDING_GRACE, SERVICE_CALL_TIMEOUT, VERIFY_TIMEOUTS
from .core.echo import PendingWrite, settle_pending
from .core.model import MIN_TEMPERATURE, Settings, Source, TargetMode
from .core.setpoint import device_setpoint, in_sync, normalize_step, same_value, within
from .health import UNAVAILABLE_GRACE, Issue, IssueKind
from .log import LogEntry, LogKind

_LOGGER = logging.getLogger(__name__)

# Preferred HVAC modes for heating. `auto` comes last: on many TRVs it runs the
# TRV's own weekly schedule (Sonoff TRVZB does).
_HEAT_MODES = (HVACMode.HEAT, HVACMode.HEAT_COOL, HVACMode.AUTO)


class Phase(StrEnum):
    """What a worker is doing."""

    IDLE = "idle"  # in sync, or nothing to do
    WRITING = "writing"  # a write cycle runs
    WAITING = "waiting"  # the TRV is unavailable; the latest desired value waits
    FAILED = "failed"  # the last cycle failed; the next safety tick tries again


@dataclass(frozen=True, slots=True)
class Desired:
    """What a TRV should have. `temperature` None means off."""

    temperature: float | None
    source: Source
    mode: TargetMode


@dataclass(frozen=True, slots=True)
class WritePlan:
    """What to send to a TRV."""

    hvac_mode: str | None
    temperature: float | None
    previous: float | None


class WorkerHost(Protocol):
    """What a worker needs from the engine."""

    hass: HomeAssistant
    semaphore: asyncio.Semaphore

    @property
    def dry_run(self) -> bool:
        """Return True if writes must not be sent."""
        ...

    def new_context(self) -> Context:
        """Return a new context and remember it as ours."""
        ...

    def log_event(self, room_id: str, entry: LogEntry) -> None:
        """Add a log entry for a room."""
        ...

    def worker_changed(self) -> None:
        """Tell the engine that health or phase of a worker changed."""
        ...

    def create_task(self, target: Coroutine[Any, Any, None], name: str) -> asyncio.Task[None]:
        """Start a background task tied to the config entry."""
        ...


def is_available(state: State | None) -> bool:
    """Return True if a state exists and is not unavailable or unknown."""
    return state is not None and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        return None if value is None else float(value)
    except TypeError, ValueError:
        return None


def setpoint_of(state: State | None) -> float | None:
    """Return the target temperature of a climate state."""
    return None if state is None else _number(state.attributes.get(ATTR_TEMPERATURE))


def step_of(state: State | None) -> float | None:
    """Return the target temperature step of a climate state."""
    return None if state is None else _number(state.attributes.get(ATTR_TARGET_TEMP_STEP))


def heat_mode_of(state: State) -> str | None:
    """Return the HVAC mode to use for heating, or None to leave the mode alone."""
    modes = [str(mode) for mode in state.attributes.get(ATTR_HVAC_MODES) or ()]
    for mode in _HEAT_MODES:
        if mode in modes:
            return mode.value
    return None


class TrvWorker:
    """Drives one TRV toward its desired state."""

    def __init__(self, host: WorkerHost, entity_id: str, room_id: str) -> None:
        """Create a worker for `entity_id` in room `room_id`."""
        self._host = host
        self._hass = host.hass
        self.entity_id = entity_id
        self.room_id = room_id
        self.desired: Desired | None = None
        self.phase = Phase.IDLE
        # Writes whose reports may still arrive, oldest first (see core/echo.py).
        self.pending: list[PendingWrite] = []
        # (commanded, reported): the value the TRV settled on for a commanded value.
        self.accepted: tuple[float, float] | None = None
        self.mismatch_since: datetime | None = None
        self.unavailable_since: datetime | None = None
        self.failed_since: datetime | None = None
        self.last_error: str | None = None
        self.last_write: datetime | None = None
        self._dry_run_logged: WritePlan | None = None
        self._task: asyncio.Task[None] | None = None
        self._changed = asyncio.Event()

    # ----- public API -----

    def set_desired(self, desired: Desired, *, retry: bool = False) -> None:
        """Set what the TRV should have and start a write cycle if needed.

        A failed worker tries again only for a new desired value or when `retry` is set
        (safety tick).
        """
        changed = desired != self.desired
        self.desired = desired
        if self._running():
            if not changed:
                return
            self._cancel()
        elif self.phase is Phase.FAILED and not changed and not retry:
            return
        self._evaluate()

    def reevaluate(self) -> None:
        """Check the TRV again now, for example after a change was undone."""
        if not self._running():
            self._evaluate()

    def check_after_report(self) -> None:
        """A report arrived outside a write cycle: write again if the TRV left its target.

        A failed or waiting worker is left to the safety tick and to availability events.
        """
        if self.phase is Phase.IDLE and not self._running():
            self._evaluate()

    def suspend(self) -> None:
        """Stop the running cycle: a person just changed the setpoint by hand.

        Pending writes stay: a command already sent can still be confirmed late, and that
        confirmation must not look like a person.
        """
        self._cancel()
        self.mismatch_since = None
        self._set_phase(Phase.IDLE)

    def stop(self) -> None:
        """Stop the worker for good."""
        self._cancel()

    def settle(self, new_state: State | None, now: datetime) -> None:
        """Update pending writes with a new report of the TRV."""
        if not self.pending:
            return
        available = is_available(new_state)
        self.pending = settle_pending(
            self.pending,
            reported=setpoint_of(new_state) if available else None,
            hvac_mode=new_state.state if available and new_state is not None else None,
            now=now,
            step=step_of(new_state),
        )

    def on_state_change(self, old_state: State | None, new_state: State | None) -> None:
        """React to a state change of the TRV entity."""
        self._changed.set()
        was_available = is_available(old_state)
        now_available = is_available(new_state)
        if was_available and not now_available:
            self.unavailable_since = dt_util.utcnow()
            self._log(LogKind.UNAVAILABLE)
            self._host.worker_changed()
        elif now_available and not was_available:
            if old_state is not None:
                # Back from unavailable (not the first appearance after a start).
                self._log(LogKind.AVAILABLE)
            self.unavailable_since = None
            if not self._running() and self.desired is not None:
                self._evaluate()
            self._host.worker_changed()

    def issues(self, now: datetime, settings: Settings, dry_run: bool) -> list[Issue]:
        """Return the current health issues of this TRV."""
        issues: list[Issue] = []
        state = self._hass.states.get(self.entity_id)
        if not is_available(state):
            since = self.unavailable_since
            if since is None or now - since >= UNAVAILABLE_GRACE:
                issues.append(Issue(IssueKind.UNAVAILABLE, self.entity_id, since))
            return issues
        if self.phase is Phase.FAILED:
            issues.append(Issue(IssueKind.WRITE_FAILED, self.entity_id, self.failed_since))
        elif (
            not dry_run
            and self.mismatch_since is not None
            and now - self.mismatch_since >= settings.mismatch_alert
        ):
            issues.append(Issue(IssueKind.MISMATCH, self.entity_id, self.mismatch_since))
        return issues

    def as_dict(self) -> dict[str, Any]:
        """Return diagnostic data for the advanced view."""

        def iso(value: datetime | None) -> str | None:
            return None if value is None else value.isoformat()

        state = self._hass.states.get(self.entity_id)
        return {
            "entity_id": self.entity_id,
            "phase": self.phase.value,
            "available": is_available(state),
            "desired": None if self.desired is None else self.desired.temperature,
            "setpoint": setpoint_of(state),
            "hvac_mode": None if state is None else state.state,
            "last_error": self.last_error,
            "last_write": iso(self.last_write),
            "mismatch_since": iso(self.mismatch_since),
            "unavailable_since": iso(self.unavailable_since),
            "failed_since": iso(self.failed_since),
        }

    # ----- internals -----

    def _running(self) -> bool:
        return self._task is not None and not self._task.done()

    def _cancel(self) -> None:
        if self._task is not None and not self._task.done():
            self._task.cancel()
        self._task = None

    def _set_phase(self, phase: Phase) -> None:
        if phase is not self.phase:
            self.phase = phase
            self._host.worker_changed()

    def _log(
        self,
        kind: LogKind,
        *,
        value: float | None = None,
        hvac_mode: str | None = None,
        detail: str | None = None,
    ) -> None:
        desired = self.desired
        self._host.log_event(
            self.room_id,
            LogEntry(
                at=dt_util.utcnow(),
                kind=kind,
                entity_id=self.entity_id,
                value=value,
                hvac_mode=hvac_mode,
                source=None if desired is None else desired.source.value,
                mode=None if desired is None else desired.mode.value,
                detail=detail,
            ),
        )

    def _plan(self, state: State) -> WritePlan | None:
        """Return what to send so the TRV matches `desired`, or None if it already does."""
        desired = self.desired
        if desired is None:
            return None
        setpoint = setpoint_of(state)
        attrs = state.attributes
        modes = [str(mode) for mode in attrs.get(ATTR_HVAC_MODES) or ()]
        if desired.temperature is None:
            if HVACMode.OFF in modes:
                if state.state == HVACMode.OFF:
                    return None
                return WritePlan(HVACMode.OFF.value, None, setpoint)
            # No off mode: use the TRV's minimum.
            target = _number(attrs.get(ATTR_MIN_TEMP)) or MIN_TEMPERATURE
        else:
            target = desired.temperature
        step = step_of(state)
        value = device_setpoint(
            target,
            step=step,
            min_temp=_number(attrs.get(ATTR_MIN_TEMP)),
            max_temp=_number(attrs.get(ATTR_MAX_TEMP)),
        )
        heat_mode = heat_mode_of(state)
        need_mode = heat_mode is not None and state.state != heat_mode
        accepted = None
        if self.accepted is not None and same_value(self.accepted[0], value):
            accepted = self.accepted[1]
        if not need_mode and in_sync(setpoint, value, step, accepted):
            return None
        return WritePlan(heat_mode if need_mode else None, value, setpoint)

    def _evaluate(self) -> None:
        """Start a write cycle if the TRV is available and out of sync."""
        state = self._hass.states.get(self.entity_id)
        now = dt_util.utcnow()
        if not is_available(state):
            if self.unavailable_since is None:
                self.unavailable_since = now
            self._set_phase(Phase.WAITING)
            return
        assert state is not None
        plan = self._plan(state)
        if plan is None:
            self.mismatch_since = None
            self._set_phase(Phase.IDLE)
            return
        if self.mismatch_since is None:
            self.mismatch_since = now
        if self._host.dry_run:
            if plan != self._dry_run_logged:
                self._dry_run_logged = plan
                self._log(LogKind.DRY_RUN, value=plan.temperature, hvac_mode=plan.hvac_mode)
            self._set_phase(Phase.IDLE)
            return
        self._set_phase(Phase.WRITING)
        self._task = self._host.create_task(
            self._cycle(), f"heating_scheduler write {self.entity_id}"
        )

    async def _cycle(self) -> None:
        """Write, verify, retry. Ends idle, waiting or failed."""
        for attempt, timeout in enumerate(VERIFY_TIMEOUTS):
            state = self._hass.states.get(self.entity_id)
            if not is_available(state):
                self._set_phase(Phase.WAITING)
                return
            assert state is not None
            plan = self._plan(state)
            if plan is None:
                self._settled(None)
                return
            remaining = sum(VERIFY_TIMEOUTS[attempt:], timedelta())
            if await self._send(plan, remaining) and await self._wait_applied(plan, timeout):
                self._settled(plan)
                return
            if attempt + 1 < len(VERIFY_TIMEOUTS):
                self._log(LogKind.RETRY, value=plan.temperature, detail=self.last_error)
        self._failed()

    async def _send(self, plan: WritePlan, remaining: timedelta) -> bool:
        """Send the plan. Return False if a service call failed."""
        context = self._host.new_context()
        now = dt_util.utcnow()
        self.pending = [
            *(write for write in self.pending if write.until >= now),
            PendingWrite(
                commanded=plan.temperature,
                previous=plan.previous,
                until=now + remaining + PENDING_GRACE,
                mode_switch=plan.hvac_mode is not None,
            ),
        ]
        self.last_write = now
        self._log(LogKind.WRITE, value=plan.temperature, hvac_mode=plan.hvac_mode)
        try:
            async with (
                asyncio.timeout(SERVICE_CALL_TIMEOUT.total_seconds()),
                self._host.semaphore,
            ):
                if plan.hvac_mode is not None:
                    await self._hass.services.async_call(
                        CLIMATE_DOMAIN,
                        SERVICE_SET_HVAC_MODE,
                        {ATTR_ENTITY_ID: self.entity_id, ATTR_HVAC_MODE: plan.hvac_mode},
                        blocking=True,
                        context=context,
                    )
                if plan.temperature is not None:
                    await self._hass.services.async_call(
                        CLIMATE_DOMAIN,
                        SERVICE_SET_TEMPERATURE,
                        {ATTR_ENTITY_ID: self.entity_id, ATTR_TEMPERATURE: plan.temperature},
                        blocking=True,
                        context=context,
                    )
        except (HomeAssistantError, TimeoutError, vol.Invalid) as err:
            self.last_error = str(err) or type(err).__name__
            _LOGGER.debug("Write to %s failed: %s", self.entity_id, self.last_error)
            return False
        return True

    def _applied(self, plan: WritePlan, state: State | None) -> bool:
        if not is_available(state):
            return False
        assert state is not None
        if plan.hvac_mode is not None and state.state != plan.hvac_mode:
            return False
        if plan.temperature is None:
            return True
        actual = setpoint_of(state)
        if actual is None:
            return False
        step = normalize_step(step_of(state))
        if within(actual, plan.temperature, step / 2):
            return True
        # The TRV rounded our value: accept one step, but only if the value moved.
        moved = plan.previous is None or not same_value(actual, plan.previous)
        return moved and within(actual, plan.temperature, step)

    async def _wait_applied(self, plan: WritePlan, limit: timedelta) -> bool:
        """Wait until the TRV reports the plan, at most `limit`."""
        loop = asyncio.get_running_loop()
        deadline = loop.time() + limit.total_seconds()
        while True:
            if self._applied(plan, self._hass.states.get(self.entity_id)):
                return True
            remaining = deadline - loop.time()
            if remaining <= 0:
                self.last_error = "no confirmation"
                return False
            self._changed.clear()
            try:
                async with asyncio.timeout(remaining):
                    await self._changed.wait()
            except TimeoutError:
                continue

    def _settled(self, plan: WritePlan | None) -> None:
        if plan is not None:
            state = self._hass.states.get(self.entity_id)
            actual = setpoint_of(state)
            if plan.temperature is not None and actual is not None:
                self.accepted = (plan.temperature, actual)
            self._log(LogKind.VERIFIED, value=actual, hvac_mode=plan.hvac_mode)
            self.settle(state, dt_util.utcnow())
        self.mismatch_since = None
        self.last_error = None
        self.failed_since = None
        self._set_phase(Phase.IDLE)

    def _failed(self) -> None:
        now = dt_util.utcnow()
        self.failed_since = self.failed_since or now
        _LOGGER.warning(
            "%s did not accept the setpoint after %d attempts: %s",
            self.entity_id,
            len(VERIFY_TIMEOUTS),
            self.last_error,
        )
        self._log(LogKind.FAILED, detail=self.last_error)
        self._set_phase(Phase.FAILED)
