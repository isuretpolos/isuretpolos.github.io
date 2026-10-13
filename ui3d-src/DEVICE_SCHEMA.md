# Device schema and runtime conventions

Canonical definition: `public/devices/classic-demo/device.json`.
Machine schema: `device.schema.json` (JSON Schema draft-07, Ajv validation).
Definitions are cloned on load; mutable values, snapshots and instance IDs live
in `DeviceState`, never in model extras or device JSON.

## Decisions D1–D19

| Decision | Implemented contract |
| --- | --- |
| D1 | Case-sensitive names; spaces warn. A sole `.NNN` suffix normalizes with a warning. Exact duplicates or normalized collisions block activation and name both objects. Raw glTF names are restored before validation because GLTFLoader otherwise sanitizes them. Blender validator always rejects suffixed names. |
| D2 | Full normalized object name is the default state ID. `stateFrom: "suffix"` removes the selected template prefix. `stateId` overrides both. Duplicate control state IDs block activation. |
| D3 | Binding `source` is a state key, `when` is a condition. Text requires source; LED/visibility require source or when. Expressions in source are rejected with guidance to when. Unconfigured `led_x` binds to boolean state x. Extra color/fontSize are supported rendering options. |
| D4 | Explicit JSON binding, then `userData.binding`, then exact canvas remainder state, then one namespace separator replaced with dot. Exact/derived ambiguity is an error. Namespaces come from this device's derived keys. Unbound convention planes warn. `broadcastCanvas*` uses the session surface path. |
| D5 | Longest prefix wins; equal ties fail. JSON `objects[name]` > glTF `extras.radionics` > template > engine defaults. |
| D6 | Linear value/angle mapping with clamp and step snapping. Finite bounds, positive step, unequal angle bounds, increasing values and integral step count required. |
| D7 | Upward vertical drag increases values, default 24 CSS pixels/step. Clamp by default; wrap only on interaction paths. State-derived easing settles within 120 ms. Arrows and Home/End operate selected knobs. Controls disable orbit during pointer capture. Switches toggle; momentary buttons emit press/release actions. |
| D8 | SNAPSHOT is default. Start freezes all rate groups. LIVE follows derived rates. Mode changes only while stopped. Session planes show mode, signature and snapshot mismatch. Presets include mode/snapshot. |
| D9 | Ordered `members` alone determines rate order. `separator` produces a string, retaining zero (`0-5-7`). Group output is exactly `rate.<id>`. |
| D10 | Preset scope includes library/dev marker, device ID, device version and schemaVersion. Local imports additionally include SHA-256 of exact JSON bytes. Mismatches reject with Reset guidance. Preset libraries omit runtime instance ID. |
| D11 | Native fullscreen with feature detection, fullscreenchange and resize. Unsupported/denied requests use a maximized CSS view and Add to Home Screen guidance. iOS arbitrary-element fullscreen is not promised. |
| D12 | GLB-only; 20 MB default warning and 100 MB ceiling. Local Draco and bundled Meshopt enabled. KTX2 is explicitly rejected; unsupported required extensions give diagnostics. |
| D13 | One permanent state store/event bus/rate derivation, shared by procedural and loaded GLB devices. Renderer reads settled state. |
| D14 | Genuine Blender 5.2.1 fixture and repeatable headless check. Standard exporter axis conversion is applied only to recognized Blender exports; see Blender workflow. |
| D15 | Webcam frame-sum comparison adapted from inspected MIT AetherOnePy code; exact adaptation below. No cryptographic quality claim. |
| D16 | A control can be a group. Descendants are not rescanned for control templates, but nested displays/LEDs and explicitly typed JSON elements are discovered. Pointer hits resolve to the nearest registered ancestor. Root quaternion alone changes; authored child transforms remain intact. |
| D17 | Latest state chooses clips. Previous actions fade for 120 ms and stop; current on/off clips clamp at their settled endpoint. Loop exits on stop/power off. Control rotation tracks and cross-state channel ownership conflicts warn and skip conflicting clips. |
| D18 | File picker/drop pair imports with syntax/schema/size/name/binding/loader checks before replacement. Runtime resources are constructed before the old device is disposed. Buffers stay in memory; no imported URLs enter SW cache. |
| D19 | Unique runtime counter IDs. Each instance owns its store, registry, canvas textures, scene/mixer and sessions; bus subscriptions filter by ID. Two loaded copies share version-scoped presets but applying a preset only changes its targeted instance. |

## Controls, bindings and rules

```json
{"type": "knob", "prefix": "knob10_", "axis": "Z", "minAngle": -135,
 "maxAngle": 135, "minValue": 0, "maxValue": 9, "step": 1,
 "stateFrom": "objectName", "dragPixelsPerStep": 24, "wrap": false}
```

`knob10_` uses full names; shipped `switch_`, `button_` and `knob135_` templates
use suffix states. `objects` overrides use the same property names. Imported
Blender extras are `radionics: {type, stateId, axis, ...}` and
`binding: {target, source, when, ...}`. JSON binding wins over extras.

Conditions support identifiers, booleans, decimal numbers, `!`, parentheses,
`&&`, `||`, `==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=`. There are no strings,
function calls, assignments or JavaScript evaluation. Unknown identifiers and
malformed tokens fail. Equality is strict, including the `==` spelling.
Limit: 2048 characters and 64 nesting levels. Engine policy forces broadcast and
diagnosis off with power off; knobs remain adjustable. Arbitrary configurable
state-transition rule graphs are not implemented.

Button actions: `broadcast.start/stop/toggle`, `diagnose.start/stop/toggle`,
`power.start/stop/toggle`. Momentary actions dispatch press/release instead of
persisting a held button as a switch state. `mode: "toggle"` persists a boolean.

Text canvases support resolution, color, font family/size defaults and binding
color/fontSize. Fonts use browser system monospace. Alpha is transparent,
depth writes disabled, UVs and mesh transforms preserved. Text textures redraw
only on effective text/gating changes. The canvas aspect is derived from UV
edges; broadcast textures draw at their configured FPS on one scene loop.
No arbitrary display formatter expressions are supported.

## Experimental webcam algorithm

Inspected `AetherOnePy/py/services/captureRandomnessFromWebCam.py` and its MIT
license in the sibling checkout. For each corresponding pixel in consecutive
64×64 RGB frames, emit 1 if the previous RGB sum exceeds the current sum, else
0. Reject pairs with total absolute RGB difference <=500 or first nine emitted
bits all zero. Ignore alpha. Pack eight bits most-significant-first into bytes.
No whitening, no uniqueness filtering. Sample at most 10 pairs/second; queue
bounded to 4096 bytes. Skip sampling while document is hidden. Stop releases
every media track; a generation token cancels a pending permission result.

The original uses camera-native frame size and groups into unique 32-bit
integers. The browser adaptation therefore does **not** claim output equivalence.
Demo graphics explicitly use `crypto.getRandomValues`; webcam starvation returns
zero to the pattern and does not substitute crypto. The provider interface
allows future replacements; no REST adapter or camera selector is shipped.

## Animation limits

Named transform clips use AnimationMixer. ON/OFF clips clamp to their final
pose; looping clips start after an ON transition completes. Rapid reversals
crossfade the previous action and ultimately settle the latest state. The engine
owns control rotations, LEDs and binding visibility; clips cannot own those
same channels. Author compatible ON/OFF tracks and keep state channels separate.
Reverse/scrub mappings, arbitrary animation blend graphs and
`KHR_animation_pointer` plugins are not implemented. Basic emissive LED updates
are reliable; arbitrary Blender shader animations are not promised.
