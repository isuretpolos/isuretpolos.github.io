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

The first increment implements rate-list management. Camera acquisition,
IndexedDB hotbits, and scoring remain tracked in `WORK/TASKS.md`.

For acceptance, load a default, create a copy, import/paste UTF-8 text, save,
rename/edit, reload, export, and delete a list. Serve the production root over
HTTPS or localhost to check installation and offline reload after the service
worker takes control. `npm start` is a development server; PWA caching is enabled
in production builds only. No imported list is sent to a server.
