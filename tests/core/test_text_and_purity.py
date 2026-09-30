"""Tests for reason texts and for the purity of the core package."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from custom_components.heating_scheduler.core.model import (
    Reason,
    RoomTarget,
    Source,
    Target,
    TargetMode,
)
from custom_components.heating_scheduler.core.text import (
    format_until,
    language,
    mode_name,
    render_reason,
    render_status,
)
from tests.builders import PRAGUE, prague

NOW = prague(2026, 10, 5, 12)  # Monday


@pytest.mark.parametrize(
    ("value", "expected"),
    [("cs", "cs"), ("en-GB", "en"), ("en_US", "en"), ("de", "cs"), (None, "cs"), ("", "cs")],
)
def test_language(value: str | None, expected: str) -> None:
    assert language(value) == expected


def test_format_until() -> None:
    assert format_until(prague(2026, 10, 6, 6), NOW, PRAGUE, "en") == "06:00"
    assert format_until(prague(2026, 10, 7, 6), NOW, PRAGUE, "en") == "Wed 06:00"
    assert format_until(prague(2026, 10, 7, 6), NOW, PRAGUE, "cs") == "středy 06:00"
    assert format_until(prague(2026, 10, 12, 12), NOW, PRAGUE, "en") == "12 Oct 12:00"
    assert format_until(prague(2026, 10, 12, 12), NOW, PRAGUE, "cs") == "12. 10. 12:00"


@pytest.mark.parametrize(
    ("reason", "lang", "expected"),
    [
        (
            Reason(Source.PLAN, TargetMode.NIGHT, prague(2026, 10, 6, 6)),
            "en",
            "Schedule: Night until 06:00",
        ),
        (Reason(Source.PLAN, TargetMode.NIGHT, prague(2026, 10, 6, 6)), "cs", "Plán: Noc do 06:00"),
        (Reason(Source.PLAN, TargetMode.ECO, None), "en", "Schedule: Saving"),
        (
            Reason(Source.MANUAL, TargetMode.MANUAL, prague(2026, 10, 5, 18)),
            "en",
            "Changed by hand until 18:00",
        ),
        (
            Reason(Source.MANUAL, TargetMode.MANUAL, prague(2026, 10, 5, 18)),
            "cs",
            "Ručně změněno do 18:00",
        ),
        (
            Reason(Source.VACATION, TargetMode.FROST, prague(2026, 10, 12, 12)),
            "en",
            "Holiday until 12 Oct 12:00",
        ),
        (Reason(Source.VACATION, TargetMode.FROST, None), "cs", "Dovolená"),
        (Reason(Source.HOUSE_AWAY, TargetMode.AWAY, None), "en", "House: Away"),
        (Reason(Source.HOUSE_OFF, TargetMode.OFF, None), "cs", "Topení vypnuto"),
    ],
)
def test_render_reason(reason: Reason, lang: str, expected: str) -> None:
    assert render_reason(reason, NOW, PRAGUE, lang) == expected


def _target(
    source: Source, mode: TargetMode, *, ends: bool, upcoming: Target | None = None
) -> RoomTarget:
    end = prague(2026, 10, 5, 22) if ends else None
    return RoomTarget(mode, 21.0, Reason(source, mode, end), end, upcoming)


def test_render_status_as_the_room_tile_shows_it() -> None:
    night = Target(TargetMode.NIGHT, 18.0, Source.PLAN)
    plan = _target(Source.PLAN, TargetMode.COMFORT, ends=True, upcoming=night)
    assert render_status(plan, NOW, PRAGUE, "en") == "Warm until 22:00 → Night 18.0 °C"
    assert render_status(plan, NOW, PRAGUE, "cs") == "Teplo do 22:00 → Noc 18,0 °C"
    assert render_status(plan, NOW, PRAGUE, "en", unit="°F") == "Warm until 22:00 → Night 64.4 °F"
    frost = _target(Source.PLAN, TargetMode.FROST, ends=False)
    assert render_status(frost, NOW, PRAGUE, "en") == "Frost guard"
    away = _target(Source.HOUSE_AWAY, TargetMode.AWAY, ends=False)
    assert render_status(away, NOW, PRAGUE, "cs") == "Dům: Pryč"
    assert render_status(away, NOW, PRAGUE, "cs", zone="1. patro") == "1. patro: Pryč"
    manual = _target(Source.MANUAL, TargetMode.MANUAL, ends=True, upcoming=night)
    assert render_status(manual, NOW, PRAGUE, "en") == "Changed by hand until 22:00"
    # A valve problem comes first; a room without valves says so.
    assert render_status(plan, NOW, PRAGUE, "cs", issue="unavailable") == "Hlavice neodpovídá"
    assert render_status(plan, NOW, PRAGUE, "en", no_trvs=True) == "No radiator valves yet."


def test_mode_names_exist_for_every_mode() -> None:
    for lang in ("cs", "en"):
        for mode in TargetMode:
            assert mode_name(mode, lang)


def test_core_does_not_import_home_assistant() -> None:
    core = Path(__file__).parents[2] / "custom_components" / "heating_scheduler" / "core"
    offenders = []
    for path in core.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            names: list[str] = []
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module]
            offenders += [f"{path.name}: {n}" for n in names if n.startswith("homeassistant")]
    assert offenders == []
