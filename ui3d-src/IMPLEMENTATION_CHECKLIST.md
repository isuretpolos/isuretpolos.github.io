# Implementation status

Implemented on 2026-10-13. This is a working first prototype; advanced optional
features and real-device verification are not marked complete.

| Phase | Status | Evidence and remaining work |
| --- | --- | --- |
| 0 Audit | Complete | Existing Angular UI development build passed; root/build layout and release script inspected; MIT AetherOnePy sampler inspected. Isolated workspace/output. |
| 1 Prototype | Complete | Three.js renderer, permanent store/events/rates, real and procedural demos, grouped controls, pointer/keyboard/HTML interaction, resize/fullscreen fallback and debug state. Browser verified rate, cameras and LEDs. |
| 2 Definitions/loader | Complete for v1 conventions | JSON Schema + semantic registry validation, safe condition parser, Draco/Meshopt, transactional local import, explicit actions and power policy, real Blender round-trip. Arbitrary configurable transition-rule graphs are deferred. |
| 3 Surfaces | Complete for built-in renderer | UV-preserving transparent text, state-change redraws, broadcast FPS/mode/signature/difference indicator, resource disposal. Rich formatting/custom pattern plugins are deferred. |
| 4 Cameras/animation/LEDs | Core complete; advanced partial | Exported camera selection with fit/aspect, state LED emission, ON/OFF/loop clips, 120 ms interruption retirement, rotation/material/visibility channel ownership. Rapid transitions tested. Reverse/scrub and KHR_animation_pointer support are unimplemented. |
| 5 Hotbits | Core complete; hardware verification partial | Provider interface, explicit camera request, frame comparison, bounded queue and cancellation/release; permission denial and late grant mocked in tests. Actual camera permission/frames and mobile lifecycle not tested. REST adapter/device selector deferred. |
| 6 Persistence/PWA | Core implemented; hosting/mobile verification partial | Native IndexedDB, scoped presets/snapshots, preset JSON import/export/reset, two independent instances, scoped generated worker/manifest/cache, production output. Server-stopped reload and demo operation passed in local Chromium. Native install/update/mobile checks remain manual. Root-scoped old-worker caveat documented. |
| 7 Blender add-on | Partial but functional | Sidebar, object extras editor, metadata/cameras/initial state, ordered groups with move controls, Validate Device and paired export. Real headless registration/edit/validate/export tests passed. No complete parser/schema parity, sophisticated UV/pivot diagnostics, animation-mapping editor or member removal UI. |
| 8 Hardening | Partial | Unit suite, strict type check, Angular development/production builds, real Blender runtime/round-trip, add-on smoke test and browser checks. No dedicated browser regression suite, physical mobile/GPU benchmark, deployed update test or ESLint configuration. |

## Verification limits

- Browser checks use the local Codex in-app Chromium browser. They do not certify
  Android Chrome, iOS Safari or installed standalone display behavior.
- The Blender check verifies world transforms, origins, cameras, clips and UVs
  for the bundled standard-exporter fixture. Custom exporter variants need their
  own fixture; generator detection is intentionally narrow.
- Draco/Meshopt wiring and local decoder presence are verified; a compressed
  model round-trip fixture has not been tested. KTX2 remains explicitly unsupported.
- Property channels are owned by state or clips. Arbitrary shader animation and
  generic animation-pointer plugins remain unimplemented.
- One preset slot per device/version/import scope is provided. A named preset
  collection, automatic state restoration and a multi-entry catalog are deferred.
- Imported files never use network URLs or service-worker data caches. Export
  download URLs are revoked; imported GLBs are parsed directly from buffers and
  need no object URLs.
- Root release metadata and its mandatory `UI/public` mirror changed via the
  release script; existing application source and root published assets did not.
