import '@proton/polyfill';
import '@proton/vitest-config/setup';
import '@proton/unleash/testing/mockUnleash';
import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
/* eslint-disable no-console -- test setup silences React/testing-library noise */
console.error = () => {};
console.warn = () => {};
/* eslint-enable no-console */

window.ResizeObserver = class {
    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Due to a JSDom issue `dialog` tag is not understood correctly: https://github.com/jsdom/jsdom/issues/3294
vi.mock('@proton/components/components/dialog/Dialog', async () => {
    const { forwardRef, createElement } = await vi.importActual<any>('react');
    return {
        __esModule: true,
        default: forwardRef(({ children, ...rest }: any, ref: any) => createElement('div', { ...rest, ref }, children)),
    };
});

// Some components use the metrics API, mock it so no batch is sent via fetch after a test ends.
vi.mock('@proton/metrics/metricsInstance');
