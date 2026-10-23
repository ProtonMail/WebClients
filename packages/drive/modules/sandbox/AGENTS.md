# Drive sandbox (`@proton/drive/modules/sandbox`)

Runs third-party parsers on untrusted file bytes inside an isolated iframe. `host/`, `sandboxed/` and `protocol/` are the box; each library that uses it is a **consumer**: a `<name>.sandboxed.ts` shim plus a facade, in its own folder under `packages/drive/modules/`.

## Read before working

- [`README.md`](./README.md): how the box works, the gotchas, and how a consumer (sandboxed shim plus facade) is written. Read its "Writing a consumer" section when asked to sandbox, isolate or add a parsing library, then follow the recipe below.
- [ADR 0001](./docs/adr/0001-rules-for-adding-a-library.md): the decisions every consumer relies on (assets, build target, zod validation, testing ownership).

## Hard rules

- Never add `allow-same-origin`, widen `connect-src`, or serve a sandboxed library from the app origin, even to make a test or a WASM load pass. A library that needs a file gets it through `assets` + `getAsset()`.
- `host/`, `sandboxed/`, `protocol/` hold no product logic. A new library is a new consumer, never a change to the box.
- Import `*.sandboxed` files with `import type` only.
- Validate every value a sandboxed library returns with a zod schema in the facade before using it.
- Any change to the iframe attributes, CSP or `createSandboxedLibrary` needs human security review. Say so in the MR.
- jsdom ignores CSP, so passing tests do not prove the isolation works. Say so in the MR.

## Commands

Run from the repo root:

```sh
pnpm --filter @proton/drive test modules/sandbox   # or modules/<name> for a consumer
pnpm --filter @proton/drive check:types
pnpm --filter @proton/drive lint
pnpm --filter proton-drive build:web               # emits the sandboxed bundles
```

A change is done when all four pass.

## Adding a library

1. **Decide the input and output.** Write down what goes in and what comes out. "Add pdf.js" is not enough; "page count and first-page thumbnail for a PDF Blob" is. Pick a camelCase name, for example `pdfPreview`: it must be unique across `packages/drive/modules/**/*.sandboxed.ts`.
2. **Run the [library checklist](#library-checklist)** and keep the results for the MR.
3. **Install the library:** `pnpm --filter @proton/drive add <library>`. The first consumer also adds `zod` ([ADR 0001](./docs/adr/0001-rules-for-adding-a-library.md), decision 3): `pnpm --filter @proton/drive add zod`.
4. **Write the sandboxed shim and the facade** as shown in the README's "Writing a consumer".
5. **Test and verify:**
    - Schema, no mocks: `pdfInfoSchema.safeParse(...)` accepts a valid value and rejects wrong types and values above each `.max()`.
    - Library logic: if the library runs in jsdom, test the sandboxed code on a small real fixture file. If it doesn't, say so in the MR and describe the manual browser check.
    - Don't add tests claiming the iframe blocks things; jsdom can't prove it.
    - Run the four commands above. The build must emit one `<name>.sandboxed.<hash>.js`; note its size.
6. **Write the MR description:**
    - The checklist results and the sandboxed bundle size.
    - "Sandbox isolation for this library is covered by jsdom tests only; it has not been verified in a real browser."
    - If you changed `createSandboxedLibrary` or the build target: "Touches sandbox security settings, needs security review."

## Library checklist

Run this before writing any code for a new library.

Go through the library's docs and source for each point and write the results down; they go in the MR. Stop and ask on any "stop".

| Check | If yes |
| --- | --- |
| Loads files at runtime by URL (`.wasm`, fonts, data, CDN) | `.wasm` or data: pass it through `assets` + `getAsset()`. CDN only: stop. |
| Starts Web Workers | It must have a no-worker mode (e.g. pdf.js `disableWorker`). None: stop. |
| Needs network (`fetch`, XHR, WebSocket) beyond its own assets | Stop. `connect-src 'none'` is not negotiable. |
| Uses Node built-ins (`fs`, `path`, `Buffer`, `stream`) | It needs a browser build. None: stop. |
| Uses `requestAnimationFrame` | Shim it to `setTimeout` at the top of the sandboxed code (see the README gotchas). |
| Uses dynamic `import()` / lazy chunks | It must still bundle into one file; check after the build. |
| Needs APIs missing in Chrome 80 / Safari 14 (WebCodecs, `OffscreenCanvas`, …) | The sandboxed code exposes its own check method, e.g. `canDecode()`. |
| License | Must be compatible with GPL-3.0. Unclear: stop. |

Also note the library's minified size. It only downloads for users who use the feature, but the reviewer should know.
