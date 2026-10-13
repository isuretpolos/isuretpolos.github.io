# Radionics UI3D: Device Developer Guide

Build interactive 3D radionics instruments in **Blender**, export them as **glTF 2.0 (`.glb`)**, and load them into the standalone **Angular + Three.js PWA** at `https://isuretpolos.github.io/ui3d/`.

This guide describes the **target device contract defined in the UI3D v2 implementation brief**. The application and Blender add-on may still be under development. A convention described here is not proof that the current build supports it; consult the implementation checklist and test your exported device. No backend or paid service is required for the intended basic workflow.

## 1. Mental model

A device consists of two files:

```text
my-device/
├── device.glb       # Blender model, named objects, UVs, cameras, animation clips
└── device.json      # Device identity, templates, behavior, bindings, rate groups
```

**Blender determines where components are and how they look.** `device.json` determines how controls behave and how values flow between them. The UI3D engine supplies interaction, device state, display textures, camera controls, animations and broadcasting.

Each loaded device has its own state. Changing a knob updates the state, which can update displays, signature groups and broadcast graphics. Editing the model should ordinarily require no new Angular code when you use supported component types.

## 2. Fastest path to a test device

1. Create a Blender model with a body and three separate rotating knobs named `knob10_1`, `knob10_2`, `knob10_3`.
2. Make the knob origins/pivots coincide with their intended axes of rotation. Keep any rotating decorations as children of the corresponding control root.
3. Add two switch objects: `switch_power`, `switch_broadcast`.
4. Add LED objects: `led_power`, `led_broadcast`.
5. Add four UV-mapped planes: `canvas_knob10_1`, `canvas_knob10_2`, `canvas_knob10_3`, `canvas_rate_main`.
6. Add another UV-mapped plane named `broadcastCanvas` for the animated broadcast graphic.
7. Optionally add Blender cameras `TOP_DOWN_FULLVIEW_camera` and `MANUAL_CAM_camera`.
8. Save the `.blend` source; export a `.glb` with meshes, cameras, and any supported named animations. Use glTF extras if using custom properties.
9. Create `device.json` from the example below. Keep the `.glb` and JSON together.
10. Open them with the application's local device import feature when available, or install them in the device library used by the current build. Test knobs, displays, LEDs and broadcast before publishing.

Expected test: set the knobs to **5**, **7**, **0**. Their individual displays must show those digits, and `canvas_rate_main` must show **`5-7-0`**.

## 3. Blender scene and naming conventions

Names are **case-sensitive**. Do not use spaces. Give every interactive root a unique name. Blender's auto-generated suffixes such as `.001` are a warning sign: rename duplicates deliberately. The v2 specification describes normalization of such suffixes; however, relying on that can create collisions. For portable devices, use unambiguous original names.

| Name in Blender | Meaning |
| --- | --- |
| `knob10_1` ... `knob10_9` | Individual 0–9 rate-digit knobs using the `knob10_` template |
| `knob135_frequency` | Example rotary control with the `knob135_` template |
| `switch_power` | Toggle controlling state `power` |
| `switch_diagnose` | Toggle controlling state `diagnose` |
| `switch_broadcast` | Toggle controlling state `broadcast` |
| `button_broadcast` | Push button; its action/mode must be configured as necessary |
| `led_power` | LED tied by convention to `power` |
| `led_broadcast` | LED; explicitly bind it to `power && broadcast` |
| `canvas_knob10_1` | Transparent value display for `knob10_1` |
| `canvas_rate_main` | Transparent display of the derived `rate.main` signature |
| `canvas_power`, `canvas_gv`, `canvas_hotbits` | Optional displays for corresponding state/derived values |
| `broadcastCanvas` | Main animated broadcast surface |
| `broadcastCanvas_secondary` | Additional broadcast surface, if configured |
| `TOP_DOWN_FULLVIEW_camera` | Fixed or default camera |
| `MANUAL_CAM_camera` | Starting viewpoint for user-controlled orbit camera |
| `POWER_ON_anim`, `POWER_OFF_anim` | Optional named one-shot animation clips |
| `BROADCAST_ON_anim`, `BROADCAST_OFF_anim` | Optional broadcast transition clips |
| `BROADCAST_ACTIVE_LOOP_anim` | Optional broadcast animation loop |

The configured **longest matching prefix** wins (for example, `knob135_` before a shorter `knob_`). Avoid overlapping prefixes unless intentional.

### Control geometry and pivots

- Make each interactive control a distinct root object or parent group. Raycasting should select the control when a child mesh is touched. Check this in your installed engine version.
- Set the origin of a knob or switch at its mechanical rotation axis. Axis settings refer to the **local object axis**.
- Keep the control's Blender-authored default orientation. The engine applies rotation *relative to that original transform*.
- A knob's configured minimum and maximum angles are relative control positions, not absolute world rotations.
- For a plane, make usable UVs (typically filling the 0–1 UV square). The engine renders into its existing geometry; correct aspect ratio and UV orientation are your responsibility.
- Avoid overlapping coplanar surfaces; z-fighting can obscure text. Put the display surface very slightly above the housing.
- Keep geometry and texture sizes modest for phones. A starting budget is a few hundred thousand triangles or less, compressed textures when supported, and a total GLB substantially below the default 20 MB warning threshold. The v2 loader design warns above 20 MB and refuses files above 100 MB by default.

## 4. Knob templates and value mapping

A template associates a name prefix with shared interaction settings:

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

A `knob10_1` then exposes the **state key `knob10_1`**, not just `1`. With 0–9 over a 270° range, each step rotates 30°.

By default, dragging **up** increments a knob, dragging **down** decrements it; values snap to steps and clamp to the configured range. Mouse/touch interactions must not accidentally orbit the camera while operating a control. Keyboard alternatives are Arrow keys and Home/End when a control is focused. `wrap: true` is optional if a knob should wrap from its maximum to minimum.

For a different family, e.g. `knob135_frequency`, use `stateFrom: "suffix"` to produce state `frequency`. `stateId` in an individual object override can explicitly override the derived ID. Never make two controls resolve to the same state ID.

## 5. Sample `device.json`

Use this as a starting point. It follows the v2 configuration example; the final runtime schema is defined by the implementation's `device.schema.json`.

```json
{
  "schemaVersion": "1.0",
  "device": {
    "id": "my-classic-device",
    "name": "My Classic Radionics Device",
    "version": "1.0.0"
  },
  "model": "device.glb",
  "cameras": {
    "default": "TOP_DOWN_FULLVIEW_camera",
    "manual": "MANUAL_CAM_camera",
    "transitionMs": 450
  },
  "controlTemplates": [
    {
      "type": "knob", "prefix": "knob10_", "axis": "Z",
      "minAngle": -135, "maxAngle": 135,
      "minValue": 0, "maxValue": 9, "step": 1,
      "defaultValue": 0, "stateFrom": "objectName",
      "wrap": false, "dragPixelsPerStep": 24
    },
    {
      "type": "switch", "prefix": "switch_", "axis": "X",
      "offAngle": -25, "onAngle": 25,
      "durationMs": 200, "stateFrom": "suffix"
    }
  ],
  "initialState": {
    "power": false,
    "diagnose": false,
    "broadcast": false,
    "gv": 0
  },
  "rateGroups": [
    {
      "id": "main",
      "members": ["knob10_1", "knob10_2", "knob10_3"],
      "separator": "-",
      "output": "rate.main"
    }
  ],
  "bindings": [
    { "object": "canvas_knob10_1", "target": "text", "source": "knob10_1" },
    { "object": "canvas_knob10_2", "target": "text", "source": "knob10_2" },
    { "object": "canvas_knob10_3", "target": "text", "source": "knob10_3" },
    { "object": "canvas_rate_main", "target": "text", "source": "rate.main" },
    { "object": "led_power", "target": "led", "source": "power" },
    { "object": "led_broadcast", "target": "led", "when": "power && broadcast" }
  ],
  "canvasDefaults": {
    "resolution": [512, 256],
    "background": "transparent",
    "color": "#ff7040",
    "fontFamily": "monospace",
    "fontSize": 140
  },
  "broadcast": { "rateMode": "snapshot" },
  "broadcastSurfaces": [
    {
      "object": "broadcastCanvas",
      "source": "broadcast.main",
      "resolution": [1024, 1024],
      "fps": 30,
      "enabledWhen": "power && broadcast"
    }
  ],
  "animations": {
    "power": { "on": "POWER_ON_anim", "off": "POWER_OFF_anim" },
    "broadcast": {
      "on": "BROADCAST_ON_anim",
      "off": "BROADCAST_OFF_anim",
      "loop": "BROADCAST_ACTIVE_LOOP_anim"
    }
  }
}
```

The animation clips in this example are **optional**; if you have not made them yet, remove the animation mappings or expect warnings. The same applies to optional cameras and display meshes. Do not include nonexistent objects in explicit bindings when testing validation.

## 6. Rate groups and derived signatures

Rate groups are declared explicitly. The member order in the JSON array is the display order. Blender object ordering does **not** determine signature order.

For `knob10_1 = 5`, `knob10_2 = 7`, and `knob10_3 = 0`:

```text
rate.main = "5-7-0"
```

The output is a **string**, so leading zeros survive: `0-5-7`. You can define multiple groups, for instance `main`, `witness`, and `treatment`, with separate members and outputs.

A group can feed transparent text displays and broadcast graphics. Under the intended broadcast modes:

- **SNAPSHOT** (default): captures the signature when broadcasting begins; changing a knob does not change the active broadcast signature.
- **LIVE**: uses the current rate values as they change.

The mode can be switched only when broadcasting is stopped. `broadcast.main` is the active session's signature stream for `main`.

## 7. Canvas planes: numeric displays and broadcast surfaces

### Numeric/state canvas

Place a **UV-mapped Plane** exactly where you want a number or label to appear. Name it `canvas_<source>`:

```text
canvas_knob10_1  →  5
canvas_knob10_2  →  7
canvas_knob10_3  →  0
canvas_rate_main →  5-7-0
canvas_power     →  false / true (formatting can be configured)
```

The intended engine generates a transparent CanvasTexture and applies it to the Blender mesh **without moving or replacing that mesh**. Only the rendered text is visible, using an unlit or emissive-looking material. A text texture is updated when the bound value changes, not on every rendering frame.

Automatic source resolution is deterministic:

1. Explicit JSON binding, then glTF custom-property binding.
2. Exact known state name after `canvas_`.
3. A known derived namespace such as `rate_main` maps to `rate.main` (replace the first separating underscore).
4. Otherwise leave the surface blank and report a warning. Ambiguous sources require an explicit binding.

Configure colors, fonts, formatting and dimensions through supported canvas defaults or overrides in the application's actual schema. Fonts must be locally available or bundled with the PWA. Transparency and luminous appearance do not automatically create surrounding light; bloom is a separate optional effect.

### Animated broadcast canvas

Name a Plane `broadcastCanvas` (or `broadcastCanvas_<id>` if configured). It receives a continuously updated texture showing the current broadcast graphic and signature. Leave enough UV space and physical surface area for the chosen aspect ratio. The intended runtime updates broadcast surfaces at a configurable rate, e.g. 30 FPS, only when appropriate.

A canvas plane is not inherently interactive. If touch interaction is supported by the installed engine, pointer coordinates must be mapped from the mesh UVs to texture coordinates.

## 8. LEDs, switches and state conditions

`switch_power` produces state `power`; `switch_broadcast` produces `broadcast`. The standard power-off rule stops broadcasting and switches dependent states off.

`led_power` can automatically follow `power`. For `led_broadcast`, configure an explicit condition:

```json
{ "object": "led_broadcast", "target": "led", "when": "power && broadcast" }
```

Use `source` for a **state key**, such as `"knob10_1"` or `"power"`. Use `when` for **boolean expressions**, such as `"power && broadcast"`. Do not put expressions in `source`.

The PWA's rule evaluator is intentionally limited and safe; it does not execute JavaScript embedded in device JSON or glTF extras. For a new behavior beyond the supported rules and controls, the engine may need a documented extension.

## 9. Cameras and animation clips

Create and name Blender cameras:

- `TOP_DOWN_FULLVIEW_camera`: recommended opening view.
- `MANUAL_CAM_camera`: camera whose position initializes the free/orbit view.

Export cameras with the `.glb`. The application should offer camera switching and fullscreen/maximized display where the browser permits it. Set a useful orbit target and distance limits in the supported configuration when needed.

For named animations, create and export separate Blender Actions/NLA clips (verify the exported clip names in the actual GLB):

```text
POWER_ON_anim
POWER_OFF_anim
BROADCAST_ON_anim
BROADCAST_OFF_anim
BROADCAST_ACTIVE_LOOP_anim
```

These can operate parts of the 3D model. The engine plays them when corresponding state transitions occur; the ACTIVE_LOOP clip repeats while broadcasting. A missing optional clip should produce a warning and leave core operation working.

**Material animation caveat:** standard glTF transform animations are broadly supported. Blender's material, camera and light animations may require `KHR_animation_pointer` and runtime support, which must be verified for the exact exporter/loader versions. For a reliable first device, use engine-driven LED emission rather than requiring exported animated shader nodes.

## 10. Blender add-on workflow (when implemented)

The planned **Radionics Device** panel appears in Blender's `N` sidebar. It should allow you to:

1. Select an object and edit its control type, state ID, local axis, angles, range, step and display behavior.
2. Edit device identity, initial states, rate-group membership and **member order**.
3. Assign camera presets, named animation clips and canvas bindings.
4. Run **Validate Device** to detect collisions, missing objects, invalid bindings, missing clips, suspicious pivots and broken UV surfaces.
5. Run **Export Device** to generate `device.glb` and `device.json` in one chosen folder.

The v2 brief permits an initial **partial** add-on. Until its export and validation functions exist, manually export Blender glTF and maintain the JSON next to it. Do not assume every optional field described here appears in the first add-on release.

## 11. Loading, offline use and deployment

The UI3D application is an independent PWA served under **`/ui3d/`**. It must not replace the root site or the existing `/ui/` application.

For local testing, use the run/build commands in the **UI3D application README**; their final paths depend on the actual repository structure. The device developer normally only needs a `.glb`, matching JSON, and a way to select or register the pair.

For a bundled/public device, put the pair into the location used by the UI3D device library (the implementation brief suggests an `assets/devices/<device-name>/` folder in the Angular project) and register it if the current library requires registration. Rebuild UI3D, with base href `/ui3d/`; do not manually edit published output in `/ui3d/`.

When supported, the **local import** feature lets you test the pair without deploying. A bundled sample device can be cached for offline use after the first successful load. A locally selected file is not automatically part of that offline bundle. Use only assets you own or are licensed to redistribute.

## 12. Verify your device

Use the application debug panel and this checklist. A missing optional animation is not the same as a broken essential binding.

- [ ] Model and JSON load without a schema error; no duplicate control/state IDs.
- [ ] Model orientation, pivots, scales and display UVs match Blender.
- [ ] `knob10_1`, `knob10_2`, `knob10_3` operate with mouse and touch, without orbiting the camera during a drag.
- [ ] Set 5–7–0; individual canvases show `5`, `7`, `0`, and the group shows `5-7-0`.
- [ ] `0-5-7` keeps the leading zero.
- [ ] `switch_power` turns on `led_power`; `led_broadcast` only lights when power **and** broadcast are active.
- [ ] Powering off stops broadcast and any active broadcast animation.
- [ ] SNAPSHOT freezes the signature; LIVE updates it after a knob change.
- [ ] Broadcast canvas becomes animated in a valid broadcast state.
- [ ] Both named cameras work if supplied; manual camera orbit is usable.
- [ ] Named clips play if supplied; missing optional clips degrade gracefully.
- [ ] Fullscreen works on a supported desktop browser/Android Chrome; mobile browsers without arbitrary-element fullscreen use the maximized view/PWA fallback.
- [ ] Webcam use is opt-in and stops cleanly; the device still works in demo mode without camera access.
- [ ] Save/load preset works for an unchanged device version once persistence is implemented.
- [ ] Test in a production build under `/ui3d/`, not only the local development server.

## 13. Common troubleshooting

| Problem | Check |
| --- | --- |
| Knob does not respond | Exact name, matching template, distinct root, raycastable geometry, active controller |
| Knob rotates strangely | Blender object origin, local axis, parent transforms, initial rotation |
| Wrong value or direction | `minAngle`/`maxAngle`, value bounds, step, local axis, drag settings |
| `canvas_knob10_1` is blank | State-ID resolution, binding, UVs, alpha, correct plane name |
| Text is stretched or mirrored | Plane aspect ratio and UV layout/orientation |
| Signature shows wrong order | Ordered `rateGroups[].members`; do not rely on Blender object order |
| LED does not respond | State name and `source`/`when` expression, POWER state |
| Animation cannot be found | GLB clip names after export, Actions/NLA export settings |
| Broadcast appears frozen | Power/broadcast state, surface binding, SNAPSHOT vs LIVE, animation FPS |
| Camera missing | Export cameras and check spelling/case |
| Imported model fails | Validate JSON and size, glTF extensions, locally bundled decoder support |
| Works locally but not on Pages | Base href, relative asset URLs, `/ui3d/` output, service-worker cache version |

## 14. Compatibility, safety and versioning

- Treat `device.json` as data, not executable code. Arbitrary external scripts are not supported by this configuration contract.
- Keep `device.id`, `device.version` and `schemaVersion` accurate. The planned IndexedDB persistence is scoped by these fields; incompatible presets are not silently reapplied.
- Do not hardcode absolute filesystem paths or external CDN assets in a shareable device package.
- Webcam-derived **hotbits are experimental** and should not be described as verified cryptographic random numbers. Camera data stays local unless an explicitly configured provider transmits it.
- Do not rely on every Blender shader node or animated material surviving glTF export. Always test the exported artifact in the target browser.
- For multiple device instances, each runtime instance needs a unique identifier so states and broadcast bindings cannot accidentally cross devices.

## 15. Source documents and developer references

The authoritative implementation contract is **`CODEX_UI3D_IMPLEMENTATION_PLAN_v2.md`**, particularly decisions **D1–D12** and the final generated **`device.schema.json`** once available. If a running build disagrees with this guide, check the actual schema and implementation checklist before distributing the device.

- [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [Blender glTF export manual](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)

---

**Minimum deliverable from a device author:** `device.glb`, `device.json`, the editable `.blend` source for future maintenance, and a successful demonstration of the `5-7-0` rate and broadcast behavior.
