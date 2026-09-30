# Heating Scheduler

A Home Assistant integration that decides the target temperature of every room and keeps
every radiator valve (TRV) in the room at that temperature. It has a simple sidebar panel
for phones and tablets, and a Lovelace card.

<p>
  <img src="docs/images/overview.jpg" alt="Overview: house mode and room tiles" width="220">
  <img src="docs/images/by-hand.jpg" alt="A room changed by hand" width="220">
  <img src="docs/images/holiday.jpg" alt="Holiday dialog" width="220">
  <img src="docs/images/plan-day.jpg" alt="Plan editor, one day" width="220">
</p>

- Weekly plans with modes: Warm, Saving, Night, Away, Frost guard, Off.
- Rooms share plans and temperature sets, so you set them once.
- House modes: Normal, Away, Holiday (planned in advance), Off.
- Manual changes on the valve knob or in the app last until the next change of the plan.
- The integration **reconciles** instead of firing actions at fixed times: after a restart,
  a missed timer or a valve that was offline for hours, every valve gets the right value.
- Writes are verified and retried; our own confirmations are never taken for manual changes.
- Czech and English. No cloud.

Boiler control, valve positions and temperature sensors of the valves are not touched.

## Requirements

- Home Assistant 2026.9 or newer.
- Radiator valves as `climate` entities. Tested with Sonoff TRVZB through Zigbee2MQTT.
- Temperatures in the panel, plans, temperature sets and services are always °C. Home
  Assistant itself may use °C or °F; the valves always get the right value.

## Installation

### HACS

1. HACS → ⋮ → **Custom repositories** → add this repository, type **Integration**.
2. Install **Heating Scheduler** and restart Home Assistant.

### Manual

Copy `custom_components/heating_scheduler` to `config/custom_components/` and restart
Home Assistant.

## Setup

1. **Settings → Devices & services → Add integration → Heating Scheduler.**
2. Open **Topení / Heating** in the sidebar.
3. **Advanced → Rooms → Add rooms from areas** creates one room per Home Assistant area that
   has valves. You can also add rooms by hand and pick their valves.
4. Optional: choose a **Temperature shown** sensor per room. It is used only for display.
5. **Plans**: change the house plan, or give some rooms their own plan.
6. **Advanced → Temperatures**: the house temperatures, and own sets for rooms that need
   other values (for example a warmer bathroom).

**First start:** turn on **Advanced → Settings → Test mode**. The integration then computes
and logs everything but sends nothing to the valves. Check **Advanced → Log**, then turn
test mode off.

### Sonoff TRVZB (Zigbee2MQTT) checklist

- Do not use the valve's own weekly schedule. The integration always sets HVAC mode `heat`
  (on the TRVZB, `auto` runs the internal schedule).
- Keep your automation that sends the room temperature to the valve
  (`external_temperature_input`). This integration does not touch it.
- Keep the valve's frost protection temperature below the **Frost guard** temperature.
- Enable Zigbee2MQTT **availability** so that offline valves are reported.

## Návod pro každý den (česky)

**Co vidím.** Každá místnost má svou kartu:

- **V místnosti** je teplota, která v místnosti je teď.
- Velké číslo je teplota, kterou má místnost mít.
- Barevný štítek říká, co se děje teď: **Teplo**, **Úspora**, **Noc**, **Pryč**,
  **Proti mrazu**, **Vypnuto** nebo **Ručně**.
- Text vedle štítku říká, co přijde potom, například „do 22:00 → Noc 18,0 °C“.

**Chci tepleji nebo chladněji.** Klepněte na **+** nebo **−**. Každé klepnutí je půl stupně.
Změna platí do další změny v plánu. Karta má pak fialový okraj a štítek **Ručně**.
Tlačítko **Zpět na plán** změnu hned zruší.

**Otočil jsem kolečkem na hlavici.** To je totéž jako **+** nebo **−**. Ostatní hlavice
v místnosti se nastaví stejně. Po další změně v plánu se vše vrátí samo.

**Odcházím nebo odjíždím.** Nahoře je řádek **Celý dům**:

- **Pryč**: krátká nepřítomnost. Všechny místnosti budou na teplotě Pryč.
  Po návratu klepněte na **Jsem doma — Normálně**.
- **Dovolená**: vyberte, kdy se vrátíte. Dům bude jen chráněný proti mrazu.
  V den návratu se topení vrátí samo, nic nemusíte dělat.
- **Vypnuto**: topení je vypnuté (léto).
- **Normálně**: topí se podle plánu.

Během režimů Pryč, Dovolená a Vypnuto nejde teplota v místnosti měnit. Nejdřív přepněte dům
na **Normálně**.

**Oranžový vykřičník.** Některá hlavice neodpovídá nebo nepřijala teplotu. Klepněte na
vykřičník, uvidíte vysvětlení. Nejčastěji jde o vybité baterie.

**Změna plánu.** Otevřete **Plány**, vyberte plán a klepněte na den. Časy změníte posunutím
bílých úchytů nebo klepnutím na úsek. **Kopírovat den do…** zkopíruje den na jiné dny.
Nakonec klepněte na **Uložit**.

## Everyday guide (English)

- Each room shows the temperature **in the room**, the temperature it is **set to**, what
  happens now (a coloured label) and what comes next ("until 22:00 → Night 18.0 °C").
- **+** and **−** change the room by half a degree until the next change of the plan.
  **Back to plan** ends the change at once. Turning the knob on a valve does the same.
- **Whole house**: **Away** for short absences (press **I'm home — Normal** when back),
  **Holiday** with a return date (heating comes back by itself), **Off** for summer,
  **Normal** to follow the plans. In Away, Holiday and Off, room temperatures are fixed.
- An **orange exclamation mark** means a valve has a problem; tap it for an explanation.
- **Plans**: tap a day, drag the white handles or tap a part, then **Save**.

## How it works

For every room the integration computes the target with a pure function:

1. House mode **Off**, **Holiday** or **Away** wins.
2. Otherwise a **manual change** (from a valve knob, the app, a service or voice) wins until
   the next change of the plan, and at most the longest manual change (default 4 h).
3. Otherwise the room's **plan** decides, with the room's temperatures.

It then brings every valve to that value. It recomputes on start, at the next change of
any room, on every change of settings, every 5 minutes, and when a valve comes back online.
Values are rounded to the valve's step and limited to its range. Each write is confirmed by
the valve; lost commands are sent again (after 30, 60 and 120 seconds). DST changes are
handled: a plan time that does not exist is used at the end of the gap, a time that occurs
twice is used once.

A change of the house mode ends all manual changes. When a holiday ends, the house returns to
the mode it had when the holiday started.

## Entities

Entity ids depend on the Home Assistant language; English names are shown.

| Entity | Per | Purpose |
|---|---|---|
| `climate.<room>` | room | Room thermostat for voice assistants and thermostat cards. `auto` = plan, `heat` = manual change, `off` = off. |
| `sensor.<room>_heating_mode` | room | Current mode; attributes: target temperature, reason, until, next mode, manual change. |
| `button.<room>_back_to_plan` | room | Ends a manual change. |
| `binary_sensor.<room>_heating_problem` | room | On when a valve is offline, a write failed or a wrong value persists. |
| `select.heating_house_mode` | house | Normal (`auto`), Away, Holiday (`vacation`), Off. |
| `number.heating_temperature_*` | house | House temperatures of Warm, Saving, Night, Away, Frost guard. |

Tip: hide the valves themselves from voice assistants and use the room thermostats.

## Services

| Service | Data |
|---|---|
| `heating_scheduler.set_override` | target: room thermostat; `temperature`; optional `duration` or `until` |
| `heating_scheduler.clear_override` | target: room thermostat |
| `heating_scheduler.set_house_mode` | `mode`: `auto`, `away`, `vacation`, `off` |
| `heating_scheduler.set_vacation` | optional `start`, `end`, `mode` (`frost` or `away`) |
| `heating_scheduler.cancel_vacation` | — |
| `heating_scheduler.reconcile_now` | — |

Example: warm the bathroom for an hour.

```yaml
action: heating_scheduler.set_override
target:
  entity_id: climate.bathroom
data:
  temperature: 23.5
  duration: "01:00:00"
```

## Lovelace card

The card is loaded automatically. Add **Heating Scheduler** from the card picker, or:

```yaml
type: custom:heating-scheduler-card
room: room_1a2b3c4d   # optional; without it the card shows all rooms
show_house: true       # optional: the house mode strip
compact: false         # optional: smaller tiles
```

## Development

```bash
uv sync --python 3.14
```

```bash
uv run pytest --cov
```

```bash
uv run ruff check . && uv run mypy
```

```bash
cd frontend && npm ci && npm run check
```

`npm run check` type-checks, runs the frontend tests and builds the bundles into
`custom_components/heating_scheduler/dist/` (committed, so HACS needs no build step).

A local instance with simulated valves lives in `dev/`:

```bash
uv run python dev/seed.py
```

```bash
uv run hass -c dev/config
```

Design notes: [docs/architecture.md](docs/architecture.md). Original specification:
[docs/spec.md](docs/spec.md).

## License

MIT
