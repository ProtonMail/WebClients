# FileSaver & Download Service

This document explains how Drive decides which download mechanism to use, how data flows from the app to the browser, and what trade-offs come with each path.

## Overview

1. The download pipeline produces a `ReadableStream<Uint8Array>` for each file or archive (see `architecture.md`).
2. `FileSaver.instance.saveAsFile(stream, meta, log)` picks the most suitable persistence strategy based on the item size and runtime capabilities (`fileSaver.ts`).
3. The chosen strategy eventually hands the data to the browser using one of:
    - in-memory buffering + [`file-saver`](https://github.com/eligrey/FileSaver.js)
    - Origin Private File System (OPFS)
    - a streaming Service Worker

## Mechanism selection

```ts
// applications/drive/src/app/store/_downloads/fileSaver/fileSaver.ts
async selectMechanismForDownload(size?: number) {
    const cookie = getCookie('DriveE2EDownloadMechanism');
    if (cookie && ['memory', 'opfs', 'sw'].includes(cookie)) {
        return cookie as 'memory' | 'opfs' | 'sw';
    }

    const limit = getMemoryLimit();
    if (size && size < limit) {
        return 'memory';
    }

    if ((await isOPFSSupported()) && this.useSWFallback === false && (await hasEnoughOPFSStorage(size))) {
        return 'opfs';
    }

    if (isServiceWorkersSupported()) {
        return 'sw';
    }

    this.useBlobFallback = true;
    return 'memory_fallback';
}
```

- Feature flags (via `unleashVanillaStore`) tune `getMemoryLimit()` to lower thresholds on mobile or raise them for high-memory cohorts.
- QA can force a specific path with the `DriveE2EDownloadMechanism` cookie.
- When no advanced mechanism is available, we trigger the `memory_fallback` path and stream into a Blob.

## In-memory buffer

`saveViaBuffer` collects every chunk into an array, builds a `Blob`, and calls the shared `downloadFile` helper.

```ts
const chunks = await streamToBuffer(stream);
downloadFile(new Blob(chunks, { type: meta.mimeType }), meta.filename);
```

This path is simple but bounded by `getMemoryLimit()`. Exceeding it either pushes us to OPFS or sets `useBlobFallback`, so the caller can display the right warning via `wouldExceeedMemoryLimit`.

## OPFS (Origin Private File System)

OPFS lets Chromium-based browsers stream data directly to an origin-scoped file without buffering. The implementation lives in `saveViaOPFS` and uses the File System Access API:

```ts
const root = await navigator.storage.getDirectory();
const fileHandle = await root.getFileHandle(meta.filename, { create: true });
const writable = await fileHandle.createWritable();

const reader = stream.getReader();
while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await writable.write(value);
}
await writable.close();

const file = await fileHandle.getFile();
downloadFile(file, meta.filename);
```

### Browser support and limits

- **Chrome / Edge**: OPFS is fully supported on desktop. Storage quota is shared with other origin storage. We call `navigator.storage.estimate()` and require _twice_ the file size to be available because moving a file to the user-visible filesystem temporarily duplicates it (`hasEnoughOPFSStorage`).
- **Firefox**: As of Firefox 124–126, OPFS support is behind an unstable implementation. `navigator.storage.getDirectory()` is known to throw `SecurityError` (see [Bug 1875283](https://bugzilla.mozilla.org/show_bug.cgi?id=1875283) and [Bug 1942530](https://bugzilla.mozilla.org/show_bug.cgi?id=1942530)). Our `isOPFSSupported` helper catches these errors and falls back to the Service Worker path immediately, preventing user-visible failures.
- **Safari and mobile browsers**: OPFS is not available (especially on iOS). We explicitly gate on `!isSafari() && !isMobile()` before opting in.

When OPFS succeeds we schedule a clean-up of the temporary entry, accounting for large files by adding one second of grace for every ~30 MB.

### Fallback logic

If acquiring the directory or creating the writable stream fails, we mark `useSWFallback = true` and re-enter the Service Worker flow. Users still get a streamed download, just without OPFS performance benefits.

## Streaming Service Worker

When OPFS is unavailable, `saveViaDownload` streams bytes into a dedicated Download Service Worker. Initialization is guarded by a 15s timeout to avoid hanging on browsers with broken SW support.

```ts
await promiseWithTimeout({ timeoutMs: 15_000, promise: initDownloadSW() });
const saveStream = await openDownloadStream(meta, { onCancel: () => abortController.abort() });
await stream.pipeTo(saveStream, { preventCancel: true });
```

### Main thread helper

`openDownloadStream` sets up a `MessageChannel`, converts one port into a `WritableStream`, and forwards chunks to the worker:

```ts
const channel = new MessageChannel();
const stream = new WritableStream({
    write(block) {
        channel.port1.postMessage({ action: 'download_chunk', payload: block });
    },
    close() {
        channel.port1.postMessage({ action: 'end' });
    },
});

worker.postMessage({ action: 'start_download', payload: meta }, [channel.port2]);
```

Once the worker replies with `download_started`, we inject a hidden `<iframe>` pointing at `/sw/{id}`. That navigation triggers the browser’s native download UI.

### Service Worker role

`downloadSW.ts` listens for `start_download`, stores the stream in `pendingDownloads`, and serves it back when `/sw/{id}` is fetched:

```ts
if (data?.action === 'start_download') {
    const id = this.generateUID().toString();
    const port = event.ports[0];

    this.pendingDownloads.set(id, {
        stream: createDownloadStream(port),
        filename,
        mimeType,
        size,
    });

    const downloadUrl = new URL(`/sw/${id}`, self.registration.scope);
    port.postMessage({ action: 'download_started', payload: downloadUrl.toString() });
}
```

On fetch:

```ts
const pending = this.pendingDownloads.get(id);
const headers = new Headers({
    ...(size ? { 'Content-Length': `${size}` } : {}),
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    ...SECURITY_HEADERS,
});

return event.respondWith(new Response(stream, { headers }));
```

The worker also answers `GET /sw/ping` so the main page can keep it alive. If the worker disappears, `wakeUpServiceWorker` re-registers it before continuing.

## Operational notes

- `TransferMeta` carries the file name, mime type, and optionally the size for accurate headers and quota checks (`components/TransferManager/transfer.ts`).
- `FileSaver.instance.wouldExceeedMemoryLimit(size)` lets the UI warn users before starting a large download.
- Logging hooks (`log: LogCallback`) surface mechanism decisions and fallback reasons in the transfer manager, aiding support investigations.

## Quick reference

| Mechanism | When used | Pros | Cons |
| --- | --- | --- | --- |
| Memory buffer | `size < getMemoryLimit()` or no advanced APIs | Simple, robust | Tied to RAM limits; large files slow |
| OPFS | Chromium desktop with enough quota | Streams directly, low memory usage | Not on Safari/mobile; Firefox bugs fall back |
| Service Worker | Default fallback | Streams large files, works cross-browser | Requires SW support; more moving parts |
