import '@testing-library/jest-dom';

import '@proton/testing/lib/mockFlagSvg';
import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockTelemetry';
import '@proton/testing/lib/mockUnleash';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

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

// Mock locale to avoid dynamic imports and big text context
jest.mock('./src/app/locales.ts', () => ({
    __esModule: true,
    stripLocaleTagPrefix: (pathname) => ({
        fullLocale: 'en',
        localePrefix: 'en',
        pathname: pathname.replace(/^\/\w{2,3}(-\w{2})?\//, '') || '/',
    }),
    getLocaleMapping: (localeCode) => localeCode,
    default: {},
    localeMap: {},
}));

// That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
// In particular, we need this fix to render all the components that have PaymentMethodDetails in their trees
window.SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// For instance, a test covering a component with metrics might finish successfully, but a subsequent test
// could fail seconds later when the metrics batch is sent via fetch.
// The metrics package has its own test coverage, so we don't need to test it here.
jest.mock('@proton/metrics');
