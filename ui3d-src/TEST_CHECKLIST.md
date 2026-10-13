# Prototype verification

## Automated checks

```powershell
npm test
npm run check
npm run deploy
npm run verify:build
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python tools\blender-roundtrip.py -- tools\roundtrip-output
npm run roundtrip
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python tools\test-addon.py
```

Results: all **40** engine/runtime and webcam-lifecycle tests pass; strict TypeScript and
Angular development/production builds pass. Genuine Blender 5.2.1 round-trip and
add-on export smoke tests pass. Generated cache/manifest URL isolation passes.
No lint configuration is installed; `check` is a type check, not a lint claim.
Ajv is a CommonJS dependency and Angular reports an optimization warning.

The existing `UI/` application also passes its development build and all 109
tests. Its test runner initially failed to read sandboxed temporary build files;
the same unchanged suite passed when run outside the sandbox.

Unit cases cover D1–D10 and D16–D19, expression validation, invalid schemas,
rate composition and power policy, original raw duplicate GLB names, actual
Blender GLB loading, preset transactionality/IndexedDB, two-instance isolation,
interrupted clip settlement, frame extraction, permission denial, late grant
cancellation and media-track release. D11/native fullscreen, D12 compressed
model decoding and physical touch input still require browser/device checks.

## Browser checks

Recorded local checks: both demos load; 5-7-0 appears in device labels and HTML;
power/broadcast LEDs light; SNAPSHOT stays 5-7-0 when knobs change to 6-7-0;
LIVE follows changes; Save/Reset/Load restores values/session/mode; a second
instance starts at defaults and switching back preserves the first; manual
camera changes viewpoint; a local GLB+JSON file chooser import activates.
Dragging the first knob cap changed its registered root's value; Home and five
Arrow Up presses restored 5. Fullscreen entered/exited in local Chromium.
Production worker installed under `/ui3d/`; after stopping the preview server,
the cached page reloaded and operated 5-7-0 broadcast successfully. The initial
offline test found a scope-relative navigation pattern error; corrected patterns
and the strengthened `verify:build` check now cover that behavior.

Follow these steps for release QA:

1. Drag each 3D knob by its child cap. Up increases, down decreases, bounds
   clamp. Select a knob and test all arrows/Home/End. Verify touch release/cancel
   restores orbit and does not leave a control stuck.
2. Set 5-7-0; inspect transparent canvas corners and all three digits/signature.
   Use both cameras, pan/zoom/rotate in manual view and resize the viewport.
3. Power ON and broadcast ON. Test frozen SNAPSHOT, then stopped-mode change to
   LIVE. Power OFF must darken LEDs, stop the surface and retire the active loop.
   Toggle rapidly ten times; final pose must match state.
4. Save/reset/load, export/import JSON. Corrupt a value or change device version;
   reject it with a diagnostic and leave the active instance intact. Use Reset.
5. Add a second instance; confirm controls/session/preset application target only
   the selected instance.
6. Import the sample via picker and drop. Try bad JSON, wrong extensions,
   oversized files, `knob10_1` + `knob10_1.001` and missing explicit bindings.
   Invalid pairs must preserve the previously active device and state.
7. On HTTPS/localhost, grant webcam permission explicitly, observe buffer growth,
   stop and verify the browser camera indicator turns off. Deny permission in a
   separate fresh session. Demo mode must remain available and clearly labeled.
8. Enter/exit fullscreen on desktop/Android Chrome. On iOS use maximized view
   and Add to Home Screen. Test portrait/landscape and high-DPI displays.
9. Run `npm run preview`, open `/ui3d/`, wait for **Offline app ready** in the
   footer and reload once. Stop the preview server, reload, and operate the demo
   from cache. Restart the server for subsequent online tests.
10. Install the PWA in a supporting browser. Test a rebuilt update and verify
    root and `/ui/` stay usable before/after offline UI3D operation. Inspect
    worker scope and ensure cached URLs stay under `/ui3d/`. Check an existing
    root-worker profile as well as a fresh profile; see README caveat.

Physical webcam, mobile touch, native installation, deployed upgrades and
coexistence with a previously installed root worker are not automated or claimed
passed. See IMPLEMENTATION_CHECKLIST.md for remaining work.
