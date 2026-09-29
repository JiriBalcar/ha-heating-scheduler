"""Engine tests: startup, restart, boundaries, TRV writes, manual-change detection."""

from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, HomeAssistant
from homeassistant.util import dt as dt_util
import pytest

from custom_components.heating_scheduler.core.model import (
    HouseMode,
    Mode,
    Override,
    OverrideOrigin,
    RuntimeState,
    Settings,
    Source,
    TargetMode,
    TempSet,
)
from custom_components.heating_scheduler.core.validation import ValidationError
from custom_components.heating_scheduler.log import LogKind
from custom_components.heating_scheduler.trv import Phase
from tests.builders import prague, uniform, utc

from .conftest import (
    FakeClimate,
    FakeTrv,
    advance,
    engine_of,
    settle,
    setup_entry,
    store,
    two_rooms,
)


def kinds(engine: Any, room_id: str) -> list[LogKind]:
    return [entry.kind for entry in reversed(engine.log.entries(room_id))]


async def test_startup_reconcile_writes_every_trv(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    for trv in standard_trvs.values():
        assert trv.temperature_calls == [21.0]
        assert trv.setpoint == 21.0
    assert engine.state.overrides == {}
    assert engine.targets["living"].mode is TargetMode.COMFORT
    assert engine.targets["living"].valid_until == prague(2026, 10, 5, 22)
    assert all(worker.phase is Phase.IDLE for worker in engine.workers.values())
    assert kinds(engine, "bedroom") == [LogKind.WRITE, LogKind.VERIFIED]


async def test_startup_waits_until_home_assistant_started(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    hass.set_state(CoreState.not_running)
    await setup_entry(hass)
    assert standard_trvs["climate.bedroom"].calls == []
    hass.set_state(CoreState.running)
    hass.bus.async_fire(EVENT_HOMEASSISTANT_STARTED)
    await hass.async_block_till_done()
    assert standard_trvs["climate.bedroom"].temperature_calls == [21.0]


async def test_trv_missing_at_startup_is_written_when_it_appears(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert engine.workers["climate.bedroom"].phase is Phase.WAITING
    trv = climate.add("climate.bedroom", setpoint=18.0)
    await hass.async_block_till_done()
    assert trv.temperature_calls == [21.0]
    assert engine.workers["climate.bedroom"].phase is Phase.IDLE


async def test_unavailable_trv_gets_only_the_current_target_when_back(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    trv = standard_trvs["climate.bedroom"]
    trv.unavailable()
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert trv.calls == []
    # Hours pass: 22:00 (night) comes while the TRV is offline.
    await advance(hass, freezer, 11 * 3600, steps=11)
    assert trv.calls == []
    assert engine.targets["bedroom"].mode is TargetMode.NIGHT
    assert [issue.kind.value for issue in engine.health["bedroom"]] == ["unavailable"]
    trv.write()
    await hass.async_block_till_done()
    # The TRV is at 18 °C, which is the night target: nothing to write, no history replay.
    assert trv.calls == []
    assert engine.health["bedroom"] == []


async def test_unavailable_trv_is_written_when_back(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    trv = standard_trvs["climate.bedroom"]
    trv.unavailable()
    await setup_entry(hass)
    assert trv.calls == []
    trv.setpoint = 16.0
    trv.write()
    await hass.async_block_till_done()
    assert trv.temperature_calls == [21.0]


async def test_restart_with_persisted_override(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    override = Override(23.0, prague(2026, 10, 5, 14), prague(2026, 10, 5, 11), OverrideOrigin.USER)
    store(hass_storage, two_rooms(), RuntimeState({"living": override}, HouseMode.AUTO))
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert standard_trvs["climate.living_1"].temperature_calls == [23.0]
    assert standard_trvs["climate.living_2"].temperature_calls == [23.0]
    assert standard_trvs["climate.bedroom"].temperature_calls == [21.0]
    assert engine.targets["living"].source is Source.MANUAL
    assert engine.targets["living"].valid_until == prague(2026, 10, 5, 14)


async def test_override_expired_during_downtime_is_dropped(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    override = Override(23.0, prague(2026, 10, 5, 11), prague(2026, 10, 5, 9), OverrideOrigin.USER)
    store(hass_storage, two_rooms(), RuntimeState({"living": override}, HouseMode.AUTO))
    entry = await setup_entry(hass)
    assert engine_of(entry).state.overrides == {}
    assert hass_storage["heating_scheduler.state"]["data"]["overrides"] == {}
    assert standard_trvs["climate.living_1"].temperature_calls == [21.0]


async def test_schedule_boundary_writes_new_target(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    await setup_entry(hass)
    freezer.move_to(prague(2026, 10, 5, 22))
    from pytest_homeassistant_custom_component.common import async_fire_time_changed

    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert standard_trvs["climate.bedroom"].temperature_calls == [21.0, 18.0]


async def test_foreign_change_creates_room_override(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    living_1, living_2 = standard_trvs["climate.living_1"], standard_trvs["climate.living_2"]
    living_1.calls.clear()
    living_2.calls.clear()
    living_1.knob(23.5)
    await hass.async_block_till_done()
    override = engine.state.overrides["living"]
    assert override.temperature == 23.5
    assert override.origin is OverrideOrigin.DEVICE
    assert override.entity_id == "climate.living_1"
    # Next plan change is 22:00, 10 h away: the 4 h cap applies.
    assert override.until == prague(2026, 10, 5, 16)
    assert engine.targets["living"].mode is TargetMode.MANUAL
    # The other TRV waits until the knob settles (3 s).
    assert living_2.calls == []
    await advance(hass, freezer, 3)
    assert living_2.temperature_calls == [23.5]
    assert living_1.calls == []
    assert "bedroom" not in engine.state.overrides
    # At 16:00 the manual change ends and the plan returns.
    freezer.move_to(prague(2026, 10, 5, 16))
    await advance(hass, freezer, 0)
    assert living_1.temperature_calls == [21.0]
    assert living_2.temperature_calls == [23.5, 21.0]
    assert engine.state.overrides == {}


async def test_knob_turns_are_collected(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    living_1, living_2 = standard_trvs["climate.living_1"], standard_trvs["climate.living_2"]
    living_2.calls.clear()
    for value in (21.5, 22.0, 22.5):
        living_1.knob(value)
        await advance(hass, freezer, 1)
    await advance(hass, freezer, 3)
    assert living_2.temperature_calls == [22.5]
    assert engine_of(entry).state.overrides["living"].temperature == 22.5


async def test_own_echo_is_not_an_override(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    assert engine_of(entry).state.overrides == {}
    assert all(trv.setpoint == 21.0 for trv in standard_trvs.values())


async def test_late_echo_with_new_context_is_not_an_override(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_1", "climate.living_2"):
        climate.add(entity_id, setpoint=21.0)
    trv = climate.add("climate.bedroom", setpoint=18.0, delay=8)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert trv.setpoint == 18.0
    await advance(hass, freezer, 8)
    assert trv.setpoint == 21.0
    assert engine.state.overrides == {}
    assert engine.workers["climate.bedroom"].phase is Phase.IDLE
    assert trv.temperature_calls == [21.0]


async def test_late_confirmation_then_stale_report_is_not_an_override(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    from homeassistant.core import Context

    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_1", "climate.living_2"):
        climate.add(entity_id, setpoint=21.0)
    trv = climate.add("climate.bedroom", setpoint=18.0, delay=5)
    entry = await setup_entry(hass)
    await advance(hass, freezer, 5)
    assert trv.setpoint == 21.0
    # A stale report of the value before our write arrives with a new context.
    trv.setpoint = 18.0
    trv.write(Context())
    await hass.async_block_till_done()
    assert engine_of(entry).state.overrides == {}


async def test_knob_during_pending_write_is_a_manual_change(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_1", "climate.living_2"):
        climate.add(entity_id, setpoint=21.0)
    trv = climate.add("climate.bedroom", setpoint=18.0, respond=False)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert engine.workers["climate.bedroom"].phase is Phase.WRITING
    trv.knob(23.0)
    await hass.async_block_till_done()
    assert engine.state.overrides["bedroom"].temperature == 23.0
    assert engine.workers["climate.bedroom"].phase is Phase.IDLE


async def test_trv_rounding_is_not_a_loop(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    config = two_rooms()
    temp_sets = {
        **config.temp_sets,
        "odd": TempSet("odd", "Odd", {Mode.COMFORT: 21.5}),
    }
    rooms = {**config.rooms, "bedroom": replace(config.rooms["bedroom"], temp_set_id="odd")}
    store(hass_storage, replace(config, rooms=rooms, temp_sets=temp_sets))
    for entity_id in ("climate.living_1", "climate.living_2"):
        climate.add(entity_id, setpoint=21.0)
    # The TRV claims step 0.5 but stores whole degrees.
    trv = climate.add("climate.bedroom", setpoint=18.0, round_to=1.0)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert trv.temperature_calls == [21.5]
    assert trv.setpoint == 22.0
    assert engine.state.overrides == {}
    assert engine.workers["climate.bedroom"].phase is Phase.IDLE
    # Safety ticks do not write again.
    await advance(hass, freezer, 900, steps=3)
    assert trv.temperature_calls == [21.5]


async def test_write_is_retried_after_a_lost_command(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_1", "climate.living_2"):
        climate.add(entity_id, setpoint=21.0)
    trv = climate.add("climate.bedroom", setpoint=18.0, drop=1)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert trv.temperature_calls == [21.0]
    assert trv.setpoint == 18.0
    await advance(hass, freezer, 31)
    assert trv.temperature_calls == [21.0, 21.0]
    assert trv.setpoint == 21.0
    assert engine.workers["climate.bedroom"].phase is Phase.IDLE
    assert kinds(engine, "bedroom") == [
        LogKind.WRITE,
        LogKind.RETRY,
        LogKind.WRITE,
        LogKind.VERIFIED,
    ]


async def test_failed_writes_are_reported_and_retried_on_tick(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    climate: FakeClimate,
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    for entity_id in ("climate.living_1", "climate.living_2"):
        climate.add(entity_id, setpoint=21.0)
    trv = climate.add("climate.bedroom", setpoint=18.0, respond=False)
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    await advance(hass, freezer, 30)
    await advance(hass, freezer, 60)
    await advance(hass, freezer, 120)
    assert trv.temperature_calls == [21.0, 21.0, 21.0]
    worker = engine.workers["climate.bedroom"]
    assert worker.phase is Phase.FAILED
    assert [issue.kind.value for issue in engine.health["bedroom"]] == ["write_failed"]
    assert kinds(engine, "bedroom")[-1] is LogKind.FAILED
    # The next safety tick (5 min after start) tries again; now the TRV answers.
    trv.respond = True
    await advance(hass, freezer, 120)
    assert trv.temperature_calls == [21.0, 21.0, 21.0, 21.0]
    assert worker.phase is Phase.IDLE
    assert engine.health["bedroom"] == []


async def test_manual_change_in_away_mode_is_undone(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    config = two_rooms()
    store(hass_storage, replace(config, house=replace(config.house, mode=HouseMode.AWAY)))
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    trv = standard_trvs["climate.bedroom"]
    assert trv.setpoint == 16.0
    trv.knob(23.0)
    await hass.async_block_till_done()
    assert engine.state.overrides == {}
    assert trv.setpoint == 16.0
    assert LogKind.MANUAL_IGNORED in kinds(engine, "bedroom")


async def test_house_mode_change_clears_overrides(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    await engine.async_set_override("living", 24.0)
    await hass.async_block_till_done()
    assert standard_trvs["climate.living_1"].setpoint == 24.0
    await engine.async_set_house_mode(HouseMode.AWAY)
    await hass.async_block_till_done()
    assert engine.state.overrides == {}
    assert standard_trvs["climate.living_1"].setpoint == 16.0
    await engine.async_set_house_mode(HouseMode.AUTO)
    await hass.async_block_till_done()
    assert standard_trvs["climate.living_1"].setpoint == 21.0
    with pytest.raises(ValidationError) as info:
        await engine.async_set_house_mode(HouseMode.OFF)
        await engine.async_set_override("living", 22.0)
    assert info.value.code == "house_mode_active"


async def test_override_api_durations(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    from custom_components.heating_scheduler.core.overrides import ExpiryKind

    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    now = dt_util.utcnow()
    item = await engine.async_set_override(
        "living", 22.0, ExpiryKind.DURATION, duration=timedelta(hours=6)
    )
    assert item.until == now + timedelta(hours=6)
    item = await engine.async_set_override(
        "living", 22.0, ExpiryKind.UNTIL, until=prague(2026, 10, 5, 23)
    )
    assert item.until == prague(2026, 10, 5, 23)
    item = await engine.async_set_override("living", None)
    assert item.until == prague(2026, 10, 5, 16)
    await hass.async_block_till_done()
    assert standard_trvs["climate.living_1"].hvac_mode == "off"
    for bad in (
        {"kind": ExpiryKind.UNTIL, "until": now - timedelta(minutes=1)},
        {"kind": ExpiryKind.DURATION, "duration": timedelta(0)},
    ):
        with pytest.raises(ValidationError) as info:
            await engine.async_set_override("living", 22.0, **bad)  # type: ignore[arg-type]
        assert info.value.code == "invalid_duration"
    with pytest.raises(ValidationError) as info:
        await engine.async_set_override("living", 45.0)
    assert info.value.code == "temperature_range"
    with pytest.raises(ValidationError) as info:
        await engine.async_set_override("nowhere", 21.0)
    assert info.value.code == "not_found"
    await engine.async_clear_override("living")
    await hass.async_block_till_done()
    assert engine.state.overrides == {}
    assert standard_trvs["climate.living_1"].hvac_mode == "heat"
    assert standard_trvs["climate.living_1"].setpoint == 21.0


async def test_planned_vacation_returns_to_previous_mode(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    config = two_rooms()
    store(hass_storage, replace(config, house=replace(config.house, mode=HouseMode.AWAY)))
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    trv = standard_trvs["climate.bedroom"]
    assert trv.setpoint == 16.0
    await engine.async_set_vacation(prague(2026, 10, 5, 13), prague(2026, 10, 6, 12), None)
    await hass.async_block_till_done()
    assert trv.setpoint == 16.0
    freezer.move_to(prague(2026, 10, 5, 13))
    await advance(hass, freezer, 0)
    assert trv.setpoint == 7.0
    assert engine.targets["bedroom"].source is Source.VACATION
    freezer.move_to(prague(2026, 10, 6, 12))
    await advance(hass, freezer, 0)
    # The house returns to the mode selected before: away.
    assert trv.setpoint == 16.0
    assert engine.config.house.vacation is None
    assert engine.config.house.mode is HouseMode.AWAY


async def test_vacation_survives_restart(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    await engine_of(entry).async_set_vacation(None, prague(2026, 10, 12, 12), Mode.AWAY)
    await hass.async_block_till_done()
    assert await hass.config_entries.async_unload(entry.entry_id)
    freezer.move_to(prague(2026, 10, 8, 12))
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    engine = engine_of(entry)
    assert engine.targets["bedroom"].source is Source.VACATION
    assert engine.targets["bedroom"].temperature == 16.0
    assert engine.targets["bedroom"].valid_until == prague(2026, 10, 12, 12)


async def test_selecting_a_mode_ends_active_vacation_but_keeps_planned_one(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    await engine.async_set_house_mode(HouseMode.VACATION)
    assert engine.config.house.vacation is not None
    assert engine.config.house.vacation.end is None
    await engine.async_set_house_mode(HouseMode.AUTO)
    assert engine.config.house.vacation is None
    await engine.async_set_vacation(prague(2026, 10, 10), prague(2026, 10, 12), None)
    await engine.async_set_house_mode(HouseMode.AWAY)
    assert engine.config.house.vacation is not None
    await engine.async_cancel_vacation()
    assert engine.config.house.vacation is None
    with pytest.raises(ValidationError) as info:
        await engine.async_set_vacation(prague(2026, 10, 10), prague(2026, 10, 9), None)
    assert info.value.code == "vacation_order"


async def test_off_uses_hvac_off_or_minimum(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    config = two_rooms()
    store(hass_storage, replace(config, house=replace(config.house, mode=HouseMode.OFF)))
    with_off = climate.add("climate.living_1", setpoint=20.0)
    without_off = climate.add("climate.living_2", setpoint=20.0, hvac_modes=("heat",), min_temp=5.0)
    climate.add("climate.bedroom", setpoint=20.0)
    await setup_entry(hass)
    assert with_off.mode_calls == ["off"]
    assert with_off.temperature_calls == []
    assert without_off.mode_calls == []
    assert without_off.temperature_calls == [5.0]


async def test_trv_in_auto_mode_is_switched_to_heat(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    trv = climate.add("climate.living_1", setpoint=21.0, hvac_mode="auto")
    climate.add("climate.living_2", setpoint=21.0)
    climate.add("climate.bedroom", setpoint=21.0)
    await setup_entry(hass)
    assert trv.mode_calls == ["heat"]
    assert trv.temperature_calls == [21.0]


async def test_mode_switch_with_intermediate_setpoint_is_not_an_override(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    store(hass_storage, two_rooms())
    climate.add("climate.living_1", setpoint=21.0)
    climate.add("climate.living_2", setpoint=21.0)
    trv = climate.add("climate.bedroom", setpoint=4.0, hvac_mode="off", intermediate=19.0)
    entry = await setup_entry(hass)
    assert trv.mode_calls == ["heat"]
    assert trv.setpoint == 21.0
    assert engine_of(entry).state.overrides == {}


async def test_dry_run_sends_nothing(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    config = two_rooms()
    store(hass_storage, replace(config, settings=Settings(dry_run=True)))
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert all(trv.calls == [] for trv in standard_trvs.values())
    assert kinds(engine, "bedroom") == [LogKind.DRY_RUN]
    assert engine.targets["bedroom"].temperature == 21.0


async def test_mode_temperature_change_reaches_rooms_in_that_mode(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    house = engine.config.temp_sets["house"]
    warmer = replace(house, temperatures={**house.temperatures, Mode.COMFORT: 22.0})
    config = replace(engine.config, temp_sets={**engine.config.temp_sets, "house": warmer})
    await engine.async_apply_config(config, engine.config.revision)
    await hass.async_block_till_done()
    assert all(trv.setpoint == 22.0 for trv in standard_trvs.values())
    with pytest.raises(ValidationError) as info:
        await engine.async_apply_config(config, engine.config.revision - 1)
    assert info.value.code == "revision_conflict"


async def test_removing_a_room_drops_its_override_and_workers(
    hass: HomeAssistant, hass_storage: dict[str, Any], standard_trvs: dict[str, FakeTrv]
) -> None:
    store(hass_storage, two_rooms())
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    await engine.async_set_override("bedroom", 23.0)
    rooms = {k: v for k, v in engine.config.rooms.items() if k != "bedroom"}
    await engine.async_apply_config(replace(engine.config, rooms=rooms), None)
    await hass.async_block_till_done()
    assert "bedroom" not in engine.state.overrides
    assert "climate.bedroom" not in engine.workers
    assert engine.log.entries("bedroom") == []


async def test_write_limiter_allows_two_writes_at_once(
    hass: HomeAssistant, hass_storage: dict[str, Any], climate: FakeClimate
) -> None:
    import asyncio

    config = two_rooms()
    many = replace(config.rooms["living"], trvs=tuple(f"climate.t{i}" for i in range(6)))
    store(hass_storage, replace(config, rooms={"living": many}))
    for i in range(6):
        climate.add(f"climate.t{i}", setpoint=18.0)
    climate.slow = asyncio.Event()
    await setup_entry(hass)
    await asyncio.sleep(0)
    assert climate.in_flight == 2
    climate.slow.set()
    await settle(hass)
    assert climate.max_in_flight == 2
    assert all(trv.setpoint == 21.0 for trv in climate.trvs.values())


async def test_spring_forward_boundary_fires_after_the_gap(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    standard_trvs: dict[str, FakeTrv],
    freezer: FrozenDateTimeFactory,
) -> None:
    config = two_rooms()
    plan = uniform(("00:00", Mode.NIGHT), ("02:30", Mode.COMFORT), ("08:00", Mode.ECO))
    store(hass_storage, replace(config, plans={"house": plan}))
    freezer.move_to(utc(2027, 3, 27, 23, 0))  # 00:00 CET
    entry = await setup_entry(hass)
    engine = engine_of(entry)
    assert engine.targets["bedroom"].valid_until == utc(2027, 3, 28, 1, 0)  # 03:00 CEST
    freezer.move_to(utc(2027, 3, 28, 1, 0))
    await advance(hass, freezer, 0)
    assert standard_trvs["climate.bedroom"].setpoint == 21.0
