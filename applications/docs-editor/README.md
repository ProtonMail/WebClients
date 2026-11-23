# Docs Editor

The Docs Editor will be presented by Docs in a sandboxed iframe via for example docs-editor.proton.me.

The editor establishes a bidirectional line of communication with the parent Docs client via the PostMesasge API.

More information can be found in the design doc here: https://confluence.protontech.ch/pages/viewpage.action?pageId=182012028#ProtonDocsDesignDocClientandAPI-Editorsandbox

## Lightweight dev server

`pnpm start:lite` serves the editor with Vite instead of webpack, for machines short on memory such as agent sandboxes running several dev servers. It is dev-only: production bundles still come from `build:web`.

It compiles each module when the browser first requests it instead of bundling the whole app. With the editor loaded, it takes about 0.65 GB where `pnpm start` takes 1.4–1.8 GB, even without its type checker. `vite optimize` first pre-bundles the dependencies into `node_modules/.vite` in a separate process, because the bundler keeps the memory it used for that until its process exits. That step peaks at about 1.2 GB on a cold cache and is skipped while the cache is up to date. If the server finds a dependency the step missed, it pre-bundles it itself and keeps that memory until it restarts.

It listens on port 8088, like `pnpm start` behind local-sso's slot 0, and `rte dev` uses it unless you pass `--full`. Differences from `pnpm start`, all in `vite.dev.config.mts`:

- Vite transforms the code (Oxc), not Babel, and runs no type checker.
- It always runs in `sso` app mode, like `pnpm start` behind local-sso (`pnpm start-all` passes `--appMode=sso`). So there is no standalone mode or `/login` dev page, which `pnpm start` has on its own.
- The page is a minimal HTML shell instead of `src/app.ejs`: no favicons or meta tags, and no `pre` / `unsupported` browser-support scripts.
- It only answers requests for `localhost`, IP addresses and `*.proton.dev` hosts, while the webpack dev server answers any host.
- No autoprefixer or `postcss-logical`, and the order of stylesheets can differ.
- The `process.env.*` and `WEBPACK_*` values that `@proton/pack` defines are copied into the config, so they need to follow changes there.
