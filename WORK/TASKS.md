# Implementation tasks

## Scope and assumptions
Implement WORK/Concept.md in reviewable increments. Never commit or push.
Defaults: summed 10-draw score, direct hotbit consumption, preserved duplicate rows,
IndexedDB hotbits, localStorage custom lists. Raw hotbits must never be displayed.
Angular code uses callbacks/Promise chains, English comments, and four-space indentation.

## Increment 1: PWA foundation and rate lists (implementation complete; awaiting user verification)
- [x] Angular standalone application and production PWA configuration.
- [x] Default manifest, local import/paste, save/load/edit/rename/delete/export.
- [x] Safe optional HTTP(S) rate links and preserved order/duplicate identities.
- [x] Safe root deployment without overwriting source, rates, or notes.
- [x] Automated parsing/storage tests and production build.
- [ ] User verification: rate management, browser persistence, offline shell/installability.

## Collection and analysis scope
- [x] IndexedDB binary batches and atomic consumption; quota/error tests.
- [x] Camera capture lifecycle, frame comparison, health indicators, conditioning/packing.
- [x] Independent rejection sampling and score/GV analysis services with boundary tests.
- [x] Integrated analysis controls and hotbit counts.
- [ ] Real-device entropy assessment and offline acceptance checks.

## Open issues
Physical entropy quality cannot be established by unit tests. Label webcam data experimental.
Browser installation, offline operation, camera permissions, and real-device behavior require manual checks.

## Test results
Angular unit tests: 2 files, 6 tests passed. Covers parsing, duplicate identity, safe links, local persistence/edit/delete, corrupt storage preservation, quota errors, and default-list loading/copying. Production build and root preparation passed. Installability, offline operation, visual browser QA, and user acceptance remain unverified. No commits or pushes performed.


## Increment 2: Collection and analysis (implementation complete; manual verification pending)
The user confirmed rate import works and requested proceeding directly to analysis.
- [x] Binary IndexedDB batches with per-batch consumption cursors and cumulative count.
- [x] Transactional analysis prevents concurrent tabs from reusing stored draws.
- [x] Webcam permission/lifecycle handling, intensity comparisons, pair conditioning, unsigned packing.
- [x] Basic raw/conditioned bias and raw repetition gates; source explicitly experimental.
- [x] Rejection sampling, exact score/GV draws, top-20 and stable ordering.
- [x] Collection controls, available/consumed counts, disabled analysis until minimum available, results table.
- [x] Persistent storage request with denial/unsupported handling.
- [ ] Real-camera capture and empirical entropy assessment.
- [ ] User verification of collection, stopping/saving, analysis, browser persistence and offline operation.

Hotbit consumption includes rejected samples and draws from failed attempts; retries never replay those values.
No partial results are displayed on exhaustion. Database write failure aborts consumption and returns no results.
Provisional health thresholds and methodology are documented in README.md. They do not establish independence or entropy.

Final increment 2 validation: 5 test files, 18 tests passed; production PWA build and root preparation passed. IndexedDB quota failure verified. Real-device and offline checks pending. No commits or pushes.


## Camera health regression fix
Reported: every camera stopped after one comparison frame (1,186 raw candidates but only 39 conditioned bits).
Cause: the collector interpreted a not-yet-complete assessment as a failed source, and correlated startup samples were assessed immediately.
Implemented: explicit pending/passed/failed states, at least 8,192 raw candidates per assessment, continued sampling until 128 conditioned bits (65,536 raw limit), and automatic fresh-window retry after rejection. Unassessed/rejected material is never stored. Existing bias/repetition limits retained.
Regression tests cover low-yield warmup, biased/stuck rejection, and continued camera capture after rejected windows. Real-device confirmation pending.
Validation: all 21 tests and production build passed. Compiled root files refreshed. Real-camera and smartphone confirmation remain pending. No commits or pushes.

## Explicit camera startup gating
User requested skipping initial frames and waiting for frame A/B differences before bias testing.
Implemented: discard the first 15 delivered frames; establish a new baseline; wait for a difference at sampled pixels; discard that readiness pair; start extraction and health sampling on the next pair. Each capture session creates a new gate. Unchanged startup frames do not affect health counters.
Validation: 23 tests across 6 files passed, including constant startup frames and collector counter checks; production root build passed. Real-camera verification remains pending.
The reported screenshot contains the obsolete hard-stop message, which is absent from the current source. The browser or served deployment may still use an older build. No commits or pushes performed.

## Smartphone movement and live progress
Implemented: skip strongly directional frame comparisons before conditioning, preserving the current window and all stored hotbits. Keep diagnostic sample/bit counts cumulative across rejected windows. Persist each passed window immediately and begin a fresh independent window, so subsequent movement cannot discard previously validated words. The UI shows a native accessible progress bar against the selected list's minimum and enables analysis on the committed available count without stopping capture.
Tests cover camera movement, accumulated counts, live saves, and button/progress behavior at the exact minimum. Real-smartphone acceptance pending. No commits or pushes.
Validation: 24 tests passed across 6 files, production build/root preparation passed. Smartphone movement confirmation remains pending.

## Renamed default rate lists
Cause confirmed: RATES/index.json still referenced _RATES and With_MateriaMedicaUrls filenames after the files were renamed.
Regenerated the manifest from current files; removed obsolete generated public text copies; bypass the PWA cache when fetching the latest manifest with cached offline fallback. HTTP 404 now identifies a missing/renamed file and refreshes available filenames instead of blaming connectivity. Requests capture the selected filename to avoid selection changes affecting the loaded name.
Validation: 26 tests passed; production root build passed; all seven manifest entries match nonempty source/public/production rate files. Smartphone confirmation pending. No commits or pushes.

## GV extension and uninterrupted collection
User-approved rule: if the base maximum-of-three GV is strictly above 950, add a fresh inclusive 0–100 hotbit draw. Continue adding fresh draws while the last bonus is strictly above 95. Stop after adding a bonus of 95 or less. Sort by the extended GV. Base GV 950 does not trigger a bonus; bonus 95 does not repeat. GV may exceed 1000.
Analysis no longer stops the camera. Existing IndexedDB write transactions serialize collection writes and consumption. The minimum indicator remains a lower bound; bonuses and rejection sampling can require more hotbits. Exhaustion still returns no partial results, and collection remains active.
Validation: 37 tests passed; production/root build passed. Tests reproduce the examples (888, 1039, 1180), boundaries, bonus 100, exhaustion, extended sorting, and continued camera collection on success and failure. Manual acceptance pending. No commits or pushes.

## Website/PWA branding and versioning
Implemented the supplied image as an adapted atom/meditation icon via built-in Imagegen; source at UI/public/icons/radionics-source.png. Prompt: front-facing cyan atom and dark meditation silhouette with violet waves on navy, no box/perspective/text, small-size readability. Generated standard PNG sizes, padded maskable variants, Apple touch icon and multiresolution favicon. No CLI image-generation fallback used.
Added root version.json initialized to 1.0.0 / First version; version.mjs supports major/minor/patch/bugfix and validates input. Build syncs metadata without automatically incrementing. Footer loads version.json; PWA caches metadata with the app shell. Persistent future version-bump instructions are recorded in AGENTS.md.
Validation: semantic version script test passed; Angular suite and production build passed. Browser favicon/PWA installation appearance remains a manual check. No commits or pushes.

## UI redesign plan
Scope: presentation and workflow only; preserve camera, storage, rejection sampling, scoring/GV services.
1. Theme and compact SVG instrument header; persistent Simple/Advanced mode.
2. Four state-driven workflow cards, combined default/local selection, live collection progress.
3. Actual-GV result bars with top-three/full list; advanced numerical table.
4. Collapsible diagnostics, library/editor, storage and technical panels.
5. Regression checks for mode/state preservation, selection and result scaling; production root build.
Acceptance: manual mobile/desktop visual review remains required before further design increments.

## UI redesign implementation and validation
Version incremented once through version.mjs minor to 1.1.0.
Completed: CSS-variable dark/cyan/violet theme, lightweight decorative SVG, reusable standalone line icon component, persisted Simple/Advanced toggle, state-derived step navigation, default/local list selection, live collection controls, top-three/full actual-GV result bars, full numeric advanced results, collapsible diagnostics/library/editor/storage/technical sections. Local list copying added. Reduced-motion styles and keyboard focus preserved.
Camera, hotbit store, conditioning and analysis algorithms were not changed by this redesign.
Validation: all 39 tests passed; production root build passed. Browser checks at 320/390/1200 CSS-pixel widths; no horizontal overflow at 320. Loaded Bachflower default (39 rates, minimum 450), checked Advanced library opening and return to Simple with loaded list retained. Mobile screenshot: WORK/ui-mobile-preview.png.
Component-style production budget increased from 4/8 kB to 10/12 kB for the consolidated responsive UI (8.14 kB compiled style). Initial JS/CSS remains about 247 kB, within existing bundle budget.
Manual acceptance: user review on smartphone and desktop, real-device camera/analysis and PWA offline regression remain pending. No commits or pushes.

## Automatic PWA update detection
Version bumped once via version.mjs minor to 1.2.0.
Implemented independent PwaUpdates service using SwUpdate, startup/visibility checks, VERSION_READY banner, user-requested whole-page reload, disabled updates during collection/analysis, pending-write drain with start/analyze guards, and installed version/update status in Advanced Storage Management. No polling, activateUpdate asset mixing, cache clearing or user data deletion.
Validation: 46 tests across 7 files passed; production root build passed. Regression tests cover startup/foreground/background, ready-event-only notification, no automatic reload, duplicate check suppression, offline failure, disabled service worker, listener cleanup, busy-operation guards and queued writes. Existing IndexedDB transaction/storage tests remain passing. version.json stays app-shell cached so its label reflects the installed build.
Manual acceptance pending: two actual production deployments on HTTPS/GitHub Pages, foreground update notice, successful explicit reload and storage retention. Development preview has service workers disabled. No commits or pushes.

## Photo Analysis plan
Implement standalone optional Photo Analysis UI, session-only image gallery/camera/upload, configurable 50/25/16 grids, shared GV helper and transactional hotbit consumption, natural-dimension canvas export with top-three fine red crosses. Integrate busy state with rate analysis and PWA reload guards. Test all cell counts/bounds/GV sorting, shared consumption, image failure and camera lifecycle. No image-derived weighting or permanent image storage.

## Photo Analysis implementation and validation
Version bumped once via version.mjs minor to 1.3.0. Standalone PhotoAnalysis component adds local capture/upload/session selection, grids 50/25/16, top-three random-GV selection, natural-dimension canvas crosses, summary/table and PNG download. Existing GV extracted into a shared helper without altering the rule. HotbitStore uses a shared generic consumption transaction for rate and photo workflows; no database schema change. Photo busy states protect PWA reload and concurrent rate analysis. Rate lists/results remain separate.
Validation: 59 tests across 9 files passed; production root build passed. Tests cover every grid's draw count, geometry/proportions, last-row/column centers, >950 bonuses and ranking, exhaustion, fine marker coordinates, canvas dimensions, session URL cleanup, camera denial/late permissions and shared hotbit retirement. Browser loaded local source PNG at 1254×1254, switched to 16×16 with minimum 768, and confirmed analysis disabled without stored hotbits. Preview saved to WORK/photo-analysis-preview.png.
Manual acceptance pending: real-camera snapshot, analysis with real collected hotbits, actual PNG export/download and PWA offline flow. At most five sources in memory, 40-megapixel guard, no permanent image storage, no image uploads. No commits or pushes.
