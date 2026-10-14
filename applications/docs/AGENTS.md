# Proton Docs and Sheets (`applications/docs`, `applications/docs-editor`)

This file covers both apps:

- `applications/docs` (the **client**): the shell app. It holds the homepage (document list) and the document viewer around the editor.
- `applications/docs-editor` (the **editor**): runs in a sandboxed iframe inside the client. It renders text documents with Lexical (`Containers/Docs/`) and sheets with rowsncolumns (`Containers/Spreadsheet/`).

`packages/docs-core` (loading, syncing, encryption, websockets) and `packages/docs-shared` (shared types) hold existing logic but are being phased out: use what's there, add nothing new. See the first section of `CODING_STANDARDS.md`.

## Read before working

- [`GLOSSARY.md`](./GLOSSARY.md): read it before naming anything, or when a term in the code or the task is unfamiliar or ambiguous (Document vs Sheet, DU, commit, squash, public vs private, the two `Application` classes...). Use its terms in code, comments and MR descriptions.
- [`CODING_STANDARDS.md`](./CODING_STANDARDS.md): read it before writing or reviewing code in either app. Every rule in the shared sections applies, plus the section for the app you're in.
- `README.md` in each app, `applications/docs/contributing.md`, and `applications/docs-editor/src/standalone-{doc,sheet}/STANDALONE_*.md` for running an editor without the client.

## Commands

Run from the repo root. The package names are `proton-docs` (client) and `proton-docs-editor` (editor):

```sh
pnpm --filter <package> test            # jest; add `-- <path>` to run one file
pnpm --filter <package> lint
pnpm --filter <package> check:types
pnpm --filter <package> i18n:validate
```

`packages/docs-core` and `packages/docs-shared` have the same scripts. A change is done when every package it touches passes all of them.

## Where changes belong

- UI for the homepage or the document chrome (header, sharing, history modal): the client.
- Anything rendered inside the document (text editor, spreadsheet grid, comments panel, suggestions): the editor. The editor cannot import from the client; the two talk only through the bridge.
- New logic, types and helpers: the app that uses them, never `packages/docs-core` or `packages/docs-shared`. The client calls existing docs-core code only through `ApplicationInterface`.
