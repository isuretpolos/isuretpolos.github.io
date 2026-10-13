# Codex Implementation Brief: Radionics UI3D (v3)

## Mission

Implement a **working, testable first prototype** of a standalone Angular Progressive Web App that renders and operates Blender-authored radionics devices using Three.js and glTF 2.0. The application must be data-driven: new devices should ordinarily require only a `.glb` model and `device.json`, **not** new Angular component code. Also implement a simple Blender Python add-on for editing and exporting device configuration.

**Execute the tasks below in order, writing actual code, tests and documentation.** Do not stop after generating a design document or scaffolding. At the end, there must be a runnable local prototype with a demonstrable device, and an isolated GitHub Pages build for `/ui3d/`.

The user prefers **readable, straightforward code** over clever abstractions. Favor small named methods, clear TypeScript types, ordinary Angular services, and documented conventions. Avoid unnecessary dependencies, meta-frameworks, and excessive code generation.

## Existing repository and deployment constraints

- Inspect the repository and build scripts before making changes. Adapt paths to the actual repository without disturbing its existing applications.
- The GitHub Pages site is `https://isuretpolos.github.io/`. **UI3D must be served exclusively under `https://isuretpolos.github.io/ui3d/`**.
- Existing `/ui/` and root content must continue working unchanged. Never overwrite the root `index.html` or existing `/ui/` assets. Treat `ui3d/` as the **published build output** and prefer `ui3d-src/` (or another clearly documented source directory) for the Angular source, unless the repository already has a better arrangement.
- Use a current, mutually compatible stable Angular/TypeScript/Three.js toolchain, pinned through the lockfile. **Record the chosen versions (Angular, TypeScript, Three.js, Node) in `README.md`.** Do not blindly upgrade unrelated projects.
- Prefer a static site with **no mandatory backend, Docker, paid APIs, or cloud dependencies**. Models, configurations, fonts, decoders and default graphics must be bundled locally.
- Ensure relative asset URLs, Angular base href `/ui3d/`, PWA start URL/scope `/ui3d/`, and scoped service-worker registration. Avoid caching or intercepting `/ui/` and site-root content.
- GitHub Pages often returns 404 on deep Angular routes: use a single screen with in-app state or hash routing, unless a proven fallback is configured.
- Provide clear Windows-friendly development instructions, npm scripts, and a build-and-publish workflow. Never commit unrelated build changes without need.
- Provide `ASSETS.md` listing origin and license of every bundled model, font and icon (including the demo device).

## Architectural principles

1. **Blender owns geometry and placement**: body, pivots, control meshes, display planes, cameras, optional animations.
2. **`device.json` owns behavior**: control types, values, rules, bindings, rate groups, animation mappings, surface rendering and defaults.
3. **Runtime state is separate from immutable device definitions**. Per-device instances have unique instance IDs (D19).
4. **The state and event engines are the single sources of truth**. Meshes, LEDs, displays, animations and broadcast graphics react to state; they do not contain business logic. Final visual poses are derived from state, never from animation completion.
5. **Conventions first, configuration overrides second**. Automatically recognize names; allow per-object customization without a code change.
6. **No `eval`, `new Function`, or execution of arbitrary JavaScript from imported models/configurations**. Use a small, well-tested declarative rule evaluator or a safe expression parser with an explicit whitelist. Invalid rules must report actionable errors.
7. **One property, one owner**: prevent simultaneous direct property updates and animations from fighting over the same material/rotation/visibility channel.
8. **Progressively deliver**: maintain a runnable demo after every milestone. Do not delay the first prototype until advanced animation features are complete.

## Resolved design decisions (authoritative)

These rules replace any ambiguity elsewhere in this document. Implement them exactly, document them in `DEVICE_SCHEMA.md`, and cover each with unit tests.

### D1. Object-name normalization and duplicate names

Name matching is case-sensitive. Names must not contain spaces; a name with spaces is a validation warning.

Blender appends `.001`, `.002` … when a name is already taken. Handle this as follows:

1. Detect every object whose name matches `\.\d{3}$`. The Blender validator **always flags** such names, because they usually indicate an accidental duplicate.
2. At runtime, a suffixed name (e.g. `knob10_1.001`) is stripped to its base name (`knob10_1`) **only if the stripped name is unique in the loaded scene**. This is reported as a warning.
3. If the stripped name collides with another object (`knob10_1` and `knob10_1.001` both exist), or two objects strip to the same base name, this is a **validation error** requiring explicit renaming. Nothing is silently normalized and the device does not activate until fixed (the developer panel shows both offending objects).
4. Exact duplicate names in the scene graph (possible after glTF import) are the same error.

### D2. State IDs (one rule)

- The **engine default** state ID of a control is its **full normalized object name** (`knob10_1` → state `knob10_1`).
- A template may set `"stateFrom": "suffix"`, which uses the part after the template prefix instead (`switch_power` → `power`, `knob135_frequency` → `frequency`).
- An explicit `stateId` on an object override beats both.
- The shipped example templates use `"stateFrom": "objectName"` for `knob10_` and `"stateFrom": "suffix"` for `switch_`, `button_` and `knob135_`.
- Two controls resolving to the same state ID is a **validation error** (Blender add-on and runtime loader).

### D3. Binding model: `source` versus `when`

A binding has exactly these fields:

- `object`: the target object name.
- `target`: `"text"`, `"led"`, `"visibility"` or `"surface"`.
- `source`: **a state key only** (`knob10_1`, `power`, `rate.main`). Never an expression.
- `when`: **an optional boolean condition expression** (`power && broadcast`). Never a state key used as a value.

Rules:
- `text` bindings require `source`. `led` and `visibility` bindings use `when` (or `source` for a plain boolean state). `when` may also gate a `text` binding (text hidden when false).
- Providing an expression in `source` is a schema/validation error with a message pointing to `when`.
- Example: `{"object": "led_broadcast", "target": "led", "when": "power && broadcast"}`.
- **LED convention:** `led_<x>` with no explicit binding binds to boolean state `x` (`led_power` → `power`).

### D4. `canvas_<remainder>` source resolution

Resolution order for a mesh named `canvas_<R>` (after D1 normalization). Stop at the first match:

1. An explicit binding for the object (JSON, then Blender extras).
2. `R` equals a known state ID (`knob10_1`, `power`, `gv`).
3. `R` starts with a known namespace (`rate`, `hotbits`, `broadcast`) followed by `_`; replace **only that first `_`** with `.` and check for a known derived key (`rate_main` → `rate.main`).
4. Otherwise: warning "unbound canvas", object left blank.

If steps 2 and 3 would both match, report an **ambiguity error** and require an explicit binding. `broadcastCanvas` and `broadcastCanvas_<id>` are handled by the broadcast-surface mechanism, not by this rule. Known namespaces and derived keys come from the loaded device definition, never from a hard-coded list scattered through components. Resolution only considers the **same device instance** (D19).

### D5. Template matching

An object matches the template with the **longest matching prefix**. Equal-length ties are a validation error. An object matches at most one template. Precedence for properties: **explicit JSON object override > Blender extras > matching template > engine defaults**. Template matching is subject to D16 (descendants of a registered control are not scanned).

### D6. Control value/angle mapping

Given `minAngle`, `maxAngle`, `minValue`, `maxValue`, `step`:

```text
steps      = (maxValue - minValue) / step
angle(v)   = minAngle + ((v - minValue) / (maxValue - minValue)) * (maxAngle - minAngle)
value(a)   = minValue + round(((a - minAngle) / (maxAngle - minAngle)) * steps) * step
```

Example: `knob10_` (0–9, -135°..+135°, step 1) gives 30° per step. Inputs are clamped to range before mapping. Implement as pure functions with unit tests.

### D7. Knob interaction defaults

- **Drag model: linear vertical drag.** Dragging up increases the value, down decreases it. Default sensitivity: **24 CSS pixels per step**, configurable per template (`dragPixelsPerStep`). Angular drag around the knob center is not required in v1.
- **Out-of-range behavior: clamp** by default; template option `"wrap": true` wraps (9 → 0). Wrapping is only for the drag/keyboard path; stored values always stay inside range.
- **Snap:** values always snap to `step`; the control animates to the snapped angle (short ease, ≤120 ms) rather than following the raw pointer.
- **Keyboard:** focused control, Arrow Up/Right = +step, Arrow Down/Left = −step, Home/End = min/max.
- Starting a drag on a control disables orbit controls until pointer release.
- `switch_*`: tap/click toggles. `button_*`: `"mode": "momentary"` (default, fires an action on press/release) or `"toggle"`.
- A pointer hit on any child mesh resolves to the nearest registered control (D16).

### D8. Broadcast rate mode: LIVE versus SNAPSHOT

- Template/device option `broadcast.rateMode`: `"snapshot"` (**default**) or `"live"`.
- **SNAPSHOT:** when broadcast starts, the rate strings of all rate groups are copied into the broadcast session. Knob changes during the session do **not** change the running signature. The surface and debug panel show `SNAPSHOT` plus the frozen signature, and indicate when the current knobs differ from it.
- **LIVE:** the running signature follows the current `rate.*` values; each change emits `rate.changed` and the surface updates on the next frame. The surface shows `LIVE`.
- The mode can only be changed while broadcast is stopped.
- Snapshots are saved with presets (Phase 6) together with their mode.

### D9. Rate group ordering

`rateGroups[].members` is an ordered array and is the single source of truth for order. `rate.<id>` is a **string** joined with `separator`, preserving leading zeros (`0-5-7`). In Blender the order is stored as an ordered collection property on the scene (with move up/down in the panel) and exported in that order.

### D10. Persistence scoping

IndexedDB keys are scoped by `device.id` + `device.version` + `schemaVersion`. A preset whose key does not match the loaded definition is **not applied**; the app shows a short notice and offers Reset. Presets never silently load against a changed `device.json`.

For locally imported devices (D18) the key additionally includes a **SHA-256 content hash of `device.json`** (and a distinct `dev` scope marker), so a changed local file never inherits stale presets from a same-named device.

Presets are keyed by `device.id`, never by runtime instance ID (D19).

### D11. Fullscreen support statement

The Fullscreen API is supported on desktop browsers and Android Chrome. **iOS Safari does not support it for arbitrary elements.** On unsupported browsers: show guidance to "Add to Home Screen" and use the standalone PWA display mode, and provide a CSS **viewport-fill fallback** ("maximized view") that hides non-essential chrome. Acceptance criteria for fullscreen apply to desktop browsers and Android Chrome only.

### D12. glTF compression and size limits

The loader must configure **Draco and Meshopt decoders bundled locally** (no CDN), and optionally KTX2 if a transcoder can be bundled locally; unsupported extensions give a readable diagnostic, not a crash. Warn above a configurable model size (default 20 MB) and refuse above a hard limit (default 100 MB). Document recommended model budgets for mobile (triangle count, texture size).

### D13. Early state architecture (no throwaway prototype)

The minimal **state store, event bus and pure control-mapping functions (D6, D7)** are created in **Phase 1** and are the real implementations. Phase 2 **extends** them (definitions, validation, rules, derived values); it must not replace or rewrite a temporary Phase 1 prototype. In Phase 1 the demo controls already read and write the state store, and meshes and the debug panel already react to store events rather than to direct calls.

### D14. Early Blender round-trip verification

Immediately after the GLTFLoader is operational (Phase 2), add a minimal, repeatable round-trip check:

- A headless script (`tools/blender-roundtrip.py`, run via `blender --background --python`) builds or opens `sample_device.py`'s scene, exports a `.glb`, and writes a small JSON report of expected values.
- A runtime/test step loads the `.glb` and compares against the report: **object names, pivot/origin positions, transforms (position/rotation/scale), cameras, animation clip names, and UV coordinates** of canvas planes.
- **Axis space:** `axis` in templates and extras is defined in **Blender-authored local space**. The glTF exporter converts Z-up to Y-up (expected mapping X→X, Y→−Z, Z→Y when the default Y-up option is on), so the runtime must convert the configured axis accordingly. Verify against a real exported sample and add a test that a Blender-Z-axis knob turns about the visually correct axis in the viewer. Document the result in `BLENDER_WORKFLOW.md`.
- If no Blender executable is available in the coding environment, say so explicitly in the final report and mark the check **unverified**, not passed. Provide a recorded fixture only if it was genuinely produced by Blender.

### D15. Hotbits compatibility

When existing AetherOne or Radionics Workspace implementations are available in the repository or sibling repositories, inspect them and **reuse the established webcam sampling algorithm where practical** (check its license before copying code). Keep extraction behind the interchangeable `HotbitsProvider` interface and document the exact algorithm in `DEVICE_SCHEMA.md` or a dedicated doc (frame size, which channels/bits, whitening or not, rate, buffer size). If no existing implementation can be found, say so in the report; do not claim equivalence with an implementation that was not inspected. Webcam-derived bytes remain labeled experimental and never as verified cryptographic randomness.

### D16. Hierarchical controls

- An interactive control root (e.g. `knob10_1`) may be an `Object3D` group containing **multiple child meshes** (body, cap, pointer).
- **Raycasting a child resolves to its nearest registered interactive ancestor.**
- Rotation is applied to the **control root around its authored pivot**; child geometry and child-local transforms are never modified.
- **Once a node is registered as a control, its descendants are not scanned for control templates.** A child named `knob10_1_cap` therefore does not become a second control. Descendants named `led_*` or `canvas_*` keep their own registration as LEDs and displays (and then rotate with the control, which is expected).
- The nearest-ancestor and no-rescan rules are covered by tests.

### D17. Animation interruptions

When state changes faster than clips complete:

- **The latest state transition wins.** The current clip is **crossfaded out from its current pose over a short fixed duration** (default 120 ms); it is never left half-applied.
- The final pose is **derived from the settled state**, not from clip completion: after the last transition the visual result must match the state (power on/off, broadcast on/off) regardless of the interruption history.
- Direct rotation tweens (D7) and clips must not own the same channel simultaneously (principle 7); the animation controller records ownership and warns on conflicts.
- Rapid toggling (e.g. power on/off ten times quickly) is covered by a test that asserts the final state and that no loop keeps running after power off.

### D18. Local device import (development)

Provide a development import option that lets the user **select a local `.glb` and its matching `device.json`** (file picker and drag-and-drop) without any deployment.

- Only self-contained **`.glb`** is accepted in v1 (not `.gltf` with external buffers/textures).
- Validate both files **before activation**: JSON syntax, schema, size limits (D12), loader errors, and the D1–D5/D16 validation errors. Show all errors in the developer panel; the previous device stays active if validation fails.
- Imported files are held in memory only; **never** written to the service-worker cache. Object URLs are revoked on unload. Presets use the dev-scoped key (D10).
- No upload of imported files anywhere.

### D19. Device-scoped state and instance IDs

- Every loaded device gets a unique **runtime instance ID** (e.g. a counter or UUID). It is runtime-only: it is **never** written into `device.json`, glTF extras, or presets.
- State keys, derived `rate.*` values, rate groups, broadcast sessions, events, canvas textures and animation mixers are all **namespaced by instance ID**. Nothing resolves across instances, even when two devices have identical state or group names.
- Loading the same device twice yields two independent instances that share one preset library (keyed by `device.id`, D10).
- The event bus delivers events with the instance ID; subscribers filter on it. A test loads two instances of the same definition and asserts full isolation.
- v1 has no device-to-device references; if added later they must go through explicit instance IDs.

## Required deliverables

- Angular PWA source, Three.js renderer, loading and interaction system, device library and sample assets.
- `device.schema.json` (JSON Schema), one example `device.json`, runtime validator and clearly explained naming conventions (including D1–D19).
- A demonstrable **sample device**. Prefer creating a real, minimal `.glb` from Blender (including a script for reproducible generation). If Blender is unavailable in the coding environment, provide a *working procedural Three.js demo device* using the same runtime interface, plus a Blender sample scene-generation script; do not silently pretend a GLB was tested.
- The Blender round-trip check (D14) and local import (D18).
- Blender Python add-on (`blender-addon/`) exposing a **Radionics Device** sidebar panel. See Phase 7 for the required minimum; the first version may be partial but must do real work and be honestly documented.
- Local tests covering state, naming, rate composition, rule evaluation, load/validation and interactions where practical.
- Setup and usage docs: `README.md`, `BLENDER_WORKFLOW.md`, `DEVICE_SCHEMA.md`, `ASSETS.md`, and `TEST_CHECKLIST.md` (or sensible equivalents).
- An implementation checklist tracking each phase with status and notes on any browser/Blender-specific limitation.

## Naming rules

| Blender object / clip | Meaning |
| --- | --- |
| `knob10_1`, `knob10_2`, `knob10_3` | Rotary value controls (may be groups with child meshes, D16), default integers 0–9 for rate digits; state IDs equal the full object names (D2) |
| `knob135_frequency` | Rotary control using a configured -135° to +135° template; state ID `frequency` (suffix, D2) |
| `switch_power`, `switch_diagnose`, `switch_broadcast` | Two-state toggle controls; state IDs `power`, `diagnose`, `broadcast` |
| `button_broadcast` | Momentary button (configurable as action or toggle) |
| `led_power`, `led_broadcast` | State-driven light indicators (D3: `led_<x>` binds to state `x` by default) |
| `canvas_knob10_1` | Transparent text plane bound to `knob10_1` value (D4 step 2) |
| `canvas_rate_main` | Transparent text plane bound to derived signature `rate.main` (D4 step 3) |
| `canvas_power`, `canvas_gv`, `canvas_hotbits` | Additional state-driven display surfaces |
| `broadcastCanvas` or `broadcastCanvas_main` | Dynamic broadcast surface |
| `TOP_DOWN_FULLVIEW_camera` | Blender-authored fixed/default top-down camera |
| `MANUAL_CAM_camera` | Blender-authored initial position for user-controllable orbit camera |
| `POWER_ON_anim`, `POWER_OFF_anim` | One-shot named animation clips |
| `BROADCAST_ON_anim`, `BROADCAST_OFF_anim` | Optional one-shot clips for broadcast start/stop |
| `BROADCAST_ACTIVE_LOOP_anim` | Optional looping animation while broadcasting |

All optional objects and clips produce a clear warning and a graceful fallback when absent. Explicit config bindings take precedence over naming conventions. For multiple devices, scope state lookup to the selected device instance (D19). Blender `.001` duplicate names follow D1.

Support **control templates**, e.g.:

```json
{
  "type": "knob",
  "prefix": "knob10_",
  "axis": "Z",
  "minAngle": -135,
  "maxAngle": 135,
  "minValue": 0,
  "maxValue": 9,
  "step": 1,
  "defaultValue": 0,
  "stateFrom": "objectName",
  "wrap": false,
  "dragPixelsPerStep": 24
}
```

`axis` is in Blender-authored local space (D14). Keep all naming-to-state rules deterministic and tested.

## Configuration format (initial v1)

Define a validated, human-editable schema. The following is a **directional example**; Codex should consolidate it into a coherent `device.schema.json`, TypeScript types, and one canonical example, following D1–D19:

```json
{
  "schemaVersion": "1.0",
  "device": {"id": "classic-radionics", "name": "Classic Radionics", "version": "1.0.0"},
  "model": "device.glb",
  "cameras": {"default": "TOP_DOWN_FULLVIEW_camera", "manual": "MANUAL_CAM_camera", "transitionMs": 450},
  "controlTemplates": [
    {"type": "knob", "prefix": "knob10_", "axis": "Z", "minAngle": -135, "maxAngle": 135, "minValue": 0, "maxValue": 9, "step": 1, "defaultValue": 0, "stateFrom": "objectName"},
    {"type": "switch", "prefix": "switch_", "axis": "X", "offAngle": -25, "onAngle": 25, "durationMs": 200, "stateFrom": "suffix"}
  ],
  "initialState": {"power": false, "diagnose": false, "broadcast": false, "gv": 0},
  "rateGroups": [
    {"id": "main", "members": ["knob10_1", "knob10_2", "knob10_3"], "separator": "-", "output": "rate.main"}
  ],
  "bindings": [
    {"object": "canvas_knob10_1", "target": "text", "source": "knob10_1"},
    {"object": "canvas_rate_main", "target": "text", "source": "rate.main"},
    {"object": "led_power", "target": "led", "source": "power"},
    {"object": "led_broadcast", "target": "led", "when": "power && broadcast"}
  ],
  "canvasDefaults": {"resolution": [512, 256], "background": "transparent", "color": "#ff7040", "fontFamily": "monospace", "fontSize": 140},
  "broadcast": {"rateMode": "snapshot"},
  "broadcastSurfaces": [
    {"object": "broadcastCanvas", "source": "broadcast.main", "resolution": [1024, 1024], "fps": 30, "enabledWhen": "power && broadcast"}
  ],
  "animations": {
    "power": {"on": "POWER_ON_anim", "off": "POWER_OFF_anim"},
    "broadcast": {"on": "BROADCAST_ON_anim", "off": "BROADCAST_OFF_anim", "loop": "BROADCAST_ACTIVE_LOOP_anim"}
  }
}
```

- `broadcast.main` is the signature stream of the broadcast session for rate group `main`, following D8.
- Animation mappings that refer to optional clips must yield a clear warning and a graceful fallback, not an application crash.
- Derive `rate.main` as a **string**, retaining leading zeroes: knob values `5`, `7`, `0` become `"5-7-0"`.
- Support any number of ordered rate groups and state-based display planes.
- Per-object overrides may reside in the JSON and/or Blender custom properties (`extras` in glTF); precedence is defined in D5.
- JSON configuration must be portable; no local absolute paths and no runtime instance IDs (D19).

## Implementation tasks in mandatory order

### Phase 0: Repository audit and baseline

- [ ] Inspect existing layout and detect current Angular applications and deployment workflow.
- [ ] Inspect for existing AetherOne / Radionics Workspace webcam hotbits code (D15) and note findings.
- [ ] Document exact changes planned; protect root and `/ui/`.
- [ ] Establish source/output directories, package scripts and toolchain versions.
- [ ] Ensure the existing project still builds/tests before large changes where feasible.

**Acceptance:** UI3D is isolated, and no unrelated files are overwritten.

### Phase 1: Earliest runnable 3D prototype

- [ ] Create a separate Angular application with a single focused device-view screen.
- [ ] Integrate Three.js rendering with resize handling, high-DPI limits, lighting, shadows where affordable, orbit controls and cleanup on component destroy.
- [ ] Create the **real minimal state store, event bus and pure mapping functions** (D6, D7, D13, D19 instance ID). These are the permanent implementations that Phase 2 extends.
- [ ] Create a **demo device** with three `knob10_*` controls, `switch_power`, `switch_broadcast`, LEDs, `canvas_knob10_*`, `canvas_rate_main`, and `broadcastCanvas`. Make at least one control a group with child meshes to exercise D16.
- [ ] Implement raycast-based selection and interaction per D7 and D16 (vertical drag, clamp, snap, keyboard, nearest-ancestor resolution), clickable switches, distinct camera-orbit gestures, mouse and touch/Pointer Events; prevent accidental camera movement while manipulating controls.
- [ ] Display a compact visible debug state panel (`power`, `broadcast`, three digits, computed signature, rate mode) driven by store events, so behavior can be verified even if a texture is wrong.
- [ ] Provide a clear **Fullscreen** toggle using the Fullscreen API with user activation. Reflect `fullscreenchange`; implement the D11 fallbacks. Do not assume fullscreen can hide the entire mobile browser chrome.

**Acceptance:** Running locally shows a device; rotate the knobs to `5`, `7`, `0`, and the debug state reads `5-7-0`. Power and broadcast switches respond. Fullscreen entry/exit works in a compatible desktop browser. Stop here and fix major breakages before Phase 2.

### Phase 2: Device definition, loader and state engine

- [ ] Define TypeScript interfaces and JSON Schema for devices, templates, bindings and rate groups (D2, D3, D5, D9).
- [ ] Implement GLTFLoader-based `.glb` loading with local Draco/Meshopt decoders and size limits (D12), plus an optional procedural fallback for local demo.
- [ ] **Blender round-trip check (D14)** as soon as the loader works: names, pivots, transforms, cameras, clips, UVs, and the axis-space conversion. Report honestly if Blender is unavailable.
- [ ] Traverse named meshes and cameras, create an object registry (applying D1 duplicate rules and D16 hierarchy rules) and validate required objects.
- [ ] Use object-local rotation relative to captured **initial** transforms (do not reset Blender's authored placement). Respect configured axis (D14) and pivot. Explain how to set origins in Blender.
- [ ] **Extend** the Phase 1 state store and event bus (D13) with immutable definitions, instance scoping (D19) and a small safe declarative condition evaluator (`power && broadcast`, numeric comparisons, parentheses if supported). Never execute arbitrary JS from JSON.
- [ ] Derive ordered rate strings (D9); emit `knob.changed`, `rate.changed`, `power.changed`, `broadcast.started/stopped` events. Avoid cycles and duplicate events.
- [ ] Implement POWER OFF behavior: diagnosis and broadcast deactivate, dependent LEDs and displays update, running loops stop.
- [ ] Implement useful error/warning output when a named mesh, animation or state is missing, and for the ambiguity/duplicate errors defined in D1, D2, D4 and D5.
- [ ] **Local device import (D18):** file picker/drag-and-drop for a `.glb` plus `device.json`, with validation before activation. (May be moved to Phase 6 only if documented in the checklist.)

**Acceptance:** Both an imported compliant GLB and the demo fallback can use the same store and binding system; reload restores predictable defaults; a locally imported pair validates and activates, and an invalid pair reports errors without replacing the active device.

### Phase 3: Canvas and display surfaces

- [ ] Identify `canvas_<source>` meshes (D4) and `broadcastCanvas*` meshes with usable UVs.
- [ ] Implement transparent CanvasTexture text display: centered digits, optional font/size/color/format overrides, stable aspect ratio, alpha, and visually emissive/unlit appearance. Avoid alpha halos and z-fighting.
- [ ] Update numeric text textures **only when their bound state changes**; render animation surfaces at configurable FPS.
- [ ] Draw each knob digit and `rate.main` onto its Blender-authored plane. Preserve the Blender mesh position, scale, rotation and UV layout.
- [ ] Implement animated broadcast graphics with at least one simple built-in pattern, the signature, and the configured start/stop rules. Show `LIVE` or `SNAPSHOT` per D8.
- [ ] Handle optional `canvas_power`, `canvas_gv`, `canvas_hotbits` consistently.
- [ ] Dispose textures and materials correctly when unloading a device.

**Acceptance:** Changing a knob changes both its local numeric plane and the `5-7-0` signature plane; transparent pixels remain invisible. A power-enabled broadcast animates only when requested, and SNAPSHOT versus LIVE behaves as in D8.

### Phase 4: Cameras, animations and LEDs

- [ ] Read exported Blender cameras, including `TOP_DOWN_FULLVIEW_camera` and `MANUAL_CAM_camera`.
- [ ] Default to top-down when available; manual mode starts from Blender camera position, with configurable orbit target, damping, pan and zoom limits. Provide camera buttons and sensible fallback if a named camera is absent.
- [ ] Support named glTF clips through `AnimationMixer`: one-shot ON/OFF, loops, stop, reset and optional reverse/scrub mappings, with the interruption behavior of D17 and per-channel ownership (principle 7).
- [ ] Render LEDs conditionally per D3 (`led_power = power`, `led_broadcast = power && broadcast`) through material emission or a bright unlit appearance; optional tasteful glow, no requirement for expensive bloom on mobile.
- [ ] **Material animation compatibility:** Support simple state-driven emissive transitions natively first. Investigate `KHR_animation_pointer` as an optional enhancement; verify Blender exporter **and** chosen Three.js loader/plugin compatibility against a real sample, and fall back gracefully when unsupported. Never claim that every Blender shader animation survives glTF export.

**Acceptance:** Camera selection works, a powered LED turns on, dependent broadcast LED and animation only run when both conditions are true, optional missing clips do not crash the app, and rapid power/broadcast toggling always settles at the state-derived final pose with no stray loop.

### Phase 5: Hotbits provider and broadcast integration

- [ ] Create a pluggable `HotbitsProvider` interface and provider selection: local webcam first, optional future AetherOnePi REST adapter. Reuse the existing sampling algorithm where practical and document it (D15).
- [ ] Implement webcam permission workflow with `getUserMedia()` only on explicit user action, webcam start/stop, device selection if practical, buffer monitoring and cleanup. Explain HTTPS/localhost permissions and mobile background limitations.
- [ ] Isolate frame sampling/byte extraction from Three.js; support cancellation, bounded queues and readable status/errors.
- [ ] The webcam-derived hotbits technique is experimental and **must not be represented as verified cryptographic randomness**. Clearly separate optional browser `crypto.getRandomValues()` for demo animations from experimental webcam-derived bytes; never quietly substitute one source for another.
- [ ] Make broadcast canvas react to rate, active session and selected byte source. Keep animation running gracefully even if webcam permission is denied, with a clearly labeled demo mode.
- [ ] Expose source status and available buffered bytes to optional canvas displays.

**Acceptance:** Webcam can be started/stopped and released; permission denial is handled; no network backend is necessary; broadcast can run in demo mode without webcam.

### Phase 6: Persistence, import/export, PWA and deployment

- [ ] Persist device states/presets and broadcast snapshots in IndexedDB (prefer a small native wrapper, no heavyweight state framework unless justified), scoped per D10 including the dev-scope hash for local imports.
- [ ] Provide Save Preset, Load Preset, Reset and Export/Import JSON controls. Validate imported JSON and reject oversized/invalid data gracefully.
- [ ] Install and configure `@angular/pwa`; set manifest `id`, `start_url`, `scope` to `/ui3d/`, app icons, standalone display and application-specific branding.
- [ ] Ensure service-worker scope and generated assets are restricted to `/ui3d/`. Verify old `/ui/` and root pages are unaffected, including after an offline install and a subsequent update. Confirm locally imported files (D18) are never cached.
- [ ] Offline cache app shell, sample device, decoders and essential static assets. The first visit requires connectivity; webcam and browser permissions remain independent of caching.
- [ ] Set production base href, deployment output and URL handling. Provide one documented build/deploy command; do not overwrite unrelated files.
- [ ] Make mobile layout usable in portrait and landscape; add minimal accessible labels and keyboard fallback for controls (D7).

**Acceptance:** Built UI3D opens at `/ui3d/`, is installable in supporting browsers, loads previously cached demo offline, and fullscreen toggles on desktop browsers and Android Chrome (D11 fallbacks elsewhere).

### Phase 7: Blender Python add-on and exporter

The first version may be **partial**. Required minimum, in priority order: (1) panel and per-object property editing, (2) paired `.glb` + `.json` export, (3) Validate Device. Everything else is optional and must be listed honestly as unimplemented in the docs.

- [ ] Create an installable add-on compatible with a clearly documented Blender version (an LTS release that is actually installed for testing, if available). Provide sidebar `N` panel named **Radionics Device**.
- [ ] On object selection, inspect name/prefix and edit per-object custom properties: type, state binding, axis (Blender local space, D14), angles, value range, step, display style, rate-group membership, and optional animation mapping.
- [ ] Expose global device metadata, rate groups with explicitly ordered members (ordered scene collection, D9), camera presets, initial states, and important canvas properties.
- [ ] Implement **Validate Device**: duplicate and `.NNN`-suffixed names (D1), duplicate state IDs (D2), invalid prefixes, template ties (D5), controls whose descendants match templates (D16), missing cameras or clips, wrong data types, missing rate members, empty/invalid plane geometry, suspicious UV/pivot setup, ambiguous canvas bindings (D4), `source`/`when` misuse (D3) and malformed expressions.
- [ ] Implement **Export Device**: generate validated `device.json` and `.glb` as a pair in a user-selected folder; enable compatible glTF export settings, include extras, meshes, cameras and animations. Report what was exported. Never write instance IDs or absolute paths.
- [ ] Document what is and is not available in the first version of the add-on, particularly material animation support; if Blender executable is available, test export/import round-trip automatically (reuse D14 script).

**Acceptance:** User can build/name a small Blender device, configure the rate group, export the pair, copy it into the PWA device library (or import it locally via D18) and operate it without changing Angular code.

### Phase 8: Hardening and final review

- [ ] Add unit tests for: name normalization and duplicate detection (D1), state ID resolution (D2), binding validation (D3), canvas source resolution (D4), template matching (D5), value/angle mapping (D6), clamp/wrap/step behavior (D7), stable ordered rate groups (`0-5-7` must retain zero), snapshot versus live (D8), condition evaluation, state transitions, persistence scoping including dev hash (D10), nearest-ancestor raycast resolution and no-rescan (D16), animation interruption and settled final state (D17), local import validation (D18), two-instance isolation (D19) and schema validation.
- [ ] Add integration or browser tests for controls, canvases, camera and fullscreen when the test runner/browser supports them.
- [ ] Test keyboard, mouse and mobile touch interactions; check portrait layout, pixel density and basic GPU/texture memory cleanup.
- [ ] Provide actionable diagnostics in a developer panel (missing object, duplicate names, missing GLB, bad JSON, unavailable camera, unsupported extension, oversized model, import validation errors).
- [ ] Run build, tests and lints, document results and unresolved limitations. Include exact steps for manually testing the prototype.

**Acceptance:** A non-developer can follow `README.md`, run the demo, set the rate `5-7-0`, see the transparent labels and signature, toggle power/broadcast, select camera, enter/exit fullscreen (where supported) and install the PWA.

## Suggested simple module organization

```text
ui3d-src/
  src/app/
    core/
      device-loader.service.ts
      device-import.service.ts   # D18 local .glb + device.json import
      device-state.service.ts
      instance-id.ts             # D19
      rules.service.ts
      rate.service.ts
      naming.ts                  # pure functions: D1, D2, D4, D5, D16
      control-mapping.ts         # pure functions: D6, D7
      event-bus.service.ts
      persistence.service.ts
    three/
      scene-controller.ts
      camera-controller.ts
      interaction-controller.ts
      animation-controller.ts    # D17 interruption + channel ownership
      canvas-surface-controller.ts
      led-controller.ts
    radionics/
      hotbits-provider.ts
      webcam-hotbits.service.ts
      broadcast.service.ts
    pages/
      device-workspace.component.ts
    models/
      device.types.ts
    assets/devices/classic-demo/
      device.json
      device.glb  # if successfully generated
tools/
  blender-roundtrip.py           # D14, headless Blender
blender-addon/
  radionics_device/
    __init__.py
    properties.py
    operators.py
    validation.py
    export.py
  sample_device.py
ui3d/  # published build, never hand-edit
```

Adapt names to the actual Angular workspace. Prefer testable pure functions for mappings, parsers and signature derivation. Use one scene animation loop with explicit lifecycle management; do not create independent permanent render loops per display.

## Exact demonstration scenario

1. Open locally with the documented command and load the demo device.
2. Switch to `TOP_DOWN_FULLVIEW_camera`; then select `MANUAL_CAM_camera` and rotate the viewpoint.
3. Turn three `knob10_*` objects to **5, 7, 0** (vertical drag or keyboard). Drag on a child mesh of a grouped knob and confirm the whole control turns around its pivot.
4. Confirm `canvas_knob10_1` shows `5`, `canvas_knob10_2` shows `7`, `canvas_knob10_3` shows `0`, and `canvas_rate_main` shows **`5-7-0`**.
5. Power ON: `led_power` lights; broadcast still OFF.
6. Start broadcast: `led_broadcast` lights and the textured `broadcastCanvas` animates with the signature, labeled `SNAPSHOT` by default. Turn a knob mid-broadcast and confirm the running signature stays frozen; switch to LIVE (with broadcast stopped), repeat, and confirm it follows.
7. Power OFF: broadcast stops, LEDs go dark, and no stale animation continues. Toggle power rapidly ten times and confirm the final visual state matches the final state.
8. Enter and leave fullscreen (desktop/Android Chrome) or the maximized-view fallback; check resize/aspect ratio.
9. Save and reload a preset; confirm correct values and no corrupted config. Change the device version and confirm the old preset is not applied (D10).
10. Start the webcam provider after granting permission, then stop it and verify the camera releases. Verify the denied-permission path too.
11. Make a production PWA build; verify `/ui3d/` works without changing `/ui/` or root content.
12. Export a compatible Blender model/config pair, then import it via the local import option (D18), and verify the same conventions work. Try a pair with a duplicate `.001` name and confirm a clear error and that the previous device stays active.
13. Load the same device twice (two instances) and confirm that changing knobs on one does not affect the other (D19).

## Code quality and UX rules

- Keep methods short, expressive and easy to debug; no enormous all-purpose `DeviceService`.
- TypeScript `strict` enabled; minimize `any`; no magic object-name string literals scattered across components (centralize in `naming.ts` and constants).
- Respect browser API feature detection and user gestures for fullscreen/camera.
- Make start/stop states explicit. Provide small in-app feedback for permission failures, invalid config and missing assets.
- No external trackers, accounts or automatic uploads of webcam data or imported device files. Store locally unless the user explicitly configures a network provider.
- For transparent digit displays use correct UV mapping, alpha blending, depth handling and only redraw on value changes. Place labels fully under the user's Blender layout control.
- Add limits to canvas resolution, frame rate, pixel ratio, model size and concurrent device count as necessary for smartphones.
- Use accessible HTML controls for key actions even though the device is 3D.
- Keep visuals sober, realistic and functional; avoid kitsch, fantasy embellishments, unnecessary animation and noisy UI.

## Definition of done and expected Codex final report

Do not finish with only a proposal. Produce the files, implement the working prototype, run feasible checks and provide:

1. The created/changed paths and how they fit the existing repository.
2. Exact local run, test and production build commands, and the chosen toolchain versions.
3. Where to place a new Blender `.glb` and `device.json`, and how to use local import (D18).
4. How to test the `5-7-0` demonstration, cameras, transparent displays, broadcast (SNAPSHOT/LIVE), webcam, fullscreen and PWA.
5. Which phases are complete, which are partial, which remain unimplemented, and which operations could not be verified locally (explicitly including the Blender round-trip, D14, if Blender was unavailable).
6. Any browser/Blender exporter constraints encountered, especially material animations, axis conversion, iOS fullscreen limits and service-worker behavior.
7. What was found about existing hotbits implementations (D15).

**Implementation priority:** finish Phases 0–4 as a solid immediately testable 3D prototype before expanding into the later phases. Continue through the remaining phases as far as the environment and available execution time permit, without sacrificing readability or falsely marking tasks done. The Blender add-on may remain partial as described in Phase 7.

## Authoritative technical references

- Angular service workers and PWA setup: https://angular.dev/ecosystem/service-workers/getting-started
- Three.js GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- Three.js AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
- Blender glTF 2.0 export: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html

Verify exact version-specific options and extension support against the toolchain actually installed. Blender material/light/camera animation export using `KHR_animation_pointer` can be experimental and may require additional runtime support; basic LED emission controlled by the state engine is the reliable baseline.

## Additional Design Clarifications for V4

**Hierarchical object discovery:** Traverse the complete scene graph. Once an interactive control is registered, do not apply additional control-prefix detection within its descendants. Still discover nested LEDs, displays, and explicitly configured elements. Resolve pointer hits to the nearest registered interactive ancestor.

**Coordinate systems:** Preserve the imported glTF node hierarchy and its transforms. Interpret configured rotation axes relative to the intended control's authored local coordinate system. Do not apply a global axis conversion blindly. Verify the actual transformations using Blender-exported fixtures.

**Animation transitions:** Use crossfades only where animation tracks are compatible. Otherwise transition from the current visual value or apply the correct state-derived target pose. The final state always takes precedence.

**Value mapping validation:** Require finite numeric values, positive step, unequal range boundaries, and a step count compatible with the configured value range. Reject invalid configurations during validation.

**Action semantics:** Distinguish persistent states from momentary actions. Buttons may dispatch named actions such as `broadcast.start`, `broadcast.stop`, or `broadcast.toggle`. Switches represent persistent states. Actions must respect device rules, including power dependencies.

**State persistence:** Presets describe reusable device settings. Loading a preset changes only the explicitly targeted runtime instance, even when several instances share the same device definition.

**Transactional imports:** Parse and validate imported files in an isolated staging context. Construct the new device instance and its resources before replacing the active instance. On failure, dispose staging resources and preserve the existing device and its state.

**Missing bindings:** Explicit references to nonexistent states, rate groups, or objects are validation errors. Optional convention-discovered objects may generate warnings and remain inactive.

**Mechanical controls:** Define whether controls remain adjustable while power is off. Default to allowing knob adjustments and preserving their values, while disabling powered functions such as diagnosis and broadcasting.

**Early rate derivation:** Implement the permanent minimal signature derivation in Phase 1 alongside the state store. Phase 2 must generalize it to arbitrary configured rate groups without introducing a second implementation.