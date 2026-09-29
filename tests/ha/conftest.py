"""Fixtures for Home Assistant level tests: fake TRVs, setup helpers, time control.

Fake TRVs are real climate entities on a mock platform. The climate component calls
them like any TRV, and Home Assistant keeps the service context on them for 5 seconds,
exactly as for Zigbee2MQTT entities.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.climate import ClimateEntity
from homeassistant.components.climate.const import ClimateEntityFeature, HVACMode
from homeassistant.const import UnitOfTemperature
from homeassistant.core import Context, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_call_later
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    MockPlatform,
    async_fire_time_changed,
    mock_platform,
)

from custom_components.heating_scheduler.const import DOMAIN
from custom_components.heating_scheduler.core.model import Config, Room, RuntimeState
from custom_components.heating_scheduler.core.schedule_ops import default_config
from custom_components.heating_scheduler.core.serde import config_to_dict, state_to_dict
from custom_components.heating_scheduler.engine import HeatingEngine

# Monday 2026-10-05 12:00 Europe/Prague (CEST).
START = "2026-10-05 10:00:00+00:00"

TRV_IDS = ("climate.living_trv_1", "climate.living_trv_2", "climate.bedroom_trv")


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Load custom integrations in every HA test."""


@pytest.fixture(autouse=True)
async def prague_time(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> AsyncGenerator[None]:
    """Run every HA test in Europe/Prague at a fixed start time."""
    await hass.config.async_set_time_zone("Europe/Prague")
    freezer.move_to(START)
    yield


class FakeTrv(ClimateEntity):
    """A TRV: stores commands, can answer late, round, lose commands or go offline."""

    _attr_should_poll = False
    _attr_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_supported_features = (
        ClimateEntityFeature.TARGET_TEMPERATURE
        | ClimateEntityFeature.TURN_ON
        | ClimateEntityFeature.TURN_OFF
    )

    def __init__(
        self,
        harness: FakeClimate,
        entity_id: str,
        *,
        setpoint: float | None = 20.0,
        hvac_mode: str = "heat",
        step: float = 0.5,
        min_temp: float = 4.0,
        max_temp: float = 35.0,
        hvac_modes: tuple[str, ...] = ("off", "auto", "heat"),
        current: float = 20.0,
        respond: bool = True,
        delay: float = 0.0,
        round_to: float | None = None,
        drop: int = 0,
        intermediate: float | None = None,
        hvac_action: str | None = None,
    ) -> None:
        self._harness = harness
        self.entity_id = entity_id
        self._attr_name = entity_id.split(".")[1]
        self.setpoint = setpoint
        self.mode = HVACMode(hvac_mode)
        self._attr_hvac_modes = [HVACMode(mode) for mode in hvac_modes]
        self._attr_target_temperature_step = step
        self._attr_min_temp = min_temp
        self._attr_max_temp = max_temp
        self._attr_current_temperature = current
        self._attr_hvac_action = hvac_action  # type: ignore[assignment]
        self.respond = respond  # False: commands are lost
        self.delay = delay  # > 0: the TRV reports this many seconds later
        self.round_to = round_to  # the TRV stores values rounded to this step
        self.drop = drop  # lose the next N commands
        self.intermediate = intermediate  # after a mode switch, first report this setpoint
        self.calls: list[tuple[str, dict[str, Any]]] = []

    @property
    def hvac_mode(self) -> HVACMode:
        return self.mode

    @property
    def target_temperature(self) -> float | None:
        return self.setpoint

    @property
    def temperature_calls(self) -> list[float]:
        return [data["temperature"] for service, data in self.calls if service == "set_temperature"]

    @property
    def mode_calls(self) -> list[str]:
        return [data["hvac_mode"] for service, data in self.calls if service == "set_hvac_mode"]

    async def async_set_temperature(self, **kwargs: Any) -> None:
        await self._command("set_temperature", {"temperature": kwargs["temperature"]})

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        await self._command("set_hvac_mode", {"hvac_mode": hvac_mode.value})

    def _store(self, service: str, data: dict[str, Any]) -> None:
        if service == "set_temperature":
            value = float(data["temperature"])
            if self.round_to is not None:
                value = round(value / self.round_to) * self.round_to
            self.setpoint = value
        else:
            self.mode = HVACMode(data["hvac_mode"])

    async def _command(self, service: str, data: dict[str, Any]) -> None:
        harness = self._harness
        harness.in_flight += 1
        harness.max_in_flight = max(harness.max_in_flight, harness.in_flight)
        try:
            if harness.slow is not None:
                await harness.slow.wait()
            self.calls.append((service, data))
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
                    self.async_write_ha_state()

                async_call_later(self.hass, self.delay, report)
                return
            self._store(service, data)
            self.async_write_ha_state()
        finally:
            harness.in_flight -= 1

    def write(self, context: Context | None = None) -> None:
        """Report the current state (available), optionally with a new context."""
        self._attr_available = True
        if context is not None:
            self.async_set_context(context)
        self.async_write_ha_state()

    def unavailable(self) -> None:
        self._attr_available = False
        self.async_write_ha_state()

    def knob(self, value: float) -> None:
        """A person turns the knob: the TRV reports a new setpoint with a new context."""
        self.setpoint = value
        self.write(Context())


class FakeClimate:
    """The mock `fake_trv` climate platform that holds the fake TRVs."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.trvs: dict[str, FakeTrv] = {}
        self.in_flight = 0
        self.max_in_flight = 0
        self.slow: asyncio.Event | None = None
        self._add: AddEntitiesCallback | None = None

    async def async_setup_platform(
        self,
        hass: HomeAssistant,
        config: Any,
        async_add_entities: AddEntitiesCallback,
        discovery_info: Any = None,
    ) -> None:
        self._add = async_add_entities

    async def add(self, entity_id: str, **kwargs: Any) -> FakeTrv:
        """Add a TRV entity and wait until its state exists."""
        trv = FakeTrv(self, entity_id, **kwargs)
        self.trvs[entity_id] = trv
        assert self._add is not None
        self._add([trv])
        await self.hass.async_block_till_done()
        return trv

    def clear_calls(self) -> None:
        for trv in self.trvs.values():
            trv.calls.clear()


@pytest.fixture
async def climate(hass: HomeAssistant) -> FakeClimate:
    """The climate component with the fake TRV platform."""
    harness = FakeClimate(hass)
    mock_platform(
        hass, "fake_trv.climate", MockPlatform(async_setup_platform=harness.async_setup_platform)
    )
    assert await async_setup_component(hass, "climate", {"climate": [{"platform": "fake_trv"}]})
    await hass.async_block_till_done()
    return harness


@pytest.fixture
async def standard_trvs(climate: FakeClimate) -> dict[str, FakeTrv]:
    """TRVs of `two_rooms()`, all at 18 °C in heat mode."""
    return {entity_id: await climate.add(entity_id, setpoint=18.0) for entity_id in TRV_IDS}


def two_rooms() -> Config:
    """Living room with two TRVs, bedroom with one; house plan warm 06:00-22:00."""
    config = default_config()
    return Config(
        rooms={
            "living": Room("living", "Living room", TRV_IDS[:2]),
            "bedroom": Room("bedroom", "Bedroom", TRV_IDS[2:]),
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


async def settle(hass: HomeAssistant) -> None:
    """Run tasks, background task steps and scheduled callbacks until quiet."""
    for _ in range(5):
        await hass.async_block_till_done()
        await asyncio.sleep(0)
    await hass.async_block_till_done()


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


async def advance(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, seconds: float, steps: int = 1
) -> None:
    """Move time forward and run everything that became due."""
    for _ in range(steps):
        freezer.tick(timedelta(seconds=seconds / steps))
        async_fire_time_changed(hass)
        await settle(hass)
