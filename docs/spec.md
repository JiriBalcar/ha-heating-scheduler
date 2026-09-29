# Task: Build a Home Assistant heating scheduler integration ("Heating Scheduler")

Original specification, as written by the owner on 2026-09-29. Agreed changes and
decisions are in [architecture.md](architecture.md); where the two differ, the
architecture document wins.

You are building a custom Home Assistant integration plus a frontend UI. Read this whole document first, then propose an architecture and a phased plan. Wait for my approval before writing code. Ask about anything that is unclear or where you'd deviate from this spec.

## Context

* I have several rooms. Each room has one or more TRVs (thermostatic radiator valves), exposed in Home Assistant as `climate` entities.
* Each TRV already receives room temperature from an external sensor directly. Temperature regulation happens on the TRVs.
* Boiler/heat-demand control already exists and is out of scope. Do not touch it.
* This integration's only job: decide the target setpoint for each room, based on schedules and modes, and make sure every TRV in the room has it.
* The UI must be simple enough for a non-technical elderly user (my father) to operate confidently on a phone or tablet.

## Non-goals

* No boiler control, no valve-position logic, no PID/TPI, no temperature calibration, no external-sensor handling.
* No cloud dependencies. Everything runs locally.
* No cooling.

## Domain model

### Modes (presets)

* Built-in modes: `comfort`, `eco`, `night`, `away`, `frost` (frost protection), `off`.
* Each mode has a global default temperature (e.g. comfort 21 °C, eco 19 °C, night 18 °C, away 16 °C, frost 7 °C). `off` sends HVAC mode off (or the TRV's minimum if off isn't supported).
* Each room can optionally override the temperature for any mode (e.g. bathroom comfort = 23 °C).
* Changing a mode temperature must immediately affect every room currently in that mode.

### Schedules

* A schedule is a weekly plan. Each day is a list of `(start_time, mode)` slots covering the full 24 h. The last slot of a day continues into the next day until that day's first slot.
* There is exactly one default schedule.
* Each room either follows the default schedule or has its own schedule (a per-room toggle). Switching a room back to "follow default" keeps its own schedule stored but inactive.
* Schedule editing must support copying a day to other days, and quick templates such as "same every workday" and "same on weekend".

### House mode (global)

* `auto` (normal: follow schedules), `away` (all rooms use `away` temp), `vacation` (all rooms use `frost` or `away`, configurable, with optional start and end datetime; it reverts to `auto` automatically at the end), `off`.
* Vacation with an end date must be settable in advance and must survive restarts.

### Precedence (highest wins)

1. House mode `off` / `vacation` / `away`
2. Active room override (see below)
3. Room's own schedule (if enabled)
4. Default schedule

Implement this as a pure function:

```
resolve(now, house_mode, room_config, default_schedule, overrides, mode_temps) -> RoomTarget(mode, temperature, reason, valid_until)
```

`reason` must be a human-readable explanation (e.g. "Schedule: Night until 06:00", "Manual change until 18:00", "Vacation until 12 Oct"). The UI shows it.

## Core behaviour: reconcile, not trigger

This is the most important requirement. Do not implement scheduling as "fire an action at time X". Instead:

* A coordinator computes the desired target per room with `resolve()` and reconciles every TRV toward it.
* Reconcile runs on:
  * HA startup, once TRV entities are available
  * every schedule boundary (the next `valid_until`)
  * any config, mode or override change
  * a periodic safety tick (configurable, default 5 min)
  * a TRV becoming available again after being unavailable
* The result must be correct after any restart, crash, missed timer, or TRV being offline for hours, without replaying history.

### Writing to TRVs

* Round the target to the TRV's `target_temp_step` and clamp it to its `min_temp`/`max_temp`.
* Compare with a tolerance (step/2) to avoid write loops.
* After writing, verify the TRV reports the new setpoint. Retry with backoff (e.g. 3 attempts) because battery Zigbee TRVs drop commands. Log and surface persistent failures (see Health).
* Tag all writes with the integration's own `Context` so they can be told apart from user changes.
* Never write to unavailable entities. Queue until they are available.

### Manual overrides

* A setpoint change on any TRV in a room with a foreign context (physical knob on the TRV, the HA UI, another automation) is a manual override for the whole room.
  * Apply the same setpoint to the other TRVs in that room.
  * The override expires at the next schedule boundary of the room's effective schedule, capped by a configurable max duration (default 4 h, relevant e.g. during vacation, where there is no boundary).
* Overrides set from my UI can choose the duration: "until next change" (default), "for 1 h / 2 h / 4 h", or "until time X".
* "Back to schedule" clears the override immediately.
* Only watch the target setpoint (`temperature` attribute). Ignore `current_temperature` changes entirely.
* Echoes of our own writes, including a TRV rounding our value, must never be treated as overrides.
* Overrides are persisted and survive restarts. An override that expired during downtime is dropped on startup.

### Persistence

* All config (rooms, TRV assignments, schedules, mode temps, house mode, vacation dates) and runtime state (overrides) are stored with HA's `Store` helper under `.storage/`, versioned with migrations.
* No YAML configuration required. Everything is configurable from the UI.

### Time correctness

* Use HA's configured time zone. DST transitions (Europe/Prague) must be handled: no skipped or doubled slot, no crash on non-existent or ambiguous local times.
* Use HA time helpers (`async_track_point_in_time` etc.) and `dt_util`, never naive datetimes.

### Health (v1: minimal)

* Per-room diagnostic state: TRVs unavailable, last write failed, setpoint mismatch persisting beyond N minutes.
* Show a small warning in the UI. Details go only in an "advanced" view.

## HA entities & services

* Per room:
  * a `sensor` with the current effective mode (attributes: target temp, reason, valid_until, override info)
  * a `button` "resume schedule"
* Global:
  * a `select` for house mode
  * `number` entities for the global mode temperatures
* Services:
  * `set_override(room, temperature, duration | until)`
  * `clear_override(room)`
  * `set_house_mode(mode)`
  * `set_vacation(start, end, mode)`
  * `cancel_vacation`
  * `reconcile_now`
* Consider (and tell me your recommendation) whether each room should also expose a virtual `climate` entity for voice assistants and standard thermostat cards.
* Config flow creates the integration. Rooms and TRV assignment are managed in the custom panel (HA areas can be used to pre-fill rooms and TRVs).

## UI requirements (critical: the user is non-technical)

Deliver a custom sidebar panel (the main UI) and a Lovelace card (one room, or a compact overview) usable in dashboards and the HA Companion app.

### Principles

* Large touch targets (min 48 px), large readable temperatures, high contrast, works in HA light and dark themes.
* Mobile-first. Must be fully usable on a phone in the HA Companion app.
* No jargon: no "entity", "preset", "override", "HVAC", "reconcile" in the simple view. Use words like "Warm", "Saving", "Night", "Away", "Holiday", "Changed by hand until 18:00", "Back to plan".
* Every screen answers two questions at a glance: what is happening now, and what happens next.
* Destructive or broad actions (vacation for the whole house, deleting a schedule) need a clear confirmation. Everyday actions (+/−, back to plan) do not.
* Localized: Czech (default) and English, via HA's translation mechanism and the user's HA language.
* Advanced settings are hidden behind an "Advanced" section, so the simple view can't be broken by accident.

### Simple view (home screen)

* One card per room showing: room name, current temperature, target temperature, the current mode as a colour + icon + word, and "until HH:MM → next mode".
* Big − / + buttons (step 0.5 °C) that create an override "until next change". It must be visibly marked as a manual change, with a big "Back to plan" button.
* A house-mode strip at the top: Normal / Away / Holiday / Off. Holiday opens a simple date picker (from–to).
* A health warning icon on a room card if something is wrong, with a plain-language explanation on tap.

### Schedule editor

* A visual weekly timeline per schedule (default + per room): 7 horizontal day bars, coloured blocks per mode.
* Tap a block to change its mode. Drag the block edges to change times (15-min snapping). Tap an empty point to split a block.
* "Copy this day to…" with checkboxes for the days.
* A per-room toggle: "Use the house plan" vs "Own plan for this room".
* Changes are saved explicitly (Save / Cancel), with a preview of the resulting week.

### Advanced

* Mode temperatures (global + per-room overrides), TRV assignment per room, max override duration, safety tick interval, health details, and a log of recent writes/overrides per room (what was sent, when, why, result).

## Frontend tech

* TypeScript + Lit (HA's own frontend stack), bundled into a single JS file served by the integration and registered as a panel via `panel_custom`. No external CDN at runtime.
* Communicate through HA websocket commands that the integration registers (get state, update config, etc.). Validate everything server-side.

## Code quality & testing

* Layout compatible with HACS (`custom_components/heating_scheduler/`, `hacs.json`, `manifest.json` with a version).
* Keep the domain logic (`resolve`, schedule model, override expiry) in pure Python modules with no HA imports, fully unit-tested with pytest. Cover:
  * precedence
  * day wrap-around
  * DST transitions
  * override expiry, including the max-duration cap
  * vacation start/end
  * room vs default schedule switching
  * rounding and clamping
* HA-level tests with `pytest-homeassistant-custom-component`:
  * startup reconcile
  * restart with a persisted override
  * a foreign-context change creates an override
  * our own echo does not
  * TRV unavailable → queued → written when available
  * write-verify retry
* Type hints everywhere. `ruff` + `mypy` clean. Async only, no blocking I/O in the event loop.
* A README covering installation, setup and a short user guide for the simple view (suitable to show a non-technical user).

## Phasing (propose adjustments)

1. Domain model + `resolve()` + tests
2. Integration core: storage, coordinator, reconcile, TRV writes with verification, override detection + tests
3. Entities, services, websocket API
4. Sidebar panel: simple view + house mode + vacation
5. Schedule editor
6. Advanced view, health, write log, Lovelace card
7. Czech/English translations, README
