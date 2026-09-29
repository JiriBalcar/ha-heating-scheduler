"""Fixtures for Home Assistant level tests: fake TRVs, setup helpers, time control."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.core import Context, HomeAssistant, ServiceCall, callback
from homeassistant.helpers.event import async_call_later
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.heating_scheduler.const import DOMAIN
from custom_components.heating_scheduler.core.model import (
    Config,
    Room,
    RuntimeState,
)
from custom_components.heating_scheduler.core.schedule_ops import default_config
from custom_components.heating_scheduler.core.serde import config_to_dict, state_to_dict
from custom_components.heating_scheduler.engine import HeatingEngine

# Monday 2026-10-05 12:00 Europe/Prague (CEST).
START = "2026-10-05 10:00:00+00:00"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Load custom integrations in every HA test."""


@pytest.fixture(autouse=True)
async def prague_time(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> AsyncGenerator[None]:
    """Run every HA test in Europe/Prague at a fixed start time."""
    await hass.config.async_set_time_zone("Europe/Prague")
    freezer.move_to(START)
    yield


@dataclass
class FakeTrv:
    """A TRV simulated by writing its state and answering climate service calls."""

    hass: HomeAssistant
    entity_id: str
    setpoint: float | None = 20.0
    hvac_mode: str = "heat"
    step: float = 0.5
    min_temp: float = 4.0
    max_temp: float = 35.0
    hvac_modes: tuple[str, ...] = ("off", "auto", "heat")
    current: float = 20.0
    respond: bool = True  # False: commands are lost
    delay: float = 0.0  # > 0: the TRV reports this many seconds later, with a new context
    round_to: float | None = None  # the TRV stores values rounded to this step
    drop: int = 0  # lose the next N commands
    intermediate: float | None = None  # after a mode switch, first report this setpoint
    calls: list[tuple[str, dict[str, Any]]] = field(default_factory=list)

    def attributes(self) -> dict[str, Any]:
        return {
            "hvac_modes": list(self.hvac_modes),
            "min_temp": self.min_temp,
            "max_temp": self.max_temp,
            "target_temp_step": self.step,
            "temperature": self.setpoint,
            "current_temperature": self.current,
        }

    def write(self, context: Context | None = None) -> None:
        self.hass.states.async_set(
            self.entity_id, self.hvac_mode, self.attributes(), context=context
        )

    def unavailable(self) -> None:
        self.hass.states.async_set(self.entity_id, STATE_UNAVAILABLE, {})

    def knob(self, value: float) -> None:
        """A person turns the knob: the TRV reports a new setpoint with a new context."""
        self.setpoint = value
        self.write(Context())

    @property
    def temperature_calls(self) -> list[float]:
        return [data["temperature"] for service, data in self.calls if service == "set_temperature"]

    @property
    def mode_calls(self) -> list[str]:
        return [data["hvac_mode"] for service, data in self.calls if service == "set_hvac_mode"]

    def _store(self, service: str, data: dict[str, Any]) -> None:
        if service == "set_temperature":
            value = float(data["temperature"])
            if self.round_to is not None:
                value = round(value / self.round_to) * self.round_to
            self.setpoint = value
        else:
            self.hvac_mode = str(data["hvac_mode"])

    def handle(self, service: str, data: dict[str, Any], context: Context) -> None:
        self.calls.append((service, dict(data)))
        if self.drop > 0:
            self.drop -= 1
            return
        if not self.respond:
            return
        if service == "set_hvac_mode" and self.intermediate is not None:
            self._store(service, data)
            self.setpoint = self.intermediate
            self.intermediate = None
            self.write(Context())
            return
        if self.delay:

            @callback
            def report(_now: Any) -> None:
                self._store(service, data)
                self.write(Context())

            async_call_later(self.hass, self.delay, report)
            return
        self._store(service, data)
        self.write(context)


class FakeClimate:
    """Registers climate services and routes them to fake TRVs."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.trvs: dict[str, FakeTrv] = {}
        self.in_flight = 0
        self.max_in_flight = 0
        self.slow: asyncio.Event | None = None
        for service in ("set_temperature", "set_hvac_mode"):
            hass.services.async_register("climate", service, self._handler(service))

    def _handler(self, service: str) -> Any:
        async def handle(call: ServiceCall) -> None:
            entity_ids = call.data["entity_id"]
            if isinstance(entity_ids, str):
                entity_ids = [entity_ids]
            self.in_flight += 1
            self.max_in_flight = max(self.max_in_flight, self.in_flight)
            try:
                if self.slow is not None:
                    await self.slow.wait()
                for entity_id in entity_ids:
                    trv = self.trvs.get(entity_id)
                    if trv is not None:
                        trv.handle(service, dict(call.data), call.context)
            finally:
                self.in_flight -= 1

        return handle

    def add(self, entity_id: str, **kwargs: Any) -> FakeTrv:
        trv = FakeTrv(self.hass, entity_id, **kwargs)
        self.trvs[entity_id] = trv
        trv.write()
        return trv

    def clear_calls(self) -> None:
        for trv in self.trvs.values():
            trv.calls.clear()


@pytest.fixture
def climate(hass: HomeAssistant) -> FakeClimate:
    """Fake climate services."""
    return FakeClimate(hass)


def two_rooms() -> Config:
    """Living room with two TRVs, bedroom with one; house plan warm 06:00-22:00."""
    config = default_config()
    return Config(
        rooms={
            "living": Room("living", "Living room", ("climate.living_1", "climate.living_2")),
            "bedroom": Room("bedroom", "Bedroom", ("climate.bedroom",)),
        },
        plans=config.plans,
        temp_sets=config.temp_sets,
    )


def store(hass_storage: dict[str, Any], config: Config, state: RuntimeState | None = None) -> None:
    """Put configuration (and state) into storage before setup."""
    hass_storage[f"{DOMAIN}.config"] = {
        "version": 1,
        "minor_version": 1,
        "key": f"{DOMAIN}.config",
        "data": config_to_dict(config),
    }
    if state is not None:
        hass_storage[f"{DOMAIN}.state"] = {
            "version": 1,
            "minor_version": 1,
            "key": f"{DOMAIN}.state",
            "data": state_to_dict(state),
        }


async def setup_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Set up the integration and let it settle."""
    entry = MockConfigEntry(domain=DOMAIN, title="Heating Scheduler", data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await settle(hass)
    return entry


def engine_of(entry: MockConfigEntry) -> HeatingEngine:
    """Return the engine of an entry."""
    engine: HeatingEngine = entry.runtime_data
    return engine


async def settle(hass: HomeAssistant) -> None:
    """Run tasks, background task steps and scheduled callbacks until quiet."""
    for _ in range(5):
        await hass.async_block_till_done()
        await asyncio.sleep(0)
    await hass.async_block_till_done()


async def advance(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, seconds: float, steps: int = 1
) -> None:
    """Move time forward and run everything that became due."""
    for _ in range(steps):
        freezer.tick(timedelta(seconds=seconds / steps))
        async_fire_time_changed(hass)
        await settle(hass)


@pytest.fixture
def standard_trvs(climate: FakeClimate) -> Generator[dict[str, FakeTrv]]:
    """TRVs of `two_rooms()`, all at 18 °C in heat mode."""
    yield {
        entity_id: climate.add(entity_id, setpoint=18.0)
        for entity_id in ("climate.living_1", "climate.living_2", "climate.bedroom")
    }
