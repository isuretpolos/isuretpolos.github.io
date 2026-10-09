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
