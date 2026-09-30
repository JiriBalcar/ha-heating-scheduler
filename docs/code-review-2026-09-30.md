# Heating Scheduler code review

- **Review date:** 2026-09-30
- **Component:** `heating_scheduler`
- **Branch:** `main`
- **Reviewed commit:** `8699fde089f686d00629646fda21f50e0413705f`
- **Status:** Review complete; findings have not been fixed.

## Summary

The review found **9 confirmed defects**: **2 P1**, **6 P2**, and **1 P3**. The highest-priority defects can send an incorrect temperature to a valve or replace a newer manual setting with a delayed response to an older command.

The existing checks pass: **187 Python tests**, **95% aggregate Python coverage**, **26 frontend tests**, lint, formatting, and type checks. Additional targeted reproductions exposed behaviors that the existing tests do not cover.

| Priority | Meaning | Findings |
| --- | --- | ---: |
| P1 | High priority; directly affects heating targets | 2 |
| P2 | Correctness issue affecting runtime behavior or user workflows | 6 |
| P3 | Lower-impact configuration inconsistency | 1 |

## Scope

The review covered:

- Pure scheduling logic, weekly carryover, time zones and DST, override precedence, setpoint arithmetic, validation, serialization, and configuration operations.
- Engine lifecycle, reconciliation, valve writes, confirmation and retry handling, manual-change detection, persistence, health reporting, and logging.
- Home Assistant setup, entities, services, WebSocket commands, frontend registration, and packaging.
- Frontend stores, cards, panel, dialogs, schedule editing, settings, formatting, and build output.
- Existing tests and the intended behavior documented in [architecture.md](/Users/jbalcar/Development/ha-statek/docs/architecture.md), [spec.md](/Users/jbalcar/Development/ha-statek/docs/spec.md), and [README.md](/Users/jbalcar/Development/ha-statek/README.md).

## Findings

### F01 — P1: Fahrenheit settings produce incorrect valve targets

**Location:** [trv.py:333](/Users/jbalcar/Development/ha-statek/custom_components/heating_scheduler/trv.py:333), lines 333–338.

**Cause:** Scheduler temperatures are Celsius, but the worker compares them directly with Home Assistant climate attributes and sends them through the climate service without converting units. Home Assistant exposes climate temperatures in its configured temperature unit and converts service input to the entity's native unit. This behavior was checked in the installed HA implementation and the [upstream climate implementation](https://github.com/home-assistant/core/blob/dev/homeassistant/components/climate/__init__.py).

**Reproduction:** Configure HA with `US_CUSTOMARY_SYSTEM`, add a Celsius-native valve with a minimum of 5°C, and resolve a scheduled target of 21°C. The worker compares `21` with the reported minimum of `41`°F and sends `41` through the service. The physical valve receives **5°C instead of 21°C**, and the worker considers it synchronized.

**Impact:** A supported HA unit setting can cause substantial underheating without a synchronization warning. Reading manual setpoints and room temperatures has the same unit-boundary problem.

**Recommended fix:** Establish a consistent internal unit and convert temperatures and bounds at state-reading and service-writing boundaries. Include Fahrenheit-host tests for scheduled targets, manual changes, and displayed temperatures.

### F02 — P1: Delayed commands overwrite newer manual settings

**Location:** [echo.py:108](/Users/jbalcar/Development/ha-statek/custom_components/heating_scheduler/core/echo.py:108), lines 108–110.

**Cause:** Confirming a newer write discards all older pending writes. Canceling a worker does not guarantee that commands already sent to a valve cannot arrive later.

**Reproduction:**

1. Send a 21°C command with an eight-second response delay.
2. At one second, set a user override to 23°C with a one-second response delay.
3. Confirm the 23°C setting at two seconds.
4. Deliver the original 21°C command at eight seconds.

The old response is classified as a manual change and replaces the user override with a **device-origin override of 21°C**, also changing its expiry.

**Impact:** The integration can silently undo an intentional newer temperature setting because of its own delayed command.

**Recommended fix:** Retain superseded writes through their echo deadline. Recognize delayed responses and reconcile back to the latest desired target. Add a regression covering responses arriving in reverse order.

### F03 — P2: Heat commands can be confirmed before the valve turns on

**Location:** [echo.py:102](/Users/jbalcar/Development/ha-statek/custom_components/heating_scheduler/core/echo.py:102), lines 102–107.

**Cause:** `settle_pending()` confirms a heat write from the reported setpoint alone, even when `mode_switch=True`. The expected HVAC transition is not checked.

**Reproduction:** Start with a valve off at 21°C and a pending command to heat at 21°C. Before the mode command completes, deliver an unrelated current-temperature report that still shows the valve off at 21°C. This prematurely confirms the pending write. When the mode transition subsequently reports an intermediate 5°C setpoint, the engine treats it as a manual change.

**Impact:** The HA reproduction installed a **5°C room override lasting four hours**, replacing the intended heating target.

**Recommended fix:** Require both the expected HVAC mode and an acceptable setpoint before confirming a mode-switch write. Add a regression with an unrelated state report between dispatch and the HVAC transition.

### F04 — P2: Test mode does not stop active write cycles

**Location:** [trv.py:169](/Users/jbalcar/Development/ha-statek/custom_components/heating_scheduler/trv.py:169), lines 169–174.

**Cause:** Enabling `settings.dry_run` does not change `Desired`. When a write cycle is already running, `set_desired()` returns without canceling it. Neither the cycle nor the send path rechecks test mode before subsequent commands.

**Reproduction:** Let a valve ignore its initial 21°C command, enable test mode, then advance time by 31 seconds. The valve receives a second 21°C service call while test mode is enabled.

**Impact:** Test mode does not reliably honor its promise to send nothing to valves.

**Recommended fix:** Cancel active cycles when test mode is enabled and check `dry_run` immediately before each actual send, including after acquiring the write semaphore. Cover both retrying and queued workers.

### F05 — P2: Edits made during saving are incorrectly marked saved

**Locations:** [hs-plan-editor.ts:253](/Users/jbalcar/Development/ha-statek/frontend/src/components/hs-plan-editor.ts:253), lines 253–255; [hs-adv-settings.ts:114](/Users/jbalcar/Development/ha-statek/frontend/src/components/hs-adv-settings.ts:114).

**Cause:** Controls remain editable while the save request is pending. On completion, the code takes the current draft as the saved baseline instead of the draft submitted in the request.

**Reproduction:** Begin saving a modified plan, then change its name before the deferred WebSocket response resolves. The sent payload contains the earlier name, but completion records the later name as saved and sets `dirty=false`. The same behavior was reproduced by changing the maximum override duration in the settings editor during a save.

**Impact:** Unsent changes appear saved, Save becomes disabled, and navigation or a later refresh can silently discard those changes.

**Recommended fix:** Capture the submitted draft and use it as the acknowledged baseline, leaving subsequent edits dirty. Alternatively, disable editing until the request completes. Add component tests using deferred responses.

### F06 — P2: Merging schedule blocks redirects subsequent edits

**Location:** [hs-block-sheet.ts:102](/Users/jbalcar/Development/ha-statek/frontend/src/components/hs-block-sheet.ts:102), lines 102–105.

**Cause:** After normalization merges adjacent blocks, `findIndex(slot.start >= start)` selects the next block rather than the merged block containing the original start time.

**Reproduction:**

1. Use Night 00:00–06:00, Comfort 06:00–12:00, and Eco 12:00–24:00.
2. Open the Comfort block and select Night.
3. The morning blocks merge, but selection moves to the Eco block at noon.
4. Select another mode in the same dialog.

The final action changes the afternoon instead of the morning interval being edited.

**Impact:** An ordinary sequence of mode selections can modify the wrong part of a heating schedule.

**Recommended fix:** Select the merged segment containing the original start time. Test merging into both adjacent segments and subsequent edits within the same dialog.

### F07 — P2: Room dialogs cannot recover from revision conflicts

**Location:** [hs-room-dialog.ts:134](/Users/jbalcar/Development/ha-statek/frontend/src/components/hs-room-dialog.ts:134), lines 134–140. The opening snapshot is assigned at [line 250](/Users/jbalcar/Development/ha-statek/frontend/src/components/hs-room-dialog.ts:250).

**Cause:** The dialog captures its snapshot when opened and never refreshes it. Each save therefore uses the same opening revision.

**Reproduction:** Open a room dialog, change configuration through another client, then save the room. After the revision conflict, retry saving. Even when the shared store has received the newer snapshot, the dialog continues submitting the obsolete revision.

**Impact:** Retrying cannot succeed. Users must discard their draft and reopen the dialog, including when the concurrent change was unrelated to the edited room.

**Recommended fix:** Refresh the dialog's snapshot while preserving its draft. Detect whether the room itself changed before resolving a conflict and retrying with the current revision.

### F08 — P2: External temperature changes do not update the panel

**Location:** [engine.py:368](/Users/jbalcar/Development/ha-statek/custom_components/heating_scheduler/engine.py:368), lines 368–370.

**Cause:** The engine subscribes only to managed valve entities. A room's separate `temperature_entity` is not included. The virtual thermostat has its own listener, but its updates do not notify the engine's snapshot subscribers.

**Reproduction:** Configure an external display-temperature sensor, then change its state from 20°C to 23°C. The virtual thermostat updates to 23°C, but no engine listener notification is emitted.

**Impact:** The panel, card, and mode sensor retain the previous temperature until another engine event or the safety tick. Different integration surfaces can show different room temperatures.

**Recommended fix:** Track display-temperature sources and notify snapshot consumers when they change. Refresh these subscriptions when the selected sensor changes, including when the room's valve list remains unchanged.

### F09 — P3: Clearing a room area leaves its device assigned

**Location:** [entity.py:58](/Users/jbalcar/Development/ha-statek/custom_components/heating_scheduler/entity.py:58), lines 58–59.

**Cause:** The device-registry update is guarded by `room.area_id is not None`, so an explicit removal is never propagated.

**Reproduction:** Create a room assigned to Downstairs, then save its configuration with `area_id=None`. The configuration has no area, but the HA device remains assigned to Downstairs.

**Impact:** Area-based targeting remains inconsistent with the saved room configuration. This finding concerns configuration/API behavior; the current room dialog does not expose an area-clearing control.

**Recommended fix:** Propagate explicit area removal to the device registry and cover both assignment and removal in the entity tests.

## Validation results

| Check | Result |
| --- | --- |
| Full existing Python suite | 187 passed |
| Aggregate Python coverage | 95%, with branch coverage enabled |
| Ruff lint | Passed |
| Ruff formatting | 51 files already formatted |
| mypy | Passed; 47 source files checked |
| Frontend TypeScript check | Passed |
| Existing frontend tests | 26 passed |
| Frontend build comparison | Panel, card, and shared chunk match committed bundles byte-for-byte |
| Additional Python regression checks | Six failing assertions reproduced F01–F04, F08, and F09; one room-renaming control passed |
| Additional frontend component harness | Reproduced F05 in both editors, F06, and F07 |

The initial sandboxed Python run encountered local-server permission errors in eight WebSocket tests. The complete suite passed after rerunning with the access needed for the test server to bind to localhost; those initial errors were environmental.

### Reproduction artifacts

These artifacts were created outside the repository during review and may be removed by temporary-directory cleanup:

- [Runtime regression tests](/tmp/test_heating_runtime_review.py): F01, F02, and F04.
- [Mode-transition regression test](/tmp/test_heating_core_review.py): F03.
- [Entity and notification regression tests](/tmp/ha-statek-root-review/test_surface.py): F08, F09, and a passing room-renaming control.
- [Frontend reproduction harness](/tmp/ha-review-frontend-repro.mjs), using the [bundled component classes](/tmp/ha-review-frontend.mjs): F05–F07.
- [Baseline Python test output](/tmp/ha-statek-review-pytest.log).
- [Additional Python regression output](/tmp/ha-statek-review-regressions.log).

## Limits and repository changes

Device behavior was exercised through the existing Home Assistant simulation fixtures, including delayed responses, intermediate setpoints, and ignored commands. Physical valves and browser rendering were not exercised. No additional high-confidence defects were found in the reviewed scheduling, DST, persistence, health, or packaging paths beyond the findings above; passing checks do not establish that those paths are defect-free.

No implementation files or committed bundles were changed. This report is the only repository file added for delivery.
