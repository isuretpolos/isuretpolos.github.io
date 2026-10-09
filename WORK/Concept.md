# Online Radionics Tool: Corrected Concept

## Workflow for Codex

1. Analyze the requested change and its impact on the existing application.
2. Identify genuine ambiguities or decisions that block implementation. Ask concise questions only when necessary; otherwise document explicit assumptions.
3. Maintain a readable `TASKS.md` with scope, assumptions, implementation steps, open issues, status, and test results.
4. Implement one coherent, testable increment at a time. Build and run applicable automated tests. Never commit or push to Git unless expressly requested.
5. Summarize changes, tests, and outstanding issues. Ask the user to test the increment before moving to the next increment. Do not claim user acceptance prematurely.
6. Mark items completed in `TASKS.md` only after their defined completion criteria have been met. Record unresolved items separately.

## Engineering principles

- Prioritize simple, maintainable architecture and established technologies. Avoid unnecessary dependencies.
- Prefer Angular with a Progressive Web App (PWA) architecture and clean, accessible HTML and CSS.
- Keep analysis and randomness generation in independent, testable services, separate from UI components.
- Prefer event-driven mechanisms, callbacks, or asynchronous Promises/Observables as appropriate. Avoid blocking waits, busy loops, and polling when events are available. Do not prohibit `async`/`await`, which is a standard way to use asynchronous APIs.
- Design for offline use after the initial app load. The camera must never transmit video or images to the server.
- Use HTTPS for deployed camera and relevant storage APIs (localhost is an exception for development).

## Application

A browser-based radionics research tool, installable as a PWA, with local webcam-derived random-data collection and rate-list analysis. The application may be hosted online, but collection, storage, and analysis should work locally without requiring an account or server.

### 1. Randomness acquisition: webcam hotbits

1. Request camera permission from a user action and acquire frames with `getUserMedia()`.
2. Compare suitable pixel intensity values from successive frames. As an initial raw-bit candidate, use `1` when a value becomes brighter, `0` when it becomes darker, and discard equal values. This comparison is only a *candidate* raw-bit extraction method, not proof of a true random number generator.
3. Investigate exposure auto-adjustment, correlated adjacent pixels, compression, temporal noise, bias, motion, lighting changes, and camera-specific artifacts. Prefer a stationary, covered sensor if testing a noise-based source, but verify that it supplies measurable entropy.
4. Run appropriate health checks on acquired data and evaluate entropy and statistical characteristics. Apply a documented debiasing/conditioning strategy. Statistical tests alone do not prove unpredictability or quantum randomness. If adequate entropy cannot be demonstrated, label the source `webcam-derived experimental randomness`, not a verified TRNG.
5. Pack conditioned bits into unsigned 32-bit integers (`Uint32Array`, value range 0 to 4,294,967,295). Track the number of usable bits and rejected samples. Do not silently substitute a pseudo-random fallback and call it hotbits.
6. Never show raw integers or bits in the UI. The UI may show available count, collection status, and aggregate health indicators.
7. Stop camera capture when the user stops collection, closes the page, or camera access fails; release tracks. Do not assume capture continues reliably in the background or when the PWA is closed.

### 2. Local storage and permissions

- Store hotbits primarily in IndexedDB as binary batches, rather than storing an ever-growing JSON array in `localStorage`. Keep a count and a cursor for consumption; avoid reusing consumed material unintentionally.
- At approximately 10,000 integers (40,000 bytes of raw 32-bit data), commit a batch to IndexedDB. This is a batch-size target, not a requirement to write a local file.
- Optionally use the Origin Private File System (OPFS) for app-private file-like storage. It does not normally require a new user-selected file permission for every write, but is browser-managed, origin-scoped, subject to quota/eviction, and not a user-visible ordinary file.
- Offer explicit import/export or backup using a download or the File System Access API when supported. Access to arbitrary user-visible files requires user permission and may need renewed permission across sessions; do not promise perpetual permission from a saved file handle.
- Handle quota errors and browser data clearing. Request persistent storage via `navigator.storage.persist()` where supported, without assuming that it will be granted. Explain that uninstalling the app or clearing site data may erase local data.
- Use IndexedDB transactions so a batch and its consumption state are updated consistently.

### 3. Metaphysical interpretation

Project hypothesis: raw hotbits should remain unobserved by the human operator during analysis. Therefore, the application must not display them directly.

This is a methodological/metaphysical rule of the radionics model. Digital acquisition and recording are already physical measurements, and hiding numbers from the screen does not keep classical stored bits physically indeterminate. Webcam-derived bits are not qubits, and their random quality is an empirical question. Do not present the project's metaphysical interpretation as a proven physical mechanism.

### 4. Rate-list import

The user selects a UTF-8 text file containing one rate per line, for example:

```text
Arnica
Belladonna
China
Pulsatilla
Strontium
Taraxacum
Zincum
```

A TAB in a line is considered a delimiter for more informations, like an URL. For example:
````text
Abies Canadensis	http://homeoint.org/clarke/a/ab_c.htm
Abies Nigra	http://homeoint.org/clarke/a/ab_n.htm
Abrotanum	http://homeoint.org/clarke/a/abrot.htm
````
So do not display the URL, but use it as a HREF link.

- Load the file into an ordered list.
- Trim whitespace; ignore empty lines. Preserve meaningful spelling and ordering.
- Decide whether duplicate rate names should be treated as distinct entries; default to preserving entries, identified by their original line index.
- Do not upload the rate file to a server.
- Explain and reject empty or unreadable files.

### 5. Random-number use

Two distinct modes are possible and must not be conflated:

**Mode A, direct hotbit consumption (recommended for the stated concept):** consume conditioned hotbits for each random draw. Derive uniform integers in an inclusive range by rejection sampling, avoiding modulo bias. A draw between 0 and 10 consumes enough fresh entropy to select one of 11 values uniformly. Stop or pause analysis if insufficient hotbits are available.

**Mode B, hotbit-seeded pseudorandom generator (optional):** seed a specified, well-defined PRNG/CSPRNG from sufficiently many conditioned hotbits, with an explicit reseeding policy. Subsequent outputs are pseudorandom, not newly generated TRNG values. For a browser CSPRNG, `crypto.getRandomValues()` is available, but the browser does not provide an API to seed it from user-supplied hotbits. Do not imply that it does.

**Default: Mode A**, unless the user explicitly chooses a seeded generator for reproducibility/performance reasons. Neither mode demonstrates a metaphysical influence on the random numbers.

### 6. First-stage energetic score

1. For each rate, draw **10 independent integers in the inclusive range 0–10**.
2. **Proposed clarification:** sum these 10 integers to obtain the rate's `energeticScore` (range 0–100). The original concept did not specify how the 10 values were combined; confirm this rule if a different aggregation was intended.
3. Sort all rates by `energeticScore` descending. For exact ties, retain original rate-list order to ensure predictable selection.
4. Select the first `min(20, numberOfRates)` rates. Store rate identity, original index, and energetic score.

A high score in this stage means a high ranking under the defined random procedure; it does not independently establish physical energy or a clinical property.

### 7. Second-stage General Vitality (GV)

For each selected rate:

1. Draw **3 independent integers between 0 and 1000 inclusive**.
2. Define `GV = max(draw1, draw2, draw3)`.
3. Example: draws `10, 459, 910` produce `GV = 910`. The earlier example `1010` was invalid because it exceeded the maximum.
4. Keep `energeticScore` and `GV` as separate fields. Sort the final selected rates by `GV` descending, breaking ties first by energetic score descending, then by original list order.
5. Display rate name, energetic score, and GV. Never display the underlying hotbits.

Note: taking the maximum of three uniform 0–1000 draws intentionally biases GV toward higher values (expected GV is approximately 750). GV is therefore not uniformly distributed; avoid interpreting high values as rare without calculating their expected frequency.

### 8. UI and operation

- Provide controls for camera start/stop, hotbit collection, rate-list import, and analysis.
- Show available/consumed hotbit counts and meaningful errors; never show raw bits or 32-bit integers.
- Disable or pause analysis when insufficient data exists, unless the user has explicitly selected the seeded PRNG mode.
- Keep all processing and data local; no backend is required for the first version.
- Support desktop browsers first, with clear handling for browsers that cannot use the relevant camera or filesystem APIs.
- Use Angular PWA caching for the application shell; verify offline behavior manually.

## Testing and acceptance criteria

- Automated tests verify bit packing, rejection sampling, correct inclusive bounds, exact 10-draw scoring, sorting, tie handling, top-20 selection, and GV calculations.
- Test with zero rates, fewer than 20 rates, duplicate names, and more than 20 rates.
- Test IndexedDB persistence, batch consumption without unintended reuse, storage quota errors, and camera permission denial.
- Test the application's camera capture with real devices; clearly report the entropy assessment instead of claiming TRNG status from unit tests.
- Test installability and offline operation of the PWA in supported browsers.
- No git commits or pushes are performed by the coding assistant.
- After each increment, report its results and ask the user to verify it before beginning the next.

## Decisions requiring confirmation

- **Aggregation rule:** is the energetic score the sum of 10 values (0–100), or was another rule intended?
- **Randomness mode:** directly consume stored hotbits (default), or seed a PRNG (as in the original draft)?
- **Duplicate rates:** preserve duplicates as independent rows (default), or merge/remove them?
- **Persistence:** app-private IndexedDB/OPFS as standard, and user-visible file export only when requested (recommended)?

## Implementation task tracker (initial)

- [ ] Confirm material choices above or accept their proposed defaults.
- [ ] Set up Angular PWA project and local storage service.
- [ ] Implement webcam acquisition, candidate bit extraction, and basic health indicators.
- [ ] Assess source entropy; implement conditioning and pack into uint32 batches.
- [ ] Implement storage, consumption, and optional export.
- [ ] Implement rate import, 10-draw energetic scoring, and top-20 selection.
- [ ] Implement 3-draw GV scoring and final ordering.
- [ ] Implement UI states, failure handling, and offline support.
- [ ] Run tests and complete user verification for each increment.


## GitHub Pages Deployment and Rate List Management

The application is hosted as the official GitHub Pages website of **Isuret Polos**.

- Repository: https://github.com/isuretpolos/isuretpolos.github.io
- Website: https://isuretpolos.github.io/

### Repository Structure

```text
isuretpolos.github.io/
├── index.html       # Compiled Angular entry point
├── assets/           # Compiled JavaScript, CSS and assets
├── RATES/            # Default rate lists (*.txt)
├── UI/               # Angular source application
├── WORK/             # Development notes and tasks
└── README.md
```

### Angular Build and Deployment

- The Angular application is developed inside the `UI` directory.
- The compiled application must be deployed directly into the repository root directory.
- The compiled `index.html` must exist in the root, because GitHub Pages serves the website from there.
- All generated JavaScript, CSS and other application assets must be available through paths relative to the website root.
- Configure Angular with `baseHref: "/"`.
- Configure the build output so that the generated browser files are copied into the repository root. Do not copy Angular source files or development dependencies.
- GitHub Pages must be configured to publish from the root of the `master` branch.
- Do not overwrite the `RATES`, `UI`, `WORK` directories or `README.md` during deployment.
- The application must function as a static website without requiring a backend.
- PWA functionality must work with GitHub Pages over HTTPS.
- The service worker must not accidentally cache outdated rate lists indefinitely. Provide an appropriate update strategy.

### Default Rate Lists

The `RATES` directory contains predefined radionics rate lists as plain UTF-8 text files (`*.txt`).

Each line represents one rate.

The application must offer three ways to load rate lists:

**1. Default rate lists**

Load predefined lists directly from the GitHub Pages `RATES` directory.

Since a static website cannot enumerate server directories, maintain a `RATES/index.json` manifest containing the available rate list filenames. Alternatively, generate this manifest automatically during the build process.

**2. Paste a custom rate list**

Provide a text area where users can paste their own rate lists, one rate per line.

Users can assign a name to the list and save it locally.

**3. Import a rate list from disk**

Allow users to select a local `.txt` file using the standard browser File API.

Read the file locally without uploading it to any server.

### Local Rate List Storage

- Store imported and manually entered rate lists persistently in the browser.
- Use `localStorage` for these small text-based lists.
- Each stored list must have a unique ID, name, content and creation timestamp.
- Users must be able to load, rename, edit and delete their own lists.
- Predefined lists from `RATES` remain read-only, but users may create editable local copies.
- Imported and pasted lists must use the same analysis procedure as predefined lists.
- Ignore empty lines and trim whitespace when parsing rate lists.
- Keep the original order of rates.
- All imported data remains on the user's device.

### Offline Support

The PWA should cache the application assets and previously loaded default rate lists for offline use.

Locally stored rate lists must remain available offline.

A first-time download of a default rate list requires an internet connection unless that list has already been precached.

### Important Restrictions

- GitHub Pages provides static file hosting only. Do not attempt to write files into the GitHub repository from the browser.
- `localStorage` belongs to the current browser origin and is not automatically synchronized across devices.
- Clearing browser storage can permanently remove custom lists.
- Provide export functionality so users can back up their custom rate lists as `.txt` files.
- Store Hotbits separately in IndexedDB, as described in the Hotbits section of this concept.
- Do not commit or push changes automatically. Follow the development workflow and wait for user approval before proceeding to the next step.