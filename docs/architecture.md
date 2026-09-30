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

## Units

- The scheduler works in °C: plans, temperature sets, overrides, services and the panel.
- Home Assistant shows climate temperatures in its own unit system and converts service
  input to each entity's unit. The TRV worker converts at that boundary: setpoints,
  limits and current temperatures are read in °C, and setpoints are sent in HA's unit.
  In °F, HA rounds shown values to whole degrees, so converted setpoints are put back on
  the TRV's step. Display sensors are converted from their own `unit_of_measurement`.
- The room thermostat and the house temperature numbers declare °C; Home Assistant
  converts them for display.

## TRV writes

- Desired off: `set_hvac_mode(off)` if supported, else the TRV's `min_temp`.
- Desired heat: ensure HVAC mode `heat` (never `auto`), then `set_temperature`.
- Round to `target_temp_step` (0.5 if missing), clamp to `min_temp`/`max_temp`.
- In sync: `|actual − desired| ≤ step/2`, or the TRV accepted a rounded value for the same
  desired value at the last verification (no write loops).
- Verify timeouts 30 s / 60 s / 120 s, 3 attempts, then `failed`; the next safety tick
  tries again. At most 2 writes run at once. Every write uses a new `Context`.
- Unavailable TRVs are never written; the worker keeps only the latest desired value.
- Test mode (`dry_run`) stops running write cycles at once, and every send checks it again
  after waiting for the write limiter.

## Manual-change detection

- Only the `temperature` attribute of managed TRVs counts.
- The context does not decide: Home Assistant stamps every state write of a TRV with our
  service context for 5 s (also a knob change), and a late confirmation has a new context.
  Writes still carry our own `Context`, for attribution only.
- Each TRV keeps a list of pending writes until they expire (a newer write does not cancel
  an older one that may still land). A report is an echo if it matches one of them: the
  commanded value (one step of rounding allowed until confirmed), or, before confirmation,
  the previous value (stale report). While a write also switches the HVAC mode, every
  setpoint change is an echo until the TRV reports the new mode and the value. After
  confirmation, only the commanded value is an echo. When a later write is confirmed,
  older ones are superseded: only their commanded value still counts, so a command that
  lands late is recognised and the TRV is set back to its target.
- Anything else is a manual change and becomes an override for the room: until the next
  plan change, capped by the max duration (default 4 h). After 3 s without further knob
  changes, the value goes to the other TRVs of the room.
- In house modes away / vacation / off, a manual change is logged and undone.
- After an echo that moved the setpoint or HVAC mode (for example a cancelled write that
  landed late), an idle worker checks the TRV again and corrects it at once.
- Config commands return the new revision. Editors detect whether the edited item itself
  changed elsewhere and ask before overwriting; unrelated changes do not block saving.

## Persistence

| Store key | Content | Save |
|---|---|---|
| `heating_scheduler.config` | rooms, plans, temperature sets, house, settings | immediately |
| `heating_scheduler.state` | overrides | 2 s delay, flushed on stop |
| `heating_scheduler.log` | last 100 events per room | 60 s delay |

The configuration has a revision; websocket writes must send the revision they edited.

## Home Assistant surface

- Devices: one per room, one "house" device. A room device follows the room's `area_id`
  when it is set or changed (also to none); an area chosen in Home Assistant for a room
  without `area_id` is kept.
- The engine also follows the rooms' display temperature entities, so the panel, the card
  and the mode sensor show a new room temperature at once.
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

- TypeScript + Lit 3 (no decorators), built with esbuild into `dist/`: an entry for the
  panel and one for the Lovelace card, with a shared chunk, so custom elements are defined
  once. The bundles are committed; CI checks that they match the source.
- The panel is registered with `panel_custom` (`require_admin: false`); the card is loaded
  with `add_extra_js_url`. URLs carry a hash of the bundles for cache busting.
- Own components only (native `<dialog>`, native date/time inputs, bundled MDI paths).
- One websocket subscription per connection (`store.ts`) feeds the panel and every card.
- Panel strings are bundled (cs, en) and chosen from the user's HA language; Czech is the
  default. Entity, service and error strings use HA translation files.
- All times are shown in the house's time zone (plans are house wall time).
- Filled buttons use a fixed dark blue (`--hs-accent`) so white text passes WCAG AA in the
  default light and dark themes; mode colours are fixed and always come with an icon and a word.
- Pure plan-editing operations live in `frontend/src/schedule/ops.ts` (vitest).

## Testing

- `tests/core/`: pure unit tests and hypothesis property tests of `resolve()`.
- `tests/ha/`: `pytest-homeassistant-custom-component`. Fake TRVs are real climate entities
  on a mock platform, so Home Assistant keeps the service context on them for 5 seconds,
  like on Zigbee2MQTT entities. They can confirm late, round values, lose commands and go
  offline.
- `frontend/test/`: vitest for formatting, time zones, translations and plan operations.
- `dev/`: a local Home Assistant with simulated TRVZB valves (1–8 s confirmation delay) and
  room sensors, for manual checks in a browser.
