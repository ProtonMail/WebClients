import '@testing-library/jest-dom';
import '@proton/app-context/testing/mockTelemetry';
import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

// Mock window.getComputedStyle to prevent "Not implemented" errors in jsdom
// This is required by useActiveBreakpoint and other hooks that compute styles
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
// In particular, we need this fix to render all the components that have PaymentMethodDetails in their trees
Object.assign(window.SVGElement.prototype, { getBBox: jest.fn().mockReturnValue({ width: 0 }) });

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// The metrics package has its own test coverage, so we don't need to test it here.
jest.mock('@proton/metrics/metricsInstance');
