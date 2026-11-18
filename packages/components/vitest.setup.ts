import '@testing-library/jest-dom/vitest';
import 'core-js/actual/typed-array/to-base64';
import 'core-js/actual/typed-array/from-base64';
import fetch from 'cross-fetch';
import * as webStreams from 'node:stream/web';

import '@proton/unleash/testing/vitest/mockUnleash';

import './testing/vitest/mockFlagSvg';
import './testing/vitest/mockMatchMedia';

// jsdom and Node use distinct typed array realms: make the polyfilled methods available on the Node one too
// (e.g. on the Uint8Array returned by TextEncoder)
{
    const nodeProto = Object.getPrototypeOf(new TextEncoder().encode(''));
    (['toBase64', 'toHex'] as const).forEach((method) => {
        if (nodeProto !== Uint8Array.prototype && !(method in nodeProto)) {
            Object.defineProperty(nodeProto, method, {
                value: (Uint8Array.prototype as any)[method],
                writable: true,
                configurable: true,
            });
        }
    });
}

// The vm context of the test pool does not expose these Node globals (msw needs them)
(['TransformStream', 'ReadableStream', 'WritableStream'] as const).forEach((name) => {
    if (!(name in globalThis)) {
        (globalThis as any)[name] = (webStreams as any)[name];
    }
});

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
/* eslint-disable no-console -- test setup silences React/testing-library noise */
console.error = () => {};
console.warn = () => {};
/* eslint-enable no-console */

// jsdom hides a <dialog> without `open`, and nothing in it can take focus. Our CSS reset shows it, tests do not load it.
const style = document.createElement('style');
style.textContent = 'dialog { display: block; }';
document.head.append(style);

// jsdom has no AnimationEvent: React then misses the `animationend` that tests fire.
(globalThis as any).AnimationEvent ??= class AnimationEvent extends Event {
    animationName: string;

    elapsedTime: number;

    pseudoElement: string;

    constructor(type: string, init: AnimationEventInit = {}) {
        const { animationName = '', elapsedTime = 0, pseudoElement = '', ...eventInit } = init;
        super(type, eventInit);
        this.animationName = animationName;
        this.elapsedTime = elapsedTime;
        this.pseudoElement = pseudoElement;
    }
};

window.ResizeObserver = class {
    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

/**
 * JSDOM does not support fetch API
 * so we need to fake it
 */
let prevFetch: typeof globalThis.fetch;
beforeAll(() => {
    prevFetch = globalThis.fetch;
    globalThis.fetch = fetch;
});
afterAll(() => {
    globalThis.fetch = prevFetch;
});

// Make tabbable ignore layout, which jsdom does not compute
vi.mock('tabbable', async () => {
    const lib: any = await vi.importActual('tabbable');
    return {
        __esModule: true,
        ...lib,
        tabbable: (node: any, options: any) => lib.tabbable(node, { ...options, displayCheck: 'none' }),
        focusable: (node: any, options: any) => lib.focusable(node, { ...options, displayCheck: 'none' }),
        isFocusable: (node: any, options: any) => lib.isFocusable(node, { ...options, displayCheck: 'none' }),
        isTabbable: (node: any, options: any) => lib.isTabbable(node, { ...options, displayCheck: 'none' }),
    };
});

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Due to a JSDom issue `dialog` tag is not understood correctly: https://github.com/jsdom/jsdom/issues/3294
vi.mock('./components/dialog/Dialog.tsx', async () => {
    const { forwardRef, createElement } = await vi.importActual<any>('react');
    return {
        __esModule: true,
        default: forwardRef(({ children, ...rest }: any, ref: any) => createElement('div', { ...rest, ref }, children)),
    };
});

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn();

// Unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
(window.SVGElement.prototype as any).getBBox = vi.fn().mockReturnValue({ width: 0 });

// Some components use the metrics API, mock it so no batch is sent via fetch after a test ends.
vi.mock('@proton/metrics/metricsInstance');
