/**
 * The code that runs INSIDE the box.
 *
 * A sandboxed shim (`foo.sandboxed.ts`) imports one risky library and calls `expose()`
 * with the small API it wants to offer the app. This file is the plumbing under
 * that: it waits for the host's init message, keeps the message port and asset
 * bytes that arrive with it, and publishes the API over Comlink.
 *
 * Two things have to happen before we can publish, and they can happen in
 * either order — the shim calling `expose()`, and the host's init message
 * landing. So both paths call `maybeExpose()` and whichever finishes last wins.
 *
 * No product logic here either. See ../README.md.
 */
import * as Comlink from 'comlink';

import type { BlobOnlyApi, NoReservedNamesApi, SandboxedApi } from '../protocol';
import { INTERNAL_PING, collectTransferables, isInitMessage } from '../protocol';

type AnyApi = Record<string, (...args: any[]) => any>;

let api: AnyApi | undefined;
let port: MessagePort | undefined;
let exposed = false;

const assets = new Map<string, ArrayBuffer>();
const explicitTransfers = new WeakMap<object, Transferable[]>();

let resolveAssets: () => void = () => {};
const assetsReceived = new Promise<void>((resolve) => {
    resolveAssets = resolve;
});

/** Move big return values (ArrayBuffer, ImageBitmap, …) instead of copying them. */
const withAutoTransfer = (method: (...args: unknown[]) => unknown) => {
    return async (...args: unknown[]): Promise<unknown> => {
        const result = await method(...args);
        const transferables = collectTransferables(result, explicitTransfers);
        return transferables.length ? Comlink.transfer(result as object, transferables) : result;
    };
};

/** Publish the API, but only once we have both a port and an API to publish. */
const maybeExpose = (): void => {
    if (exposed || !api || !port) {
        return;
    }
    exposed = true;

    const wrapped: AnyApi = {
        [INTERNAL_PING]: () => true,
    };
    Object.entries(api).forEach(([name, method]) => {
        wrapped[name] = withAutoTransfer(method.bind(api));
    });

    Comlink.expose(wrapped, port);
};

if (typeof window !== 'undefined') {
    window.addEventListener('message', (event: MessageEvent) => {
        // Accept exactly one init, and only from the parent. Sibling frames can
        // reach us through `parent.frames` and race the host with a fake init.
        if (event.source !== window.parent || !isInitMessage(event.data) || port) {
            return;
        }
        const [transferredPort] = event.ports;
        if (!transferredPort) {
            return;
        }
        Object.entries(event.data.assets ?? {}).forEach(([name, buffer]) => assets.set(name, buffer));
        port = transferredPort;
        resolveAssets();
        maybeExpose();
    });
}

/**
 * Register the API this sandboxed code offers to the host. The object's type becomes the
 * host's `Remote<T>`. Call once, near the top of the sandboxed shim.
 */
export function expose<T extends SandboxedApi>(exposedApi: T & BlobOnlyApi<T> & NoReservedNamesApi<T>): void {
    api = exposedApi as AnyApi;
    maybeExpose();
}

/**
 * Retrieve asset bytes the host fetched and transferred in during handshake.
 * Async because the bytes arrive via postMessage; resolves once init lands.
 */
export async function getAsset(name: string): Promise<ArrayBuffer> {
    await assetsReceived;
    const buffer = assets.get(name);
    if (!buffer) {
        throw new Error(`Sandbox asset not provided: ${name}`);
    }
    return buffer;
}

/**
 * Mark a return value's transferables for zero-copy transfer. Usually
 * unnecessary — the runtime auto-detects ArrayBuffer / ImageBitmap / MessagePort
 * / ReadableStream / OffscreenCanvas. Use this only to override that detection.
 */
export function transfer<T>(value: T, transferables: Transferable[]): T {
    if (value && typeof value === 'object') {
        explicitTransfers.set(value as object, transferables);
    }
    return value;
}
