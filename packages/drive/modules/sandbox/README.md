# Drive sandbox

## Why this exists

To show a video thumbnail or read a PDF page, we need third-party libraries that parse untrusted file bytes. Parsers are the classic place where a malicious file turns into arbitrary code execution, and any code running in our page can read the user's session, their cookies, their IndexedDB, and every decrypted file we have in memory. It can also just `fetch()` all of that to a server we don't control.

So we don't run those libraries in our page. We run them in a box with nothing in it.

The box is an iframe with no origin, no cookies, no storage, no access to our window, and no `fetch`/XHR/WebSocket. The library inside sees exactly one thing: the bytes we hand it. If the file exploits the parser, the attacker lands in an empty room with no door.

A second, cheaper win: the library never enters the app bundle. The app only imports the _type_ of the sandboxed API, so a 2 MB video parser is downloaded only by users who actually preview a video.

## The shape of it

```
   main app (our origin)              isolated iframe (no origin)
   ────────────────────               ───────────────────────────
   facade                             sandboxed shim
     getFoo().doThing(blob)             expose({ doThing })
        │                                      │
   host/  ──── MessageChannel ────────>  sandboxed/
   (makes the iframe, sends the port)   (receives the port, answers calls)
        └──────── protocol/ ───────────────────┘
              (shared handshake + helpers)
```

Three terms:

- **host** — runs in our app. Creates the iframe, writes its CSP, hands it a `MessagePort`, and gives you back an object whose methods look normal but are really messages sent across the boundary.
- **sandboxed** — runs inside the iframe. Receives the port and publishes the API the shim registered.
- **protocol** — the handful of things both sides must agree on: the handshake message, the internal ping method, the method names the host reserves, and a helper that finds zero-copy-transferable values.

`host/`, `sandboxed/` and `protocol/` contain **no product logic**. They don't know what a video or a PDF is. All they do is build the empty room and run a phone line into it.

Product logic lives in a **consumer**, which is always a pair:

- a **sandboxed shim** (`foo.sandboxed.ts`) — the only file that executes inside the box. It imports the risky library and publishes a small API.
- a **facade** — a few lines in our app that create the sandbox and hand the typed API to call sites.

The messaging itself is [Comlink](https://github.com/GoogleChromeLabs/comlink) over a `MessageChannel`. We did not write an RPC layer; we wrote the box Comlink talks into.

## What actually happens on the first call

Worth reading once, because everything else in this module is a detail of these steps.

1. Your call site calls a method on the facade's object. Nothing exists yet — the iframe is created lazily, on first use.
2. The host builds an `<iframe sandbox="allow-scripts">` with a `srcdoc` document whose CSP is `default-src 'none'` and `connect-src 'none'`. Because there's no `allow-same-origin`, the browser gives the frame an _opaque_ origin: same-origin checks against our app always fail, and it gets no cookies and no storage.
3. The host waits for the frame to load, fetches any `assets` you declared (see the WASM gotcha below), and `postMessage`s one init message into the frame, transferring the `MessagePort` and the asset bytes.
4. The sandboxed runtime inside the frame receives that message, keeps the port, and calls `Comlink.expose()` with the API the shim registered.
5. The host pings the sandboxed code to confirm it's alive, then lets your original call through. Every call has a timeout, so a hung library rejects instead of hanging your UI.
6. After 60s without calls the host tears the frame down to free the memory of an idle parser. The next call silently builds a new one. Frames created with `mount` (visible previewers) are never torn down, since the user is looking at their state.

The important consequence: **every value coming out of the box is untrusted input**. The box stops a compromised library from stealing anything, but it does not stop it from lying to you. Validate shapes on the host before using them.

## Writing a consumer

Each library becomes a **consumer** in its own folder: `packages/drive/modules/<name>/`, holding `<name>.sandboxed.ts` and the facade `<name>.ts`. The `<name>` is a camelCase string such as `pdfPreview`. It ties together the sandboxed filename, the built bundle filename and the string passed to `createSandboxedLibrary`, and it must be unique across `packages/drive/modules/**/*.sandboxed.ts` (the build fails otherwise). The design rules come from [ADR 0001](./docs/adr/0001-rules-for-adding-a-library.md).

### The sandboxed shim: `<name>.sandboxed.ts`

```ts
import { parse } from '<library>';

import { expose } from '../sandbox/sandboxed';

const api = {
    async getInfo(file: Blob): Promise<{ pageCount: number }> {
        const result = await parse(await file.arrayBuffer());
        return { pageCount: result.pages.length };
    },
};

export type PdfPreviewApi = typeof api;

expose(api);
```

You don't register it anywhere. `SandboxedLibrariesPlugin` (`webpack/`) finds every `*.sandboxed.ts` in this package, bundles each one on its own with esbuild, and emits it into `/assets/` during the normal app build. In production the filename is content-hashed and the build injects a name-to-filename manifest that `createSandboxedLibrary` reads, so a deploy never leaves a stale sandboxed library in a cache.

The plugin is wired once per app, in its webpack config. Drive already has it; another app that starts using a Drive sandbox adds one line:

```ts
new SandboxedLibrariesPlugin({ hash: webpackOptions.isProduction }),
```

Keep the shim thin:

- Inputs are `Blob` only (see Gotchas).
- Return plain data, `Blob`, `ArrayBuffer` or `ImageBitmap`, small and flat.
- Don't name a method `ready`, `destroy`, `isSupported` or `then`. The host answers those itself, and `expose` won't compile with them.
- No product logic: call the library and shape its result.

### The facade: `<name>.ts`

```ts
import { z } from 'zod';

import { createSandboxedLibrary } from '../sandbox/createSandboxedLibrary';
import type { PdfPreviewApi } from './pdfPreview.sandboxed';

export const pdfInfoSchema = z.object({
    pageCount: z.number().int().nonnegative().max(100_000),
});

let instance: ReturnType<typeof createSandboxedLibrary<PdfPreviewApi>> | undefined;
const getSandbox = () => (instance ??= createSandboxedLibrary<PdfPreviewApi>('pdfPreview'));

export const isPdfPreviewSupported = () => getSandbox().isSupported();

export const getPdfInfo = async (file: Blob) => pdfInfoSchema.parse(await getSandbox().getInfo(file));
```

`createSandboxedLibrary('pdfPreview')` is the opinionated wrapper: it loads the sandboxed code from our own `/assets/` with Drive's standard CSP, so you don't re-decide security per consumer. Note the `import type`: that's what keeps the library out of the app bundle and out of our page. A value import would run the library in our origin, so ESLint rejects any non-type import of a `*.sandboxed` file.

**Every returned value goes through a zod schema.** `getInfo` is typed `Promise<{ pageCount: number }>`, but the compiler can't keep that promise: the value crossed a `postMessage` boundary and nothing verified its shape. A working parser faithfully reports whatever a hostile file told it, so anything a sandboxed library returns is attacker-influenced. Give every number and string a `.max()`, especially if it reaches the DOM, a URL, a filename or an allocation size. Call sites only see `z.infer<typeof schema>`.

The memoized instance is enough for most consumers, since the host rebuilds an idle frame on the next call. A `mount`ed previewer also needs a `destroy` export that clears the memo, because `destroy()` is permanent:

```ts
export const destroyPdfPreview = () => {
    instance?.destroy();
    instance = undefined;
};
```

Reach for `createSandbox` from `host/` directly only if Drive's defaults genuinely don't fit — a visible previewer (`mount`), or a sandboxed library served from its own origin.

### Calling it

```ts
if (await isPdfPreviewSupported()) {
    const { pageCount } = await getPdfInfo(file);
}
```

`isSupported()` never throws: it just reports whether the box came up and the sandboxed code answered. Use it to pick a fallback path rather than wrapping calls in try/catch.

## Security rules

A change that touches any of these needs a second reviewer.

1. `sandbox="allow-scripts"` with **no** `allow-same-origin`. Adding both together silently disables the whole sandbox — the frame gets our real origin back.
2. The origin stays opaque (`srcdoc`) or a dedicated subdomain. Never the app origin.
3. `connect-src 'none'` stays. It is the exfiltration guard: it blocks `fetch`, XHR and WebSocket.
    - It is **not** a full network block. The sandboxed code can still navigate itself to an outside URL, and CSP doesn't cover WebRTC. Only the app's server-side `frame-src`, or a dedicated sandbox origin, closes those.
    - It may be narrowed to explicit `https://` origins, never widened. `createSandboxIframe` throws on `*` (also inside an origin like `https://*`), a bare scheme, `'self'` and plain `http://`.
    - `img-src`, `style-src` and `font-src` are also a way out (`new Image().src = 'https://evil/?d=…'`), so they are fixed to `'none'`. `script-src` can't be overridden either.
4. Only the content of the node being previewed goes in, as a `Blob`. The host decides what the sandboxed code gets, and the sandboxed code never requests anything from the app. Library files come in through `assets`. No tokens, no keys, no app state.
5. Everything returned is validated on the host before use.

## Gotchas

- **WASM libraries can't fetch their own `.wasm`.** `connect-src 'none'` blocks it, by design. Don't relax the CSP: declare the file in the `assets` option and read it inside the sandboxed code with `getAsset()`. The host fetches it from our own origin and transfers the bytes in. Pure-JS or WebCodecs libraries need none of this.
- **`requestAnimationFrame` never fires in a hidden frame.** A compute sandbox is `display: none`, and browsers don't paint it, so a library that paces work on rAF (pdf.js does) hangs forever. Shim it to `setTimeout` at the top of the sandboxed code.
- **No web workers.** `worker-src` falls back to our nonce-based `script-src`, so `new Worker(blobUrl)` is blocked. Note the iframe is **not** off the app's main thread: in Safari, Firefox, and Chrome without sandboxed-iframe isolation, it shares our event loop. A CPU-bound loop in the sandboxed code freezes the UI, and the call timeout can't fire until it yields. A call that does time out drops the frame, so the next call gets a fresh one.
- **Bytes go in as a `Blob`, never an `ArrayBuffer` or typed array.** A `Blob` is a handle, not the bytes: a 500 MB PDF is never copied, and your data stays usable after the call. `expose()` fails to compile if a method takes raw bytes (even nested), and the host throws if one slips through at runtime. Have a small raw buffer? Wrap it: `new Blob([bytes])` copies only the bytes the view covers. Have the file as a `Blob`? Pass `file.slice(start, end)`, which copies nothing. Streams and ports can't be copied, so those move.
- **Return values move, they don't copy:** `ArrayBuffer`, `ImageBitmap`, `MessagePort`, `ReadableStream` and `OffscreenCanvas` are detected automatically and transferred zero-copy, which means the sandboxed code loses its reference. `Blob` and `File` are structured-cloned, but that's cheap (the bytes stay where they are), so pass them straight through.

## Testing

```bash
pnpm --filter @proton/drive test modules/sandbox
```

`host/index.test.ts` and `protocol/index.test.ts` cover the parts that are ours: how the iframe and its CSP get built, and the transferable/handshake helpers. The iframe tests are there to catch someone editing the isolation attributes away — which is the realistic regression, and a silent one.

What they can't cover is whether the browser _honours_ any of it. jsdom implements neither CSP nor opaque origins, so a passing `connect-src` assertion there would only prove jsdom ignores CSP. Enforcement needs a real browser running a deliberately hostile sandboxed library that tries to escape and fails. **That suite doesn't exist yet.** Whether a feature needs one before shipping is the call of the team that owns it ([ADR 0001](./docs/adr/0001-rules-for-adding-a-library.md), decision 4).

## API reference

### `host/` — `createSandbox<T>(options): SandboxRemote<T>`

| Option | Meaning |
| --- | --- |
| `sandboxed` | Where the sandboxed code comes from: `{ kind: 'inline', code }` (a bundled string embedded in the srcdoc, zero network), `{ kind: 'script', url }` (a pre-built same-origin bundle via `<script src>`; `script-src` is scoped to that exact file and `connect-src` stays `'none'`), or `{ kind: 'url', url }` (a whole document on a dedicated sandbox origin). |
| `csp` | Narrow the sandboxed code's CSP. `connectSrc` defaults to `'none'`. |
| `assets` | `name -> same-origin URL`. The host fetches the bytes and transfers them in; the sandboxed code reads them with `getAsset(name)`. |
| `mount` | Render the frame **visibly** inside this element, for previewers. Isolation is identical; only display changes. Idle teardown defaults to off, so you own the lifetime via `destroy()`. Omit it for a hidden compute frame. |
| `timeoutMs` | Per-call timeout. Default 30s. |
| `handshakeTimeoutMs` | How long to wait for the sandboxed code to answer its first ping. Default 15s. |
| `idleTimeoutMs` | Tear the frame down after this much inactivity; the next call rebuilds it. Default 60s, or 0 (disabled) when `mount` is set. |
| `name` | Debug label, used as the iframe title. |

`SandboxRemote<T>` turns each method `(args) => R` into `(args) => Promise<Awaited<R>>`, and adds:

- `ready` — resolves once the handshake is done.
- `destroy()` — permanent. Anything in flight rejects immediately, and later calls reject too. Clear your memoized instance alongside it.
- `isSupported()` — brings the box up and reports whether the sandboxed code answered. Never throws.

### `sandboxed/`

```ts
function expose<T>(api: T): void; // publish the API — call once
function getAsset(name: string): Promise<ArrayBuffer>; // bytes the host transferred in
function transfer<T>(value: T, list: Transferable[]): T; // override auto-transfer (rare)
```
