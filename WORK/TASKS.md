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

