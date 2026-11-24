import '@proton/vitest-config/setup';
import { vi } from 'vitest';

import '@proton/polyfill';
import '@proton/unleash/testing/vitest/mockUnleash';

import './testing/setup/mockMatchMedia';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

window.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
};

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// @ts-ignore
global.MutationObserver = class {
    disconnect() {}
    observe() {}
};

// Silence JDOM warnings triggered by emoji-mart
// @ts-ignore
HTMLCanvasElement.prototype.getContext = vi.fn();
