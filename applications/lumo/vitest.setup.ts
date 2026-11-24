import '@proton/vitest-config/setup';
import { cleanup } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { afterEach, vi } from 'vitest';

declare global {
    // eslint-disable-next-line no-var
    var ENV: string;
}

afterEach(cleanup);

if (typeof document !== 'undefined') {
    // A <dialog> without `open` is hidden and nothing in it is reachable by role. Our modals render one and show it
    // with the `dialog { display: block }` of the CSS reset, which tests do not load.
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.append(style);
}

globalThis.ENV = 'test';

Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
        matches: false,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
    }),
});

globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

// happy-dom exposes `navigator.locks` as null, where browsers without the Web Locks API leave it undefined
if (typeof navigator !== 'undefined' && navigator.locks === null) {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
}

Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

vi.mock('loglevel');
