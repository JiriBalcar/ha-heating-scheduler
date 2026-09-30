"""Frost guard as a house mode, the modes each zone offers, and their replacements."""

from __future__ import annotations

from dataclasses import replace

import pytest

from custom_components.heating_scheduler.core.config_ops import fit_zone
from custom_components.heating_scheduler.core.model import (
    HOUSE_MODES,
    HouseMode,
    HouseState,
    Mode,
    Source,
    TargetMode,
    Vacation,
    Zone,
)
from custom_components.heating_scheduler.core.resolve import resolve
from custom_components.heating_scheduler.core.serde import zone_from_dict, zone_to_dict
from custom_components.heating_scheduler.core.validation import ValidationError, validate_zone
from tests.builders import PRAGUE, STANDARD, TEMPS, prague

NOW = prague(2026, 10, 5, 12)

# A floor without Away and Holiday: Normal instead of Away, Frost guard during a holiday.
UPSTAIRS = Zone(
    "up",
    "Upstairs",
    modes=frozenset({HouseMode.AUTO, HouseMode.FROST, HouseMode.OFF}),
    replacements={HouseMode.AWAY: HouseMode.AUTO, HouseMode.VACATION: HouseMode.FROST},
)


def test_frost_guard_keeps_the_frost_guard_temperature() -> None:
    target = resolve(NOW, HouseState(HouseMode.FROST), STANDARD, TEMPS, None, PRAGUE)
    assert (target.mode, target.temperature, target.source) == (
        TargetMode.FROST,
        TEMPS[Mode.FROST],
        Source.HOUSE_FROST,
    )
    assert target.valid_until is None


def test_a_replaced_holiday_runs_its_mode_for_the_dates_then_the_zone_returns() -> None:
    window = Vacation(prague(2026, 10, 5, 13), prague(2026, 10, 5, 18), replacement=HouseMode.OFF)
    house = HouseState(HouseMode.AWAY, window)
    assert house.effective_mode(NOW) is HouseMode.AWAY
    assert house.effective_mode(prague(2026, 10, 5, 14)) is HouseMode.OFF
    assert house.effective_mode(prague(2026, 10, 5, 18)) is HouseMode.AWAY
    target = resolve(NOW, house, STANDARD, TEMPS, None, PRAGUE)
    assert target.source is Source.HOUSE_AWAY
    assert target.valid_until == window.start


def test_a_zone_offers_normal_and_replaces_every_other_mode() -> None:
    validate_zone(UPSTAIRS)
    assert UPSTAIRS.instead(HouseMode.AWAY) is HouseMode.AUTO
    assert UPSTAIRS.instead(HouseMode.OFF) is HouseMode.OFF
    bad = [
        replace(UPSTAIRS, modes=UPSTAIRS.modes - {HouseMode.AUTO}),
        replace(UPSTAIRS, replacements={HouseMode.AWAY: HouseMode.AUTO}),
        replace(UPSTAIRS, replacements={**UPSTAIRS.replacements, HouseMode.AWAY: HouseMode.AWAY}),
        replace(
            UPSTAIRS, replacements={**UPSTAIRS.replacements, HouseMode.AWAY: HouseMode.VACATION}
        ),
        replace(UPSTAIRS, house=HouseState(HouseMode.AWAY)),
        replace(UPSTAIRS, house=HouseState(vacation=Vacation(NOW, None))),
    ]
    for zone in bad:
        with pytest.raises(ValidationError) as err:
            validate_zone(zone)
        assert err.value.code == "zone_modes"


def test_a_zone_that_stops_offering_its_mode_runs_the_replacement() -> None:
    everything = Zone("up", "Upstairs", HouseState(HouseMode.AWAY, Vacation(NOW, None)))
    fitted = fit_zone(replace(everything, modes=UPSTAIRS.modes, replacements=UPSTAIRS.replacements))
    assert fitted.house.mode is HouseMode.AUTO
    assert fitted.house.vacation == Vacation(NOW, None, replacement=HouseMode.FROST)
    validate_zone(fitted)
    # Offering Holiday again makes the replaced holiday a holiday.
    again = fit_zone(replace(fitted, modes=frozenset(HOUSE_MODES), replacements={}))
    assert again.house.vacation == Vacation(NOW, None)
    validate_zone(again)


def test_zone_modes_are_stored_and_every_mode_is_offered_by_default() -> None:
    zone = replace(
        UPSTAIRS, house=HouseState(vacation=Vacation(NOW, None, replacement=HouseMode.FROST))
    )
    data = zone_to_dict(zone)
    assert data["modes"] == ["auto", "frost", "off"]
    assert data["replacements"] == {"away": "auto", "vacation": "frost"}
    assert zone_from_dict(data) == zone
    del data["modes"], data["replacements"]
    assert zone_from_dict(data).modes == frozenset(HOUSE_MODES)
