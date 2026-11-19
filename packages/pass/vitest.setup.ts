import '@testing-library/jest-dom/vitest';
import { Blob, File } from 'node:buffer';
import * as webStreams from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';
import 'core-js/actual/typed-array/from-base64';
import 'core-js/actual/typed-array/from-hex';
import 'core-js/actual/typed-array/to-base64';
import 'core-js/actual/typed-array/to-hex';

// The vm context of the test pool has its own typed arrays and lacks some Node globals: restore Node's ones,
// so that `instanceof Uint8Array` (OpenPGP) and the streams APIs keep working
{
    const VmUint8Array = Uint8Array;
    const NodeUint8Array = Object.getPrototypeOf(Buffer) as Uint8ArrayConstructor;
    const NodeArrayBuffer = Buffer.from('').buffer.constructor as ArrayBufferConstructor;
    const overrides: Record<string, unknown> = {
        Uint8Array: NodeUint8Array,
        ArrayBuffer: NodeArrayBuffer,
        TextEncoder,
        TextDecoder,
        Blob,
        File,
        ReadableStream: webStreams.ReadableStream,
        WritableStream: webStreams.WritableStream,
        TransformStream: webStreams.TransformStream,
        CompressionStream: webStreams.CompressionStream,
        DecompressionStream: webStreams.DecompressionStream,
    };
    // carry the core-js polyfills (already applied to the vm typed array) over to Node's one
    (['toBase64', 'toHex'] as const).forEach((method) => {
        if (!(method in NodeUint8Array.prototype)) {
            Object.defineProperty(NodeUint8Array.prototype, method, {
                value: (VmUint8Array.prototype as any)[method],
                writable: true,
                configurable: true,
            });
        }
    });
    (['fromBase64', 'fromHex'] as const).forEach((method) => {
        if (!(method in NodeUint8Array)) {
            Object.defineProperty(NodeUint8Array, method, {
                value: (VmUint8Array as any)[method],
                writable: true,
                configurable: true,
            });
        }
    });
    // outside of a vm context everything is already Node's (or the DOM environment's own)
    const inVmContext = VmUint8Array !== NodeUint8Array;
    Object.entries(inVmContext ? overrides : {}).forEach(([name, value]) => {
        if ((globalThis as any)[name] !== value) {
            Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
        }
    });
}

import '@proton/components/testing/vitest/mockFlagSvg';

vi.mock('./lib/import/helpers/zip.reader.wasm', () => ({ wasmURI: undefined }));

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

vi.mock('loglevel', () => import('./testing/vitest/loglevel.mock'));
vi.mock('webextension-polyfill', () => ({ default: {} }));
// The WASM twins are loaded lazily: only by the files that import the proxies
vi.mock('./lib/core/ui.proxy', async () => ({
    default: (await import('./testing/vitest/ui.proxy.mock')).default,
    preloadPassUI: async () => undefined,
}));
vi.mock('./lib/core/core.proxy', () => import('./testing/vitest/core.proxy.mock'));
vi.mock('./lib/crypto/utils/worker');

expect.extend({
    async toMatchResponse(received: Response, expected: Response) {
        const compareProps = ['status', 'statusText', 'ok'] as const;
        const mismatchedProps: string[] = compareProps.filter((prop) => received[prop] !== expected[prop]);

        const bodyReceived = await received.clone().text();
        const bodyExpected = await expected.clone().text();
        if (bodyExpected !== bodyReceived) mismatchedProps.push('body');

        const headersReceived = JSON.stringify(received.headers);
        const headersExpected = JSON.stringify(expected.headers);
        if (headersExpected !== headersReceived) mismatchedProps.push('headers');

        const pass = mismatchedProps.length === 0;

        const message = pass
            ? () => `expected Response not to match the received Response`
            : () => `expected Response to match for properties: ${mismatchedProps.join(', ')}`;

        return { message, pass };
    },
});

if (typeof window !== 'undefined') {
    // Not implemented by the DOM environment
    window.matchMedia ??= (() => {}) as unknown as typeof window.matchMedia;

    // Used by @proton/atoms Scroll
    window.ResizeObserver = class ResizeObserver {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    };
}

// Testing Library only advances fake timers through a `jest` global
(globalThis as any).jest = { advanceTimersByTime: vi.advanceTimersByTime };
