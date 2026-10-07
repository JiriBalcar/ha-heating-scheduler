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
│   ├── model.py       modes, plans, temperature sets, zones, rooms, house state, overrides
│   ├── timeline.py    local wall time → UTC instants, DST gap/fold rules
│   ├── resolve.py     resolve(), next_plan_change(), temperature merge
│   ├── overrides.py   expiry rules incl. max-duration cap
│   ├── setpoint.py    round, clamp, tolerance, in-sync test
│   ├── echo.py        own write vs manual change
│   ├── window.py      open-window signals, temperature-drop detector
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
- **House state**: a selected mode (`auto`, `away`, `frost`, `off`) plus an optional vacation
  (start, optional end, frost or away). The effective house mode is `vacation` while the
  vacation covers the instant. When a vacation ends, the zone returns to the selected
  mode, which is the mode that was active when the vacation started **(decision)**.
  Selecting another mode during an active vacation ends the vacation.
- **Zones (decision, 2026-09-30)**: each zone has its own house state, so a part of the
  house (for example a floor) has its own mode and holiday. Every room is in one zone
  (`zone_id`). There is always at least one zone: a new installation has one zone for the
  whole house, and the last zone cannot be deleted. Deleting a zone moves its rooms to the
  first remaining zone. Zones have an order, which the UI and the selects follow.
- **Frost guard and zone modes (decision, 2026-10-01, user request)**: Frost guard (`frost`) is
  a house mode like Away: every room at the Frost guard temperature, with no end. Each zone
  offers a set of modes (`modes`, always with `auto`) and, for each mode it leaves out, a
  replacement (`replacements`): a mode it offers, never `vacation`. The house select and the
  house services give each zone the mode or its replacement (`Zone.instead`). A holiday for a
  zone without `vacation` is a vacation window with a `replacement`: the effective mode is the
  replacement during the window, and the zone returns to its selected mode after it. The house
  shows mode M while every zone's effective mode is `instead(M)`, so the whole house is Away
  while a zone without Away stays Normal. Saving a zone's modes (`zone/save`) moves a zone in
  a mode it no longer offers to the replacement, and a vacation to the new form (`fit_zone`).
  Validation (`zone_modes`): the replacements cover exactly the missing modes, and the zone's
  mode and vacation fit its modes.
- **Boost (decision, 2026-09-30, user request; per zone and room on 2026-10-01)**: the whole
  house, each zone and each room have boosts of their own, each an end time in the state store
  (`boost_until`, `zone_boosts`, `room_boosts`). A room heats at full while any of them covers
  it, until the latest end: its target is the highest `max_temp` of its valves (35 °C if no
  valve reports one), and the usual clamping gives each valve its own maximum. Stopping one
  boost leaves the others running. The length comes from the settings (default 1 h, 15 min to
  4 h; the panel offers 30 min to 4 h) or from the `boost` service. A boost of the house or of
  a zone means someone is home: it switches those zones to Normal first (this also ends a
  running holiday and Frost guard). A room's boost (its thermostat's preset `boost`) starts
  only while its zone is Normal, like a manual change; another preset or `auto` ends it. When a
  zone leaves Normal (Away, Frost guard, Off, a holiday, also a planned one that starts),
  housekeeping ends its boost and its rooms' boosts, and the house's boost once no zone is
  Normal. A room under the boost of its zone or the house takes no manual changes
  (`boost_active`). Boosts that ended while HA was stopped are dropped at start. The zone boost
  has no control in the panel (user's decision): a tile of HA for its switch starts it.

- **Open windows (decision, 2026-10-04, user request TIN2-10)**: a room detects an open window
  in one of three ways, because valves differ: contact sensors (`window_sensors`: binary sensors
  of windows or doors, or `input_boolean`), the valves' own detection (`valve_window_sensors`: a
  binary sensor, or a sensor whose state is a word such as `open`, as some valves report it), or
  a fast drop of the room temperature (`window_drop`). One way per room (user's decision,
  2026-10-07: setting all three at once was confusing): validation refuses more
  (`one_window_method`), and configuration 2.3 keeps a stored room's window sensors, else the
  valves' detection, else the drop. A contact counts after `window_delay` (default 30 s, 0 s to
  10 min), so a quick open and close does nothing; the valves' detection and the drop count at
  once, they have waited already. The room counts as open from the earliest signal. While open,
  its valves are off (HVAC off, else their minimum). After `window_limit` (default 1 h, 15 min
  to 24 h) the room heats at Frost guard, so a forgotten window cannot freeze it. When every
  signal says closed, the room returns at once to whatever the plan, a manual change or a boost
  says then; an open window ends none of them. Knob turns while open are undone, changes from
  the app or a service are refused (`window_open`), a boost can start and heats after the window
  closes. Since when each signal says open is stored per room in the state store (`windows`,
  user's decision 2026-10-04), so a restart keeps the delay and the limit: an open signal counts
  from the earlier of the stored instant and the `last_changed` of its open sensors. While its
  sensors are offline, missing or not yet known (HA starting), the instant is kept but does not
  count; once every sensor says closed, it is dropped, so a window closed while HA was down is
  forgotten (`merge_signal`). A drop detection is restored from its instant; the lowest
  temperature is not stored, so the first sample after the restart becomes the lowest. The drop detector (`DropDetector`) counts open
  when the room temperature (the shown temperature) falls by `window_drop_degrees` (default 1 °C,
  0.2 to 5) within `window_drop_period` (default 5 min, 1 to 60 min), and closed when it rises
  `window_drop_rise` (default 0.3 °C, 0.1 to 3) above its lowest value since then, or after
  `window_drop_hold` (default 30 min, 5 min to 4 h). The rules are settings for the whole house
  (user's request, 2026-10-04); new rules start the detectors over. Its samples live in memory
  only; its open-since instant is stored (see above). A valve with its own detection may also change its setpoint, just before or after it
  reports the window: a manual change within 10 s of such a report is undone and not kept as an
  override (`VALVE_WINDOW_GRACE`). The candidates for the valves' detection are the binary sensors
  and sensors with `window` in their id on the valves' devices (not the switch that turns the
  detection on, e.g. the TRVZB's `open_window`).

## resolve()

```python
resolve(now, house, plan, temperatures, override, tz, boost=None, window=None) -> RoomTarget(
    mode, temperature, reason, valid_until, next)
```

`house` is the house state of the room's zone.

Precedence **(decision)**: house mode `off` / `frost` / `vacation` / `away` → open window →
boost → manual change (override) → the room's plan. An open window is `OpenWindow(since, limit)`;
its target is mode `window`, off until `limit` and at the Frost guard temperature after it. When
it closes is not known, so `resolve()` keeps it open in the forecast; a `since` in the future
(the delay of a contact sensor) is the next change. A boost starts only when every zone is Normal, so a house mode
wins over it only when a planned holiday starts during the boost; the holiday start is a
change instant, so the timer runs then and housekeeping ends the boost. A manual change never
beats a house mode or a boost; knob changes then are undone, and changes from the app or a
service are refused (`boost_active` during a boost).

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
- Housekeeping first: drop expired overrides, end an expired boost, clear the finished
  vacation of each zone.
- A change of a zone's effective mode clears the overrides of that zone's rooms
  **(decision)**. The state store keeps the last effective mode of each zone, so a change
  while HA was stopped also clears them.
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
- In house modes away / vacation / frost / off, while a window is open, and during a boost, a
  manual change is logged and undone.
- After an echo that moved the setpoint or HVAC mode (for example a cancelled write that
  landed late), an idle worker checks the TRV again and corrects it at once.
- Config commands return the new revision. Editors detect whether the edited item itself
  changed elsewhere and ask before overwriting; unrelated changes do not block saving.

## Persistence

| Store key | Content | Save |
|---|---|---|
| `heating_scheduler.config` | zones with their house state, rooms, plans, temperature sets, settings | immediately |
| `heating_scheduler.state` | overrides, last effective mode of each zone, boost ends (house, zones, rooms), since when each room's window signals say open | 2 s delay, flushed on stop |
| `heating_scheduler.log` | last 100 events per room | 60 s delay |

The configuration has a revision; websocket writes must send the revision they edited.

The configuration store is version 2.3, the state store 2.2 (2.2 adds `windows`; older state has
no open windows). The migration from 1.x turns the
house state into one zone, named „Dům“ or "House" by the HA language, and puts every room in it.
2.2 adds the modes of each zone and their replacements; a zone stored without them offers every
mode. The window fields of rooms and settings were added without a new version: a room stored
without them has no window signals, and the settings use the defaults. 2.3 keeps one way to
detect an open window per room (see Open windows).

## Home Assistant surface

- Devices: one per room, one "house" device. A room device follows the room's `area_id`
  when it is set or changed (also to none); an area chosen in Home Assistant for a room
  without `area_id` is kept.
- The engine also follows the rooms' display temperature entities, so the panel, the card
  and the mode sensor show a new room temperature at once.
- Per room: `sensor` (mode, attributes: target, reason, until, next, override, `window_open`),
  `button`
  (back to plan), `binary_sensor` (problem), `climate` (virtual thermostat) **(decision)**.
- Room thermostat: `heat` during a manual change or a boost, `off` while a window is open (until
  the limit). The preset `boost` is always listed: it starts the room's own boost. The attribute
  `status` holds the room tile's text, `window_open` says that a window counts as open.
- House: `select` (house mode), `switch` (boost; attributes `until`, `duration_minutes`), five
  `number` entities (house temperatures). The house mode
  select sets every zone. While the zones differ, its state is `mixed` ("Různě", decision
  2026-09-30) and the attribute `zones` holds the mode of each zone. `mixed` is one of the
  options only then, because a select's state must be an option; selecting it is an error.
- Zones: with two or more zones, one `select` (unique id `zone_<id>_mode`, options: the zone's
  modes) and one boost
  `switch` (`zone_<id>_boost`) per zone. They are added and removed when zones are added and
  removed (`async_add_zone_entities`). A renamed zone renames them: HA caches an entity's name
  and new translation placeholders do not clear it, so `ZoneEntity` clears it itself.
- Services: `set_override`, `clear_override` (target: room thermostat), `set_house_mode`,
  `set_vacation`, `cancel_vacation`, `boost` (optional `duration`), `reconcile_now`. The house
  services and `boost` take an optional `zone` (name in any case, or id); without it they
  apply to every zone (`boost`: the house's own boost).
- Create zones from floors (`zones/from_floors`) uses HA's floor registry. A room's area is
  its own `area_id`, or else the area of its first valve that has one (the entity's area,
  else its device's area). A zone with the floor's name is reused. Zones that the import
  leaves empty are removed, but one zone always stays.
- Websocket commands under `heating_scheduler/`; see `websocket.py`.
- **Icon (decision, 2026-09-30, chosen by the user from designs on a canvas).** A thermostat dial
  (HA's thermostat arc and knob) around HA's flame, in the heating orange. `brand/icon.png` and
  `brand/icon@2x.png` (256 and 512 px, centred): HA 2026.3 and newer serves them itself, and HACS
  accepts them instead of an entry in `home-assistant/brands`. The sidebar shows the same dial in
  one colour, `heating-scheduler:dial`: HA's `<ha-icon>` looks up other prefixes than `mdi` in
  `window.customIcons`, which the sidebar icon module fills on every page (`icons.ts`; HACS does
  the same for its icon). The dial's track is `secondaryPath`, which HA draws at half opacity. Next
  to the knob the arc ends straight inside the knob's ring, so the ring hides the ends the way the
  colour icon's white knob does.
- **Sidebar icon drawn too early (fix, 2026-10-07; the user kept the dial over an MDI icon).**
  After a fresh install the sidebar entry showed its title with an empty icon. `<ha-icon>` draws a
  prefix it does not know as the legacy `<iron-icon>`, which HA no longer has, and never looks
  again. That happens in every page opened before the integration was added: HA adds the icon
  module to a page only when the page loads, and on the first reload HA's service worker serves
  its old copy of a visited page, so only the second reload brought the dial. It also happens when
  HA draws the sidebar before the icon module ran. The icon module and the main bundle (the panel,
  and the card, which loads it) therefore redraw our icons once the dial is registered
  (`redrawIcons`): they reset `<ha-icon>`'s internal `_legacy` flag and set the icon again. Opening
  the panel once draws the dial in such a page. If HA renames the flag, the redraw does nothing.
- Permissions: every HA user may use every function **(decision)**.
- Each room can have a display temperature entity (sensor or climate); without one, the
  UI shows the average `current_temperature` of the room's TRVs **(decision)**.

## Frontend

- TypeScript + Lit 3 (no decorators), built with esbuild into `dist/` as three bundles:
  `heating-scheduler-panel.js` (panel, card, all components), `heating-scheduler-card.js` (a
  small card loader) and `heating-scheduler-icons.js` (the sidebar icon). The bundles are
  committed; CI checks that they match the source.
- The panel is registered with `panel_custom` (`require_admin: false`, `handle_safe_area:
  true`); the sidebar icon module is loaded on every page with `add_extra_js_url`; the card
  loader is a dashboard resource. URLs carry a hash of the bundles for cache busting.
- **Card as a dashboard resource (decision, 2026-10-01, user).** HA documents cards only as
  dashboard resources; it documents no way for an integration to ship a card. An extra module
  (`add_extra_js_url`) starts in parallel with HA's app and can run before the app's element
  registry is in place (home-assistant/frontend#53890, open). With the card loaded that way, the
  Android app showed "Custom element doesn't exist" on every start, although our elements wait
  for HA's root element (see Element registration). Dashboards load their resources after the
  app has started. On setup, the integration keeps exactly one resource for the card at the
  current URL in Lovelace's resource collection (`hass.data[LOVELACE_DATA].resources`, as HACS
  does; not a public API): it creates it, updates an old URL and removes duplicates. A reload
  keeps it; removing the integration deletes it. Resources kept in YAML cannot be written: a
  warning names the URL to add. The sidebar icon must load on every page, so it stays an extra
  module; it defines no element, so the start order cannot break HA's app, and a dial that HA drew
  before the module ran is redrawn (see the sidebar icon above).
- **Card loader (decision, 2026-09-30).** HA's service worker serves old copies of pages and
  files for a while after an update, so the card loader can be old. The loader therefore
  imports the main bundle by the URL in HA's live panel list, and the card and the panel always
  run the same code. The loader itself is small and rarely changes. HA loads dashboard
  resources (and extra modules) only when the page loads, so a page opened before the
  integration was installed has no card until it reloads. The panel bundle therefore defines the
  card too: opening the panel once brings the cards back.
- **Element registration.** HA's app installs a scoped custom element registry polyfill; an
  extra module can run before it (the card loader was one until 2026-10-01). Our elements are
  defined only after HA has defined its root element (`components/define.ts`); an earlier
  definition breaks all our elements.
- **HA look and components (decision, 2026-09-30).** The UI uses HA's own elements wherever
  HA has one: page layout with tabs (`hass-tabs-subpage`), `ha-card`, tile parts
  (`ha-tile-*`), `ha-control-select`, `ha-control-number-buttons`, `ha-control-button`,
  `ha-dialog`, `ha-form` with selectors (entity, area, date, time, select), `ha-select`,
  `ha-input`, `ha-switch`, `ha-settings-row`, `ha-md-list-item`, `ha-dropdown`, `ha-alert`,
  `ha-button`, `ha-icon-button`, `ha-svg-icon`. Own elements remain only where HA has none:
  day bars, week view, the time stepper. HA guarantees none of these to a custom panel; they
  come with chunks HA loads in the background, and the panel waits for them (`ha.ts`). HA
  changes its internal elements between releases, so an HA update can require a release of
  this integration (accepted by the user).
- Dialogs follow HA's dialog protocol (`showDialog` / `closeDialog` / `dialog-closed`) and
  are opened through HA's dialog manager, so Back closes them. Messages use HA's toast
  (`hass-notification`); a valve opens HA's entity dialog (`hass-more-info`).
- **HA's own dialog box (decision, 2026-09-30).** Questions, a zone's name and notices use HA's
  `dialog-box` through `showConfirmationDialog`, `showPromptDialog` and `showAlertDialog` from
  `window.loadCardHelpers()`. HA gives these helpers to custom cards; they are not in HA's docs,
  but HA's maintainers point custom cards to them. HA's dashboard code defines them and HA loads
  it in the background, also when our panel opens first. Without them, the browser asks. Own
  dialogs remain only for content HA has no dialog for: forms, previews and the house dialog.
- Our own dialogs dim the page with a black overlay of 32 % instead of HA's `backdrop-filter:
  brightness(68%)`. Both dim the same, but browsers can draw the filter with a seam: a thin line
  across the whole page, darkened twice (seen in the user's browser, 2026-09-30). It also showed
  with HA's own entity dialog on a dashboard with our cards: the house tile's selector is its own
  compositing layer. So while our card or panel is on the page, the page root carries the overlay
  for HA's dialogs too (`scrim.ts`, counted per element; the last one to leave removes it). A
  theme that sets its own dimming keeps it: themes set their variables on the page root itself,
  HA's default comes from its style sheet.
- Dialogs keep their arguments in `args`, never in `params`. HA's dialog manager takes an
  element with a `params` property for its newer dialog type: it drops the element after
  closing and creates the next one without `hass`. A test guards this.
- A dialog opened again before its last opening has finished closing ends that opening first
  (its caller gets the choice made) and shows the new one in a new `ha-dialog`. The old
  `ha-dialog` fires `closed` late; HA's dialog manager keeps one entry per dialog, so a late
  `dialog-closed` would close the new opening. Dialogs set themselves up in `dialogOpened`.
- **House dialog (decision, 2026-09-30).** A tap on the house tile or a zone tile opens a
  dialog laid out like HA's alarm panel dialog: the state in big letters and HA's
  `ha-control-select` upright, with HA's sizes. HA itself has no such view for a `select`
  entity: its entity dialog shows a dropdown, and its tile feature for selects turns the
  button style off. HA uses the upright selector only for alarm modes and fan speeds. An
  `alarm_control_panel` entity was rejected: HA fixes its labels (Disarmed, Vacation, Custom
  bypass), and voice assistants and HomeKit would treat it as a security alarm.
- **Dashboard card (decision, 2026-10-01).** The Lovelace card is only the house tile or a
  zone's tile (`zone`), because HA's tile feature for a `select` is a dropdown. Rooms and boosts
  use HA's own tile cards: the room thermostat's attribute `status` holds the room tile's text
  ("Warm until 22:00 → Night 18.0 °C", `render_status`) for `state_content`, and its presets,
  Boost included, fit HA's preset feature. The card matches HA's tile exactly: two grid rows
  (`getGridOptions`), and in a sections view (`layout` "grid", rows not "auto") HA's fixed info
  height, as HA's tile card decides it. The hints above the tile need a card that can grow, so
  a fixed-height card leaves them out. HA draws the round background of a tile icon only for an
  interactive icon, so every icon has an action: the house icon opens the house dialog; a room
  icon explains a valve problem, or opens HA's dialog of the room's thermostat, as a tap on the
  room tile does (the thermostat is found through the room's device in HA's registries).
- **Zones in the UI (decision, 2026-09-30).** With one zone, the overview has one house
  tile and the rooms. With two or more zones, it has a Whole house tile, then each zone's
  tile followed by its rooms. The Whole house tile sets every zone; while the zones differ,
  it lists the mode of each zone and selects nothing. Advanced → Rooms groups the rooms by
  zone, with headings like HA's floor headings; moving a room up or down stays in its zone.
- **Hints and problems above the tiles (decision, 2026-09-30, after a UI review).** Back to
  Normal after Away, Holiday or Off, and a planned holiday, are shown once above the tiles
  (`hs-house-hints`; per zone while the zones differ), not in every tile, so all tiles have
  HA's one height (the house selector is 42 px, like the room tiles). A valve problem shows in
  the room tile's status line in the warning colour, and in one alert above the tiles. Holiday
  tapped during a holiday opens the Holiday dialog with its dates, to change them.
- **Boost tile (decision, 2026-09-30).** The panel's overview has a Boost tile after the Whole
  house tile (on a dashboard, HA's tile card of the boost switch). A tap on the tile or its
  button asks first, in HA's dialog box. The button stays off from the tap to the new state:
  HA's dialog box needs about a second to close, and a second tap in that time would ask
  again over it. During a boost, room tiles show Boost in red with a fire icon, and − / + are
  off.
- **Rows in narrow cards.** `ha-settings-row` gives the label and the control half the width
  each. A container query on the card stacks the control under the label when the card is
  narrow (the threshold depends on the control), as HA's own narrow layout does; HA's `narrow`
  follows the window, not the card.
- **Unsaved edits.** The plan editor, Temperatures and Settings tell the panel when they have
  unsaved edits (`unsaved.ts`). On a tab switch the panel keeps the view, puts its URL back
  and asks before discarding. HA's dialog box answers before it closes and then goes back in
  the browser history; `confirmDialog()` and its siblings return only after that, so a
  navigation that follows (for example "Discard" and leave) is not undone.
- **Open window in the room dialog (decision, 2026-10-07, user, from designs on a canvas).** One
  choice in HA's choice boxes (the `select` selector with `mode: box`): Off, Window sensors,
  Temperature drop, and the valves' own detection only where the room's valves report one (the
  candidates give each such entity with its valves; the dialog fills them in, nothing to pick).
  Only Window sensors shows a picker; the drop and the valves' detection say what they do, with
  the current rule. Window sensors without a sensor is not saved: the dialog asks for one.
- **Settings in cards (decision, 2026-10-07, user).** Test mode on top, then Heating, Open
  windows (the four drop rules fold into HA's `ha-expansion-panel`, with the rule and the rooms
  that use it as its summary) and Valves. Save is HA's floating button, shown while there are
  unsaved changes, as in HA's editors. Only a direct child of `hass-tabs-subpage` fills its
  `fab` slot, so the settings view reports its button (`fab.ts`) and the panel shows it.
- **Tabs (decision, 2026-09-30).** Overview · Plans · Temperatures · Advanced. Temperatures
  has its own tab like Plans, with the same layout: cards, a New button, and a card with the
  choice of each room. Advanced keeps the setup: rooms, zones, settings, health, log.
- **Sizes (decision, 2026-09-30, deviates from the spec).** Exact HA sizes: 42 px controls
  and 14 px text, as in HA's tile card. The spec asks for 48 px touch targets; the user
  accepted HA sizes because the Companion app's page zoom enlarges everything (115 % gives
  48 px).
- One websocket subscription per connection (`store.ts`) feeds the panel and every card.
- Panel strings are bundled (cs, en) and chosen from the user's HA language; Czech is the
  default. Entity, service and error strings use HA translation files.
- All times are shown in the house's time zone (plans are house wall time).
- Colours are HA theme colours (`--deep-orange-color`, ...); a mode colour always comes with
  an icon and a word.
- Pure plan-editing operations live in `frontend/src/schedule/ops.ts` (vitest).

## Testing

- `tests/core/`: pure unit tests and hypothesis property tests of `resolve()`.
- `tests/ha/`: `pytest-homeassistant-custom-component`. Fake TRVs are real climate entities
  on a mock platform, so Home Assistant keeps the service context on them for 5 seconds,
  like on Zigbee2MQTT entities. They can confirm late, round values, lose commands and go
  offline.
- `frontend/test/`: vitest for formatting, time zones, translations, plan operations, zones,
  components and dialogs.
- `dev/`: a local Home Assistant with simulated TRVZB valves (1–8 s confirmation delay) and
  room sensors, for manual checks in a browser.
