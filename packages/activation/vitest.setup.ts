import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

import '@proton/components/testing/vitest/mockFlagSvg';
import '@proton/components/testing/vitest/mockMatchMedia';
import { mockTracker } from '@proton/telemetry-tracker/testing';
import '@proton/unleash/testing/vitest/mockUnleash';

import ResizeObserver from './src/tests/mock/ResizeObserver';

window.ResizeObserver = ResizeObserver;

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// oxlint-disable-next-line no-console
console.error = () => {};
// oxlint-disable-next-line no-console
console.warn = () => {};

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Focus trapping relies on layout, which the DOM test environment does not compute
vi.mock('tabbable', async () => {
    const lib = await vi.importActual<Record<string, (...args: any[]) => any>>('tabbable');
    return {
        ...lib,
        tabbable: (node: any, options: any) => lib.tabbable(node, { ...options, displayCheck: 'none' }),
        focusable: (node: any, options: any) => lib.focusable(node, { ...options, displayCheck: 'none' }),
        isFocusable: (node: any, options: any) => lib.isFocusable(node, { ...options, displayCheck: 'none' }),
        isTabbable: (node: any, options: any) => lib.isTabbable(node, { ...options, displayCheck: 'none' }),
    };
});

// Silence DOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn();

// The DOM environment does not implement the Web Animations API used by the illustrations
Element.prototype.animate = vi.fn(() => ({ cancel: vi.fn() })) as any;

// The tracker throws outside of production when it was not initialised: record the reports instead of sending them
let restoreTracker: () => void;
beforeEach(() => {
    restoreTracker = mockTracker().restore;
});
afterEach(() => {
    restoreTracker();
});
