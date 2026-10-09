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
stop collection to save a partial batch (full batches save at about 10,000
integers). The analysis button enables once the available count reaches the
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
