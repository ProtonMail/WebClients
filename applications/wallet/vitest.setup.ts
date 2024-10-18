import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

import '@proton/testing/lib/vitest/mockMatchMedia';
import '@proton/testing/lib/vitest/mockUnleash';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup); // TODO double check if needed; see https://github.com/vitest-dev/vitest/issues/1430
// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// JSDom does not include a full implementation of webcrypto
// const crypto = require('crypto').webcrypto;
// global.crypto.subtle = crypto.subtle;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Globally mocked @proton/components modules
vi.mock('@proton/components/hooks/useEventManager.ts', () => {
    const subscribe = vi.fn();
    const call = vi.fn();
    const stop = vi.fn();
    const start = vi.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return { default: result };
});

// Globally mocked upload helper (standard requests are mocked through context)
vi.mock('./src/app/helpers/upload');

// @ts-ignore
global.MutationObserver = class {
    disconnect() {} // eslint-disable-line
    observe() {} // eslint-disable-line
};

// Mock backdrop container because it's always rendered, and it's rendered in a portal which causes issues with the hook renderer
vi.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));

// Silence JDOM warnings triggered by emoji-mart
// @ts-ignore
HTMLCanvasElement.prototype.getContext = vi.fn();

vi.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
    enUSLocale: { code: 'en-US' },
}));

vi.mock('@proton/shared/lib/pow/wasmWorkerWrapper.ts', () => ({
    __esModule: true,
}));

vi.mock('@proton/shared/lib/pow/pbkdfWorkerWrapper.ts', () => ({
    __esModule: true,
}));
