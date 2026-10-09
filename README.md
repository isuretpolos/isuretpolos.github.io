# Isuret Polos - Online Radionics Tools

[This website](https://isuretpolos.github.io)

Links:
- [Patreon](https://www.patreon.com/c/aetherone)
- Blog on [Radionics and Homeopathy](https://radionics.home.blog/)
- My personal blog [Isuret Polos](https://isuretpolos.wordpress.com/)
- The Open Source Radionics [Community](https://vk.com/club184090674) on VK
## Development

The Angular source lives in `UI`. Use Node.js 24.15 or newer and npm:

```sh
cd UI
npm ci
npm start
npm test -- --watch=false
npm run deploy
```

`npm run deploy` builds the production PWA and prepares compiled browser files in
this repository root. It does not publish, commit, or push. It preserves `RATES`,
`UI`, `WORK`, and this README. GitHub Pages should serve the root of `master`;
repository settings must be verified by the owner.

Default lists are generated into `RATES/index.json` from the `.txt` filenames at
build time. Development startup copies them into Angular's public directory.
The PWA uses network-first default-list caching (3-second timeout, one-day maximum
cache age). Download a list online before checking its offline availability.

Rate-list management, local webcam collection, IndexedDB hotbit storage and two-stage analysis are implemented. Manual acceptance is tracked in `WORK/TASKS.md`.

For acceptance, load a default, create a copy, import/paste UTF-8 text, save,
rename/edit, reload, export, and delete a list. Serve the production root over
HTTPS or localhost to check installation and offline reload after the service
worker takes control. `npm start` is a development server; PWA caching is enabled
in production builds only. No imported list is sent to a server.


To analyze: load a list, start camera collection, allow camera permission, then
watch the available count increase as validated windows save automatically. The analysis button enables once the available count reaches the
minimum draw count. Rejection sampling can require additional integers. Failed
attempts also retire consumed material. Analysis uses ten inclusive 0–10 draws
per rate, selects the top 20 summed scores, then computes each GV as the maximum
of three inclusive 0–1000 draws.

Collection uses successive sparse red-channel intensity comparisons and Von
Neumann pairs. Basic checks require at least 8,192 raw candidate bits and 128
conditioned bits, raw one fraction between 20% and 80%, conditioned one fraction
between 10% and 90%, and no raw run of 32 equal bits. These provisional gates are
not an entropy estimate or TRNG certification. Correlations, lighting, exposure,
and sensor artifacts remain unassessed on real devices. An incomplete assessment keeps collecting. A failed gate discards the pending window and automatically gathers a fresh window without stopping the camera. A window with fewer than 128 conditioned bits is rejected after 65,536 raw candidates. Partial words are never stored.
Capture stops on page hiding, page exit, permission loss, or component teardown.
Camera frames are neither displayed nor transmitted. There is no PRNG fallback.

Camera startup skips the first 15 delivered frames, then waits for a differing
pair at the sampled pixels. That first differing pair is discarded as readiness
confirmation; extraction and health tests start on the following pair. This
startup gate does not establish sensor entropy or exposure stability.

Validated collection windows now save immediately during capture. Strongly
one-directional frame comparisons (20% or less, or 80% or more brightening)
are skipped without resetting the pending window. Diagnostic counters remain
cumulative during a session. The minimum-count progress bar uses committed
IndexedDB integers; analysis enables immediately when that minimum is available.
Rejection sampling can still require additional integers. These movement filters
and health gates remain experimental, not an entropy certification.

GV extension: a base GV strictly above 950 triggers an additional inclusive
0–100 hotbit draw. Add it to GV, and repeat if that bonus is strictly above 95.
The final bonus of 95 or less is also added. GV can therefore exceed 1000;
final sorting uses the extended value. The progress-bar minimum excludes these
variable bonus draws. Camera collection continues when analysis is requested,
including when an attempt exhausts currently stored hotbits.

## Versioning

Root `version.json` starts at `1.0.0` / `First version`. The application loads it
and displays version and description in the footer. The build synchronizes it
into Angular's public output and the service worker caches it with the app shell,
so the version label matches the installed build, including offline use.

From `UI`, increment once before building:

```sh
npm run release:major -- "Breaking release description"
npm run release:minor -- "New feature description"
npm run release:bugfix -- "Bugfix description"
npm run deploy
```

Major resets minor/patch; minor resets patch; bugfix increments patch only.
Ordinary builds do not increment versions. Future assistant changes follow the
versioning instructions in `AGENTS.md`. No command commits or pushes.

Website/PWA icons are in `UI/public/icons`; the master is `radionics-source.png`.
Dedicated maskable variants include safe padding. The favicon includes 16, 32,
48 and 256 pixel images; Apple touch uses 180 pixels.

## Interface modes (1.1.0)

Simple mode guides list selection, hotbit collection, analysis and results.
Advanced mode retains diagnostics, local library/editor, import/export,
persistence requests, complete numerical results and technical notes in
collapsible panels. Mode preference is local; switching does not reset data.
Result bars scale GV relative to the largest GV in the current result set.
The first three results display initially; expand to see all selected rates.

## Automatic PWA updates (1.2.0)

The production PWA checks through Angular SwUpdate at startup and whenever the
page becomes visible again. VERSION_READY shows "New version available" and
"Update now". Update checks are deduplicated; offline failures are nonfatal and
retried on foreground. The notification never triggers an automatic reload.
The button is disabled during camera collection or analysis. Explicit reloads
wait for queued hotbit writes and block new collection/analysis during that wait.
Advanced → Storage Management shows the installed version from the app-shell
cached version.json, plus update-check status. No caches, service workers,
IndexedDB databases or localStorage entries are cleared for updates.

Serve the production root over GitHub Pages HTTPS or localhost. Angular's
ngsw.json detects a newly deployed build; deploy the complete matching compiled
assets and manifest together. Development `npm start` disables the service
worker. For manual acceptance, install/open build A, deploy build B, return to
the foreground and check the banner. Verify updating is blocked while collecting
or analyzing; stop/finish, click Update now, and confirm the installed version
and saved rate lists/hotbit count after reload. Existing site origin and storage
schema are unchanged.

## Photo Analysis (1.3.0)

Open the optional Photo Analysis panel to take a camera photo, load a local
PNG/JPEG/WebP/GIF/BMP image, or select one of up to five session-loaded images.
Choose 50×50 (default, 2500 cells), 25×25 (625), or 16×16 (256). Each cell
receives the shared three-draw GV and >950 bonus procedure; no pixel-derived
weighting is used. Cells sort by GV, with row-major position breaking ties.
The three highest values get fine red crosses at cell centers. The canvas and
export preserve natural image dimensions and proportions; no 50-pixel thumbnail
is substituted for the original. Source/result data stays in memory and is
released on page teardown. Images over 40 megapixels are rejected explicitly.

Minimum hotbit counts are 7500, 1875, and 768 respectively; bonus draws and
rejection sampling require additional material. Collection may continue while
analyzing. Photo/rate draws use the same serialized IndexedDB consumption path.
PWA updates are blocked during camera capture, image decoding and photo analysis.
Use Export result PNG to download the composited image. Advanced mode adds grid
density notes and a coordinate/GV table. Positions are 1-based column/row.

This is experimental random-based radionics selection, not validated anomaly
detection, scientific image forensics or medical diagnosis. Camera permission
requires HTTPS/localhost. Device camera sharing limitations may require stopping
hotbit collection before taking a photo; importing an image avoids that conflict.
