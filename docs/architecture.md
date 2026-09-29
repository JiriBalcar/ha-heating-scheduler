# Heating Scheduler — architecture

This document records the agreed design. It wins over [spec.md](spec.md) where the two
differ. Decisions agreed on 2026-09-29 are marked **(decision)**.

## Environment

- Home Assistant 2026.9.x, Python ≥ 3.14.2. Tests pin HA 2026.9.4
  (`pytest-homeassistant-custom-component==0.13.367`).
- TRVs: Sonoff TRVZB through Zigbee2MQTT. On a TRVZB, HVAC mode `auto` runs the valve's
  own weekly schedule, so the integration always uses `heat`.
- Time zone: HA's configured zone (Europe/Prague in production).

## Layers

```
custom_components/heating_scheduler/
├── core/              pure Python, no homeassistant imports (a test enforces this)
│   ├── model.py       modes, plans, temperature sets, rooms, house state, overrides
│   ├── timeline.py    local wall time → UTC instants, DST gap/fold rules
│   ├── resolve.py     resolve(), next_plan_change(), temperature merge
│   ├── overrides.py   expiry rules incl. max-duration cap
│   ├── setpoint.py    round, clamp, tolerance, in-sync test
│   ├── echo.py        own write vs manual change
│   ├── validation.py  config rules with stable error codes
│   ├── schedule_ops.py plan operations, defaults
│   ├── serde.py       dict ↔ model, store migrations
│   └── text.py        reason texts (cs/en)
├── engine.py          state owner: reconcile, timers, manual-change detection
├── trv.py             TrvWorker: write, verify, retry, queue while unavailable
├── storage.py         HA Store wrappers (config, state, log)
├── websocket.py  services.py  entity platforms  config_flow.py  frontend.py
└── dist/              built frontend bundles (committed)
frontend/              TypeScript + Lit source
tests/core/  tests/ha/
```

## Domain model

- **Plans** are a shared library **(decision)**. The `house` plan always exists and cannot
  be deleted. Other plans have names. Each room follows exactly one plan (`plan_id`,
  default `house`). Plans are complete week plans; there are no "as house plan" blocks
  **(decision)**.
- **Temperature sets** are a shared library **(decision)**. The `house` set holds all five
  temperatures (comfort, eco, night, away, frost) and is exposed as `number` entities.
  Other sets hold only the modes they change; the rest come from `house`. Each room uses
  one set (`temp_set_id`, default `house`).
- A plan day is a list of `(start, mode)` slots. The time before the first slot of a day
  belongs to the last slot of an earlier day. The editor always saves a 00:00 slot, so
  each day bar is self-contained.
- **House state**: a selected mode (`auto`, `away`, `off`) plus an optional vacation
  (start, optional end, frost or away). The effective house mode is `vacation` while the
  vacation covers the instant. When a vacation ends, the house returns to the selected
  mode, which is the mode that was active when the vacation started **(decision)**.
  Selecting another mode during an active vacation ends the vacation.

## resolve()

```python
resolve(now, house, plan, temperatures, override, tz) -> RoomTarget(
    mode, temperature, reason, valid_until, next)
```

Precedence **(decision)**: house mode `off` / `vacation` / `away` → manual change
(override) → the room's plan. A manual change never beats a house mode; knob changes in
those modes are undone.

- `valid_until` is the next instant where (mode, temperature, source) changes, within
  8 days; `next` is the target after it.
- `reason` is structured (source, mode, until). `text.render_reason` makes the sentence for
  entity attributes; the panel renders it in the viewer's language.

## Time and DST

- Plan times are local wall times, mapped to UTC instants for the days around `now`.
- An ambiguous time maps to its first occurrence; a non-existent time maps to the first
  instant after the gap. Equal instants: the later slot wins.
- Only instants are compared. Adjacent equal modes merge, also across midnight.

## Engine

- Reconcile is a synchronous computation. Triggers coalesce into one run per event-loop
  iteration: HA started, next-event timer, any config / house / override change, safety
  tick (default 5 min), TRV available again, time zone change.
- Housekeeping first: drop expired overrides, clear a finished vacation.
- A change of the effective house mode clears all overrides **(decision)**.
- One `async_track_point_in_utc_time` timer at the earliest next event of all rooms.

## TRV writes

- Desired off: `set_hvac_mode(off)` if supported, else the TRV's `min_temp`.
- Desired heat: ensure HVAC mode `heat` (never `auto`), then `set_temperature`.
- Round to `target_temp_step` (0.5 if missing), clamp to `min_temp`/`max_temp`.
- In sync: `|actual − desired| ≤ step/2`, or the TRV accepted a rounded value for the same
  desired value at the last verification (no write loops).
- Verify timeouts 30 s / 60 s / 120 s, 3 attempts, then `failed`; the next safety tick
  tries again. At most 2 writes run at once. Every write uses a new `Context`.
- Unavailable TRVs are never written; the worker keeps only the latest desired value.

## Manual-change detection

- Only the `temperature` attribute of managed TRVs counts.
- Echo: our context, or a pending write with the new value within one step of the
  commanded value, or equal to the value before the write (stale report).
- Otherwise the change becomes an override for the room: until the next plan change,
  capped by the max duration (default 4 h). After 3 s without further knob changes, the
  value goes to the other TRVs of the room.
- In house modes away / vacation / off, a manual change is logged and undone.

## Persistence

| Store key | Content | Save |
|---|---|---|
| `heating_scheduler.config` | rooms, plans, temperature sets, house, settings | immediately |
| `heating_scheduler.state` | overrides | 2 s delay, flushed on stop |
| `heating_scheduler.log` | last 100 events per room | 60 s delay |

The configuration has a revision; websocket writes must send the revision they edited.

## Home Assistant surface

- Devices: one per room, one "house" device.
- Per room: `sensor` (mode, attributes: target, reason, until, next, override), `button`
  (back to plan), `binary_sensor` (problem), `climate` (virtual thermostat) **(decision)**.
- House: `select` (house mode), five `number` entities (house temperatures).
- Services: `set_override`, `clear_override` (target: room thermostat), `set_house_mode`,
  `set_vacation`, `cancel_vacation`, `reconcile_now`.
- Websocket commands under `heating_scheduler/`; see `websocket.py`.
- Permissions: every HA user may use every function **(decision)**.
- Each room can have a display temperature entity (sensor or climate); without one, the
  UI shows the average `current_temperature` of the room's TRVs **(decision)**.

## Frontend

- TypeScript + Lit 3, built with esbuild into `dist/`: an entry for the panel and one for
  the Lovelace card, with a shared chunk (custom elements are defined once).
- The panel is registered with `panel_custom`; the card is loaded with `add_extra_js_url`.
- Own components only; icons are bundled SVG paths.
- Panel strings are bundled (cs, en) and chosen from the user's HA language; Czech is the
  default. Entity, service and error strings use HA translation files.
