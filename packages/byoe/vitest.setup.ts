import '@proton/unleash/testing/vitest/mockUnleash';

const hasDom = typeof document !== 'undefined';

if (hasDom) {
    await import('@proton/polyfill');
} else {
    // @proton/polyfill reads `window` at import time. In the node environment provide it only while
    // loading, so code under test never sees a fake `window` without a DOM.
    globalThis.window = globalThis as unknown as Window & typeof globalThis;
    await import('@proton/polyfill');
    // @ts-expect-error window is not optional in the DOM typings
    delete globalThis.window;
}

if (hasDom) {
    await import('@testing-library/jest-dom/vitest');
    // @ts-expect-error side-effect-only module without exports
    await import('@proton/components/testing/vitest/mockMatchMedia');
    const { cleanup } = await import('@testing-library/react');

    afterEach(cleanup);

    global.ResizeObserver = class {
        observe = vi.fn();

        unobserve = vi.fn();

        disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;
}
