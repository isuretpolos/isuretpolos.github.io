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

## Subsequent increments (awaiting increment 1 verification)
- [ ] IndexedDB binary batches and atomic consumption; quota/error tests.
- [ ] Camera capture lifecycle, frame comparison, health indicators, conditioning/packing.
- [ ] Independent rejection sampling and score/GV analysis services with boundary tests.
- [ ] Integrated analysis controls and hotbit counts.
- [ ] Real-device entropy assessment and offline acceptance checks.

## Open issues
Physical entropy quality cannot be established by unit tests. Label webcam data experimental.
Browser installation, offline operation, camera permissions, and real-device behavior require manual checks.

## Test results
Angular unit tests: 2 files, 6 tests passed. Covers parsing, duplicate identity, safe links, local persistence/edit/delete, corrupt storage preservation, quota errors, and default-list loading/copying. Production build and root preparation passed. Installability, offline operation, visual browser QA, and user acceptance remain unverified. No commits or pushes performed.

