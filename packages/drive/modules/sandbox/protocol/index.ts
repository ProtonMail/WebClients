/**
 * The small set of things the app side and the box side must agree on.
 *
 * Comlink handles the calls themselves once a port exists, so all that is left
 * is getting the port in there in the first place: one init message, the ping
 * method name we reserve for our own use, and a helper both sides use to spot
 * values that can be moved rather than copied.
 */

export const SANDBOX_PROTOCOL_VERSION = 1;

/**
 * Shape of any API a sandboxed library can expose: an object of methods. The concrete type
 * a consumer passes to `expose()` is what drives the host's typed `Remote<T>`.
 */

export type SandboxedApi = Record<string, (...args: any[]) => any>;

type RawBytes = ArrayBuffer | SharedArrayBuffer | ArrayBufferView;

type NoRawBytes<T> = T extends RawBytes
    ? never
    : T extends Blob | ReadableStream | MessagePort
      ? T
      : T extends object
        ? { [K in keyof T]: NoRawBytes<T[K]> }
        : T;

/**
 * Bytes go into the sandboxed code as a Blob only. A Blob is a handle: a big file is
 * never copied, and the caller's data is never emptied by the move. Any method
 * taking an ArrayBuffer or typed array (even nested) turns into this error
 * message, so `expose()` fails to compile.
 */
export type BlobOnlyApi<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => any
        ? A extends NoRawBytes<A>
            ? T[K]
            : 'Sandbox arguments must be a Blob, not an ArrayBuffer or typed array'
        : T[K];
};

export const RESERVED_METHOD_NAMES = ['ready', 'destroy', 'isSupported', 'then'] as const;

type ReservedMethodName = (typeof RESERVED_METHOD_NAMES)[number];

/**
 * The host answers these method names itself, so a sandboxed method with one of
 * them would never be reached. Naming one turns it into this error message, so
 * `expose()` fails to compile.
 */
export type NoReservedNamesApi<T> = {
    [K in keyof T]: K extends ReservedMethodName ? 'Sandbox method name is reserved by the host' : T[K];
};

/**
 * Reserved method names the runtime adds to every exposed API. Consumers must
 * not use these keys. Kept deliberately unlikely to collide.
 */
export const INTERNAL_PING = '__sandbox_ping__';

/**
 * Sent host -> sandboxed code once, on the frame's `window`, carrying the Comlink
 * `MessagePort` and any asset bytes the host fetched on the sandboxed code's behalf.
 * The port and the asset `ArrayBuffer`s are transferred, not cloned.
 */
export interface InitMessage {
    type: 'sandbox-init';
    version: number;
    assets: Record<string, ArrayBuffer>;
}

/**
 * A version mismatch means the two sides were built from different code. In
 * production that shouldn't be reachable — sandboxed filenames are content-hashed,
 * so new app code can't be handed an old sandboxed library — which leaves local mixtures of
 * built output. We ignore the message rather than try to adapt: the host's
 * handshake then times out and the caller takes its fallback path, which beats
 * speaking a protocol the sandboxed code doesn't implement.
 *
 * There is only version 1, so there is nothing to negotiate yet. Whoever adds
 * version 2 has to decide here whether old sandboxed libraries are refused or supported, and
 * will want a way to say "wrong version" back to the host rather than going
 * silent and costing it the full handshake timeout.
 */
export function isInitMessage(value: unknown): value is InitMessage {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    return (
        'type' in value &&
        value.type === 'sandbox-init' &&
        'version' in value &&
        value.version === SANDBOX_PROTOCOL_VERSION
    );
}

/**
 * Look through a value for things the browser can hand over instead of copy
 * (buffers, bitmaps, streams), so a 10 MB result doesn't get duplicated on its
 * way across. Recursion is depth-capped so a weird payload can't spin here.
 *
 * `explicit` is the escape hatch behind the sandboxed code's `transfer()` helper: if an
 * object is in there, use its list and stop looking inside it.
 */
export function collectTransferables(value: unknown, explicit?: WeakMap<object, Transferable[]>): Transferable[] {
    const found = new Set<Transferable>();
    const seen = new Set<unknown>();
    const MAX_DEPTH = 6;

    const isTransferable = (v: unknown): v is Transferable => {
        return (
            v instanceof ArrayBuffer ||
            (typeof MessagePort !== 'undefined' && v instanceof MessagePort) ||
            (typeof ImageBitmap !== 'undefined' && v instanceof ImageBitmap) ||
            (typeof ReadableStream !== 'undefined' && v instanceof ReadableStream) ||
            (typeof OffscreenCanvas !== 'undefined' && v instanceof OffscreenCanvas)
        );
    };

    const walk = (value: unknown, depth: number): void => {
        if (isTransferable(value)) {
            found.add(value);
            return;
        }
        if (value === null || typeof value !== 'object' || depth > MAX_DEPTH || seen.has(value)) {
            return;
        }
        seen.add(value);

        const obj: object = value;
        const forced = explicit?.get(obj);
        if (forced) {
            forced.forEach((t) => found.add(t));
            return;
        }

        if (ArrayBuffer.isView(obj)) {
            // Only move a buffer the view fully covers. A slice of a bigger buffer
            // (pooled, or WASM memory, which can't be moved) is copied instead.
            const view = obj as ArrayBufferView;
            if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) {
                found.add(view.buffer as ArrayBuffer);
            }
            return;
        }

        if (Array.isArray(obj)) {
            (obj as unknown[]).forEach((item) => walk(item, depth + 1));
            return;
        }

        Object.values(obj as Record<string, unknown>).forEach((item) => walk(item, depth + 1));
    };

    walk(value, 0);
    return [...found];
}
