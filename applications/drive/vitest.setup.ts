import '@proton/vitest-config/setup';
import { act, cleanup } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import * as webStreams from 'node:stream/web';
import { runInThisContext } from 'node:vm';
import { afterEach, vi } from 'vitest';

import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

afterEach(cleanup);

// happy-dom has no user-agent stylesheet: give <bdi> its default isolation, which the bidi tests read back
const bdiStyle = document.createElement('style');
bdiStyle.textContent = 'bdi { unicode-bidi: isolate; }';
document.head.append(bdiStyle);

// The vm context of the test pool has its own web streams, which the code under test mixes with Node's ones
(['TransformStream', 'ReadableStream', 'WritableStream'] as const).forEach((name) => {
    (globalThis as any)[name] = webStreams[name];
});

// The vm context of the test pool has its own typed arrays: OpenPGP's `instanceof Uint8Array` fails on the ones
// Node returns (TextEncoder, webcrypto...), so restore the constructors of Node's realm
(
    [
        'ArrayBuffer',
        'DataView',
        'Int8Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'Int16Array',
        'Uint16Array',
        'Int32Array',
        'Uint32Array',
        'Float32Array',
        'Float64Array',
        'BigInt64Array',
        'BigUint64Array',
    ] as const
).forEach((name) => {
    (globalThis as any)[name] = runInThisContext(name);
});

// Root __mocks__ are not applied automatically by Vitest
vi.mock('zustand');
vi.mock('comlink');
vi.mock('idb-keyval');

// Reset every zustand store created through the mock after each test
afterEach(async () => {
    const { storeResetFns } = (await import('zustand')) as unknown as { storeResetFns: Set<() => void> };
    act(() => {
        storeResetFns.forEach((resetFn) => resetFn());
    });
});

Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });

globalThis.OffscreenCanvas = vi.fn(function (width: number, height: number) {
    return {
        width,
        height,
        oncontextlost: vi.fn(),
        oncontextrestored: vi.fn(),
        getContext: vi.fn(() => undefined),
        convertToBlob: vi.fn(),
        transferToImageBitmap: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    };
}) as unknown as typeof OffscreenCanvas;

globalThis.ResizeObserver = vi.fn(function () {
    return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    };
}) as unknown as typeof ResizeObserver;

class MockIntersectionObserver {
    callback: IntersectionObserverCallback;

    options?: IntersectionObserverInit;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.options = options;
    }

    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();

    // helper to trigger intersection manually
    trigger(entries: IntersectionObserverEntry[]) {
        this.callback(entries, this as unknown as IntersectionObserver);
    }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

globalThis.BroadcastChannel = vi.fn(function () {
    return {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
        onmessageerror: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    };
}) as unknown as typeof BroadcastChannel;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Mock canvas (for e.g. canvasUtils tests)
HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
    callback(new Blob(['abc']));
});

vi.mock('@protontech/drive-sdk/dist/telemetry', () => ({
    ConsoleLogHandler: vi.fn(function () {
        return { log: vi.fn() };
    }),
    MemoryLogHandler: vi.fn(function () {
        return {
            log: vi.fn(),
            getLogs: vi.fn().mockReturnValue([]),
        };
    }),
    LogLevel: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
    },
    setTelemetryEnabled: vi.fn(),
    setTelemetryHandler: vi.fn(),
}));
