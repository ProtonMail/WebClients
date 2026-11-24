# docs.proton.me - Proton Docs

The application that contains:

- The "docs homepage" (`/`) that lists documents (most recent, owned by me, owned by others...).
- The document viewer/editor (`/doc`).

There are two "entrypoints" (root React components):

- A "public" one for unauthenticated users - access to documents that are shared publicly.
- A "user" one for authenticated users - access to the "docs homepage" and the document viewer/editor.

Depending on the context (e.g. URL), either the "public" or the "user" entrypoint component is rendered.

See the [contributing guide](./contributing.md) for more information on the codebase, [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) for coding guidelines, and [`GLOSSARY.md`](./GLOSSARY.md) for a glossary of concepts.

## Lightweight dev server

`pnpm start:lite` serves the client with Vite instead of webpack, for machines short on memory such as agent sandboxes running several dev servers. It is dev-only: production bundles still come from `build:web`. `rte dev` uses it, and the editor's (see `applications/docs-editor/README.md`), unless you pass `--full`.

It works like the editor's lightweight server, with the same differences from `pnpm start`, and `vite.dev.config.mts` holds them. On top of those:

- webpack's `module.hot` is `undefined`, so the Redux store doesn't hot-swap its reducers: Vite reloads the modules instead.
- `@protontech/crypto` isn't pre-bundled, so that its crypto worker (`new URL('../worker.ts', import.meta.url)`) resolves.
- `APP_VERSION` is always `5.0.999.999`, webpack's fallback, instead of the version of the latest `proton-docs` git tag.

