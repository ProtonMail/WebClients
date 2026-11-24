import '@proton/vitest-config/setup';
import { cleanup } from '@testing-library/react';
import { webcrypto } from 'crypto';
import { vi } from 'vitest';

import '@proton/components/testing/vitest/mockFlagSvg';
import '@proton/components/testing/vitest/mockMatchMedia';
import '@proton/unleash/testing/vitest/mockUnleash';

afterEach(cleanup);

vi.mock('zustand', () => import('./src/__mocks__/zustand'));

const { getComputedStyle } = window;

window.getComputedStyle = (elt) => getComputedStyle(elt);
window.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
};

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn();

// JSDom does not include a full implementation of webcrypto
Object.defineProperty(global.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));
