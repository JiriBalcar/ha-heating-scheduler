"""Prepare the dev instance (development only): the fake valves and a sample configuration.

Run before the first start: `uv run python dev/seed.py`. It writes the manifest of the fake TRV
integration, which is not in the repository: HACS's checks allow one manifest.json in a
repository. The sample configuration is written only if none exists.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from datetime import time  # noqa: E402

from custom_components.heating_scheduler.core.model import (  # noqa: E402
    Config,
    Mode,
    Room,
    Slot,
    TempSet,
)
from custom_components.heating_scheduler.core.schedule_ops import (  # noqa: E402
    default_house_plan,
    default_house_temps,
    uniform_plan,
)
from custom_components.heating_scheduler.core.serde import config_to_dict  # noqa: E402

STORAGE = ROOT / "dev" / "config" / ".storage"
FAKE_TRV = ROOT / "dev" / "config" / "custom_components" / "fake_trv"
FAKE_TRV_MANIFEST = {
    "domain": "fake_trv",
    "name": "Fake TRV (development only)",
    "codeowners": [],
    "dependencies": [],
    "documentation": "https://example.invalid",
    "iot_class": "local_push",
    "requirements": [],
    "version": "0.1.0",
}


def write_fake_trv_manifest() -> None:
    """Write the fake TRV integration's manifest.json."""
    target = FAKE_TRV / "manifest.json"
    target.write_text(json.dumps(FAKE_TRV_MANIFEST, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {target}")


def main() -> None:
    write_fake_trv_manifest()
    target = STORAGE / "heating_scheduler.config"
    if target.exists():
        print(f"{target} exists, nothing to do")
        return
    bedroom = uniform_plan(
        "plan_loznice",
        "Ložnice",
        [
            Slot(time(0, 0), Mode.NIGHT),
            Slot(time(6, 30), Mode.COMFORT),
            Slot(time(8, 0), Mode.ECO),
            Slot(time(20, 0), Mode.COMFORT),
            Slot(time(21, 30), Mode.NIGHT),
        ],
    )
    guests = uniform_plan("plan_hoste", "Hosté", [Slot(time(0, 0), Mode.FROST)])
    config = Config(
        rooms={
            "obyvak": Room(
                "obyvak",
                "Obývák",
                ("climate.obyvak_hlavice_1", "climate.obyvak_hlavice_2"),
                temperature_entity="sensor.obyvak_teplota",
            ),
            "loznice": Room(
                "loznice",
                "Ložnice",
                ("climate.loznice_hlavice",),
                plan_id="plan_loznice",
                temperature_entity="sensor.loznice_teplota",
            ),
            "koupelna": Room(
                "koupelna",
                "Koupelna",
                ("climate.koupelna_hlavice",),
                temp_set_id="temps_koupelna",
                temperature_entity="sensor.koupelna_teplota",
            ),
            "kuchyn": Room("kuchyn", "Kuchyň", ("climate.kuchyn_hlavice",)),
            "hoste": Room(
                "hoste", "Pokoj pro hosty", ("climate.pokoj_hoste_hlavice",), plan_id="plan_hoste"
            ),
        },
        plans={
            "house": default_house_plan("Plán domu"),
            "plan_loznice": bedroom,
            "plan_hoste": guests,
        },
        temp_sets={
            "house": default_house_temps("Teploty domu"),
            "temps_koupelna": TempSet("temps_koupelna", "Koupelna", {Mode.COMFORT: 23.0}),
        },
    )
    STORAGE.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(
            {
                "version": 1,
                "minor_version": 1,
                "key": "heating_scheduler.config",
                "data": config_to_dict(config),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
