# docs.proton.me - Proton Docs

The application that contains:

- The "docs homepage" (`/`) that lists documents (most recent, owned by me, owned by others...).
- The document viewer/editor (`/doc`).

There are two "entrypoints" (root React components):

- A "public" one for unauthenticated users - access to documents that are shared publicly.
- A "user" one for authenticated users - access to the "docs homepage" and the document viewer/editor.

Depending on the context (e.g. URL), either the "public" or the "user" entrypoint component is rendered.

See the [contributing guide](./contributing.md) for more information on the codebase, [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) for coding guidelines, and [`GLOSSARY.md`](./GLOSSARY.md) for a glossary of concepts.
