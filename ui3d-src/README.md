# Radionics UI3D prototype

Standalone Angular PWA, served only at `/ui3d/`. Source is in this directory;
`../ui3d/` is generated publication output. The existing root application and
`UI/` source/build are preserved. No commit, push or hosted deployment is performed.

## Run on Windows

```powershell
cd C:\WORK\GITHUB\ENERGETICS\isuretpolos.github.io\ui3d-src
npm ci
npm run prepare:assets
npm start
```

Open <http://127.0.0.1:4300/ui3d/>. Node 24.18.0 and npm 11.16.0 were used.
Pinned packages: Angular/CLI/build/service-worker 22.2.2, TypeScript 6.0.3,
Three.js 0.186.1, Three types 0.183.1, Vitest 5.0.3, Ajv 8.17.1.
Angular's compiler requires TypeScript `>=6.0 <6.1`; the newer TypeScript 7 is
intentionally not used. Every dependency is locked in `package-lock.json`.

```powershell
npm test                 # Engine and runtime GLB tests
npm run check            # Strict TypeScript check
npm run build            # Production PWA into dist/browser
npm run deploy           # Build and copy exclusively into ../ui3d
npm run verify:build     # Check output URL/cache isolation
npm run preview          # Serve production output at http://127.0.0.1:4400/ui3d/
```

`deploy` prepares repository files only. It never commits or pushes. The release
script was run once with `minor`, producing root release **1.16.0**. Ordinary
UI3D builds copy that metadata and do not bump it. Future feature/bugfix releases
must follow root `AGENTS.md` before a production build.

## Demonstration

1. Load Demo: a real Blender-exported GLB, with grouped controls, displays,
   cameras and clips. Procedural demo uses the same registry/store interface.
2. Set the three HTML sliders to **5, 7, 0**, or drag a knob vertically. On the
   3D canvas, select a knob then use arrows, Home or End. Dragging a cap turns
   its parent control around the authored origin. Manual camera allows orbit,
   pan and zoom; Top view retains pan/zoom but disables orbit rotation.
3. Power ON, then broadcast ON. LEDs light and the broadcast plane animates.
   In SNAPSHOT, changing a knob preserves the session signature and displays a
   difference notice. Stop broadcast, select LIVE, restart and change a knob:
   the session follows the current signature.
4. Power OFF stops broadcast and diagnosis. Mechanical knob values persist.
5. Save, Reset, Load to test IndexedDB. Export/import presets as JSON.
   Presets are applied to the selected runtime instance only.
6. Add second instance and switch between instance buttons. Values and sessions
   remain independent; both use the same version-scoped preset library.
7. Fullscreen uses the native API where available. Otherwise maximized view
   hides secondary controls and suggests Add to Home Screen on iOS.
8. Start webcam explicitly to request permission. Stop / demo releases the
   stream and explicitly returns to browser-crypto demo graphics. Webcam bytes
   are experimental; frames and imported files never leave the browser.

## Your own devices

Use Import device pair, or drop exactly `device.json` and one self-contained
`.glb` onto the viewport. Import is staged and validated before activation;
errors leave the previous device and its state intact. No `.gltf` external files,
absolute URLs or external buffers/textures are accepted. JSON is limited to
1 MB; models warn above 20 MB and are refused above 100 MB. Device limits can
lower these values. Imported models stay in memory; only presets enter IndexedDB.

To replace the bundled startup device, place the pair in
`public/devices/classic-demo/`, retaining the filename `device.json`; change the
definition's metadata/model path. No Angular component changes are needed.
Additional devices can always be imported locally. A multi-device catalog picker
is not implemented; the library currently has one startup entry.

Read [DEVICE_SCHEMA.md](DEVICE_SCHEMA.md), [BLENDER_WORKFLOW.md](BLENDER_WORKFLOW.md),
[ASSETS.md](ASSETS.md), [TEST_CHECKLIST.md](TEST_CHECKLIST.md), and
[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md).

## Offline and browser constraints

Production output includes an Angular worker registered with scope `/ui3d/`, a
matching standalone manifest and local decoders. Dev mode does not register the
worker. First visit requires connectivity; wait for installation, reload, then
test offline. No routes need a GitHub Pages deep-link fallback.

An already-installed **root-scoped worker from the existing application** can
intercept a first `/ui3d/` visit before UI3D's more-specific worker has installed.
Existing root worker files have deliberately not been changed. Use a fresh
browser profile for initial installation tests; verify upgrades in the actual
hosting environment before release. UI3D itself never unregisters another app's
worker or caches URLs outside its scope.

Native fullscreen and PWA installation depend on browser support. Arbitrary
element fullscreen is unavailable in iOS Safari; use the maximized fallback or
installed standalone view. Webcam needs HTTPS/localhost; background sampling
pauses and mobile operating systems can suspend the app. Physical mobile device,
webcam permission and deployed update checks remain manual, as recorded in the
checklists. No backend is needed.
