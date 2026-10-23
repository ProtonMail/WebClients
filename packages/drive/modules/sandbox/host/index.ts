/**
 * The app side of the sandbox.
 *
 * `createSandbox()` gives you back an object that looks like the sandboxed code's API,
 * but each method call is really a message sent into a locked-down iframe. The
 * iframe is created on the first call, not here, and torn down again once it
 * goes unused.
 *
 * This file owns the box: making the iframe, writing its CSP, handing it a
 * message port, fetching asset bytes on its behalf, timing out calls, and
 * lifecycle. Comlink owns the actual messaging. There is no product logic here
 * — nothing in this file knows what a video or a PDF is. See ../README.md.
 */
import * as Comlink from 'comlink';

import type { SandboxedApi } from '../protocol';
import { INTERNAL_PING, RESERVED_METHOD_NAMES, SANDBOX_PROTOCOL_VERSION } from '../protocol';

interface CspOptions {
    /** Exfiltration guard. Defaults to `'none'`; may be narrowed, never removed. */
    connectSrc: string;
}

export interface CreateSandboxOptions {
    /**
     * How to load the sandboxed bundle:
     * - `inline`: embed a pre-bundled string in the srcdoc (no network in the frame).
     * - `script`: load a pre-built same-origin bundle via `<script src>` in the srcdoc;
     *   `script-src` is scoped to that exact file, `connect-src` stays `'none'`.
     * - `url`: point the frame at a full document on a dedicated sandbox origin.
     */
    sandboxed: { kind: 'inline'; code: string } | { kind: 'script'; url: string } | { kind: 'url'; url: string };
    /** Content Security Policy for the sandboxed document. Secure defaults applied. */
    csp?: Partial<CspOptions>;
    /** Assets the host fetches (same-origin, trusted) and transfers in, name -> URL. */
    assets?: Record<string, string>;
    /**
     * Mount the frame VISIBLY inside this element (previewers/renderers). The
     * frame fills the element and the sandboxed code renders into its own DOM, which is
     * what the user sees. Isolation is unchanged — opaque origin, `allow-scripts`
     * only, and the CSP all still hold; only display differs. When set, idle
     * teardown defaults to off, since a visible frame must outlive inactivity;
     * the caller owns its lifetime via `destroy()`. Omit for a headless compute
     * frame (the default), which stays hidden.
     */
    mount?: HTMLElement;
    /** Per-call timeout in ms. Default 30_000. */
    timeoutMs?: number;
    /** Handshake timeout in ms. Default 15_000. */
    handshakeTimeoutMs?: number;
    /** Tear the frame down after this idle period; transparently reconnects. 0 disables. Default 60_000. */
    idleTimeoutMs?: number;
    /** Debug label, used for the iframe title. */
    name?: string;
}

type Promisify<T> = T extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;

type Remote<T> = {
    [K in keyof T]: Promisify<T[K]>;
};

export type SandboxRemote<T> = Remote<T> & {
    /** Resolves once the sandboxed code has completed the handshake. */
    readonly ready: Promise<void>;
    /** Tears down the frame permanently. Further calls reject. */
    destroy(): void;
    /** True if the sandbox spins up and the sandboxed code answers; never throws. */
    isSupported(): Promise<boolean>;
    [Symbol.dispose](): void;
};

const RESERVED = new Set<string>(RESERVED_METHOD_NAMES);

interface Connection {
    iframe: HTMLIFrameElement;
    port: MessagePort;

    remote: Comlink.Remote<any>;
}

function makeNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * `connect-src` is the one directive that stops a compromised sandboxed library from
 * phoning home, so it is the one we refuse to let a caller loosen. `'none'` or
 * an explicit `https://` origin list is fine; a wildcard or a bare scheme is
 * not. Without this the "never widened" rule lived only in the README, where a
 * single plausible-looking `connectSrc: '*'` would quietly undo the sandbox.
 */
function assertConnectSrcIsNarrow(connectSrc: string): void {
    const sources = connectSrc.trim().split(/\s+/);
    const isNarrow = sources.every(
        (source) => source === "'none'" || (source.startsWith('https://') && !/[*;"]/.test(source))
    );
    if (!isNarrow) {
        throw new Error(
            `Sandbox connect-src must be 'none' or an explicit https:// origin list, got "${connectSrc}". ` +
                `Widening it defeats the sandbox — pass the bytes in via the "assets" option instead.`
        );
    }
}

function buildCsp(overrides: Partial<CspOptions> | undefined, scriptSrc: string): string {
    const connectSrc = overrides?.connectSrc ?? "'none'";
    assertConnectSrcIsNarrow(connectSrc);
    return [
        `default-src 'none'`,
        `script-src ${scriptSrc}`,
        `connect-src ${connectSrc}`,
        `img-src 'none'`,
        `style-src 'none'`,
        `font-src 'none'`,
    ].join('; ');
}

function buildInlineSrcdoc(csp: string, nonce: string, code: string): string {
    // Escape every `</script` (the tokenizer also closes on `</script `, `</script/`, …)
    // so an inlined bundle cannot break out of the tag.
    const safeCode = code.replace(/<\/(script)/gi, '<\\/$1');
    return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}"><script nonce="${nonce}">${safeCode}</script></head><body></body></html>`;
}

function buildScriptSrcdoc(csp: string, scriptUrl: string): string {
    return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}"><script src="${scriptUrl}"></script></head><body></body></html>`;
}

async function fetchAssets(assets: Record<string, string> | undefined): Promise<Record<string, ArrayBuffer>> {
    if (!assets) {
        return {};
    }
    const entries = await Promise.all(
        Object.entries(assets).map(async ([name, url]) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch sandbox asset "${name}": ${response.status}`);
            }
            return [name, await response.arrayBuffer()] as const;
        })
    );
    return Object.fromEntries(entries);
}

async function withTimeout<V>(promise: Promise<V>, ms: number, message: string, onTimeout?: () => void): Promise<V> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(message));
            onTimeout?.();
        }, ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
};

/**
 * Find what must move into the sandboxed code: streams, ports and canvases can't be
 * copied. Raw bytes are refused, pass a Blob instead: a Blob is a handle, so a
 * big file is never copied and the caller's data is never emptied.
 */
export function collectSandboxedTransfers(
    value: unknown,
    transferables: Transferable[] = [],
    depth = 0
): Transferable[] {
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        throw new Error('Sandbox arguments cannot be an ArrayBuffer or typed array, pass a Blob instead');
    }
    if (
        (typeof MessagePort !== 'undefined' && value instanceof MessagePort) ||
        (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) ||
        (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas)
    ) {
        transferables.push(value);
    } else if (depth < 6 && Array.isArray(value)) {
        value.forEach((item) => collectSandboxedTransfers(item, transferables, depth + 1));
    } else if (depth < 6 && isPlainObject(value)) {
        Object.values(value).forEach((item) => collectSandboxedTransfers(item, transferables, depth + 1));
    }
    return transferables;
}

/**
 * Build the iframe that becomes the box — but don't put it in the page yet.
 *
 * Every line in here is load-bearing for isolation: `allow-scripts` with no
 * `allow-same-origin` is what makes the browser hand the frame an opaque origin,
 * and the CSP is what keeps it mute. It lives on its own, separate from the
 * async connect dance, so a test can assert on the result directly instead of
 * having to stand up a whole working sandboxed library to check an attribute.
 */
export function createSandboxIframe(options: CreateSandboxOptions): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    // Both flags together would silently cancel the sandbox out and hand the
    // frame our real origin back. Never add `allow-same-origin`.
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', options.name ? `sandbox:${options.name}` : 'sandbox');
    if (options.mount) {
        // Visible previewer: fill the mount, no chrome.
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
    } else {
        // Headless compute frame: never shown.
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.display = 'none';
    }

    const { sandboxed } = options;
    if (sandboxed.kind === 'inline') {
        const nonce = makeNonce();
        const scriptSrc = `'nonce-${nonce}' 'wasm-unsafe-eval'`;
        iframe.srcdoc = buildInlineSrcdoc(buildCsp(options.csp, scriptSrc), nonce, sandboxed.code);
    } else if (sandboxed.kind === 'script') {
        const scriptUrl = new URL(sandboxed.url, window.location.href);
        // The exact file, not the whole origin: an origin-wide script-src would
        // let the sandboxed code send GETs to any path on our origin via <script src>.
        const scriptSrc = `${scriptUrl.origin}${scriptUrl.pathname} 'wasm-unsafe-eval'`;
        iframe.srcdoc = buildScriptSrcdoc(buildCsp(options.csp, scriptSrc), scriptUrl.href);
    } else {
        iframe.src = sandboxed.url;
    }

    return iframe;
}

export function createSandbox<T extends SandboxedApi>(options: CreateSandboxOptions): SandboxRemote<T> {
    const timeoutMs = options.timeoutMs ?? 30_000;
    const handshakeTimeoutMs = options.handshakeTimeoutMs ?? 15_000;
    // A visible frame must outlive inactivity, so idle teardown is off by
    // default when mounted; a headless compute frame reaps after 60s.
    const idleTimeoutMs = options.idleTimeoutMs ?? (options.mount ? 0 : 60_000);

    let connectionPromise: Promise<Connection> | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = 0;
    let disposed = false;
    // Tearing the frame down closes the port, and a closed port never delivers
    // the reply Comlink is waiting for — so without these an in-flight call
    // would sit there until its 30s timeout fired. We keep each call's reject
    // handle and settle them ourselves.
    const inFlightRejects = new Set<(error: Error) => void>();

    const clearIdle = (): void => {
        if (idleTimer) {
            clearTimeout(idleTimer);
            idleTimer = undefined;
        }
    };

    const teardown = (): void => {
        clearIdle();
        // Idle teardown only ever runs with nothing in flight, so in practice
        // this fires for `destroy()` and for a call that timed out.
        inFlightRejects.forEach((reject) => reject(new Error('Sandbox was destroyed mid-call')));
        inFlightRejects.clear();
        const pending = connectionPromise;
        connectionPromise = undefined;
        void pending
            ?.then((connection) => {
                connection.port.close();
                connection.iframe.remove();
            })
            .catch(() => {});
    };

    const scheduleIdle = (): void => {
        if (!idleTimeoutMs || disposed) {
            return;
        }
        clearIdle();
        idleTimer = setTimeout(() => {
            if (inFlight > 0) {
                scheduleIdle();
                return;
            }
            teardown();
        }, idleTimeoutMs);
    };

    /**
     * Bring the box up. The steps, in order:
     *
     * 1. build the iframe (see `createSandboxIframe`)
     * 2. wait for it to load, then fetch whatever assets the caller declared
     * 3. postMessage one init message in, handing over the port + asset bytes
     * 4. ping the sandboxed code, so we only return once we know someone is listening
     */
    const connect = async (): Promise<Connection> => {
        const iframe = createSandboxIframe(options);
        const channel = new MessageChannel();

        // Everything from here on can throw, and by then the frame is in the
        // DOM with a sandboxed library running in it. Without this cleanup a failed
        // handshake orphans a live frame, and the next attempt adds another.
        try {
            await new Promise<void>((resolve, reject) => {
                iframe.addEventListener('load', () => resolve(), { once: true });
                iframe.addEventListener('error', () => reject(new Error('Sandbox iframe failed to load')), {
                    once: true,
                });
                (options.mount ?? document.body).appendChild(iframe);
            });

            const contentWindow = iframe.contentWindow;
            if (!contentWindow) {
                throw new Error('Sandbox iframe has no content window');
            }

            const assets = await fetchAssets(options.assets);
            // targetOrigin '*' is safe: an opaque origin cannot be named, and the
            // capability is the port — only this frame receives it.
            contentWindow.postMessage({ type: 'sandbox-init', version: SANDBOX_PROTOCOL_VERSION, assets }, '*', [
                channel.port2,
                ...Object.values(assets),
            ]);

            const remote = Comlink.wrap<any>(channel.port1);

            // Confirm the sandboxed code is alive before handing the proxy back.
            await withTimeout(
                (remote[INTERNAL_PING] as () => Promise<boolean>)(),
                // The sandboxed code going quiet almost always means it never answered at
                // all rather than answered slowly — usually it threw before
                // reaching `expose()`. Say so; the bare "timed out" sent people
                // looking at the network for what is a sandbox-side crash.
                handshakeTimeoutMs,
                `Sandbox "${options.name ?? 'unnamed'}" handshake timed out — the sandboxed code never answered. ` +
                    `Most likely it threw before calling expose(); check the frame's console.`
            );

            return { iframe, port: channel.port1, remote };
        } catch (error) {
            iframe.remove();
            channel.port1.close();
            throw error;
        }
    };

    const ensureConnected = (): Promise<Connection> => {
        if (disposed) {
            return Promise.reject(new Error('Sandbox has been destroyed'));
        }
        if (!connectionPromise) {
            // An idle timer left from the previous frame would tear this one
            // down while it is still connecting.
            clearIdle();
            connectionPromise = connect()
                .then((connection) => {
                    // Arm teardown on connect, not just after a call. `ready` and
                    // `isSupported()` bring a frame up without calling a method,
                    // and would otherwise hold it open forever.
                    scheduleIdle();
                    return connection;
                })
                .catch((error) => {
                    connectionPromise = undefined;
                    throw error;
                });
        }
        return connectionPromise;
    };

    const call = async (method: string, args: unknown[]): Promise<unknown> => {
        const pending = ensureConnected();
        const connection = await pending;
        // `destroy()` or another call's timeout may have torn this frame down
        // while we waited for it; its port is closed and would never answer.
        if (connectionPromise !== pending) {
            throw new Error('Sandbox was destroyed mid-call');
        }
        clearIdle();
        inFlight += 1;
        let rejectOnDestroy: (error: Error) => void = () => {};
        const destroyed = new Promise<never>((_, reject) => {
            rejectOnDestroy = reject;
        });
        inFlightRejects.add(rejectOnDestroy);
        try {
            const transferArgs = args.map((arg) => {
                const transferables = collectSandboxedTransfers(arg);
                return transferables.length ? Comlink.transfer(arg as object, transferables) : arg;
            });
            return await Promise.race([
                withTimeout(
                    (connection.remote[method] as (...a: unknown[]) => Promise<unknown>)(...transferArgs),
                    timeoutMs,
                    `Sandbox call "${method}" timed out`,
                    // A timed-out sandboxed library is likely stuck on a hostile file. Drop it
                    // so the next call gets a fresh frame instead of the busy one.
                    () => {
                        // Leave this call out of the teardown, so it reports the timeout.
                        inFlightRejects.delete(rejectOnDestroy);
                        if (connectionPromise === pending) {
                            teardown();
                        }
                    }
                ),
                destroyed,
            ]);
        } finally {
            inFlightRejects.delete(rejectOnDestroy);
            inFlight -= 1;
            scheduleIdle();
        }
    };

    const controls = {
        get ready(): Promise<void> {
            return ensureConnected().then(() => undefined);
        },
        destroy(): void {
            disposed = true;
            teardown();
        },
        async isSupported(): Promise<boolean> {
            try {
                await ensureConnected();
                return true;
            } catch {
                return false;
            }
        },
    };

    // We can't know the sandboxed code's method names at build time, so instead of an
    // object we return a Proxy: reading `.doThing` off it produces a function
    // that sends "doThing" across the boundary. `ready` / `destroy` /
    // `isSupported` are ours and answered locally, which is why a sandboxed API may
    // not use those names.
    return new Proxy(controls, {
        get(target, prop, receiver) {
            if (prop === Symbol.dispose) {
                return () => controls.destroy();
            }
            if (typeof prop === 'symbol' || RESERVED.has(prop)) {
                return Reflect.get(target, prop, receiver);
            }
            return (...args: unknown[]) => call(prop, args);
        },
    }) as unknown as SandboxRemote<T>;
}
