import '@testing-library/jest-dom';
import fetch from 'cross-fetch';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

import './jest.mock';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
console.error = () => {};
console.warn = () => {};

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

/**
 * JSDOM does not support fetch API
 * so we need to fake it
 */
let prevFetch;
beforeAll(() => {
    prevFetch = fetch;
    global.fetch = fetch;
});
afterAll(() => {
    global.fetch = prevFetch;
});

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));

/**
 * Due to a JSDom issue `dialog` tag is not understood correctly
 * Delete this test when the Jest will implement the fix
 * - Issue: https://github.com/jsdom/jsdom/issues/3294
 * - Fix pull request: https://github.com/jsdom/jsdom/pull/3403
 */
jest.mock('./components/dialog/Dialog.tsx', () => {
    const { forwardRef, createElement } = jest.requireActual('react');
    return {
        __esModule: true,
        default: forwardRef(({ children, ...rest }, ref) => createElement('div', { ...rest, ref }, children)),
    };
});

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();

// That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
// In particular, we need this fix to render all the components that have PaymentMethodDetails in their trees
window.SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// For instance, a test covering a component with metrics might finish successfully, but a subsequent test
// could fail seconds later when the metrics batch is sent via fetch.
// The metrics package has its own test coverage, so we don't need to test it here.
jest.mock('@proton/metrics');

jest.mock('@proton/components/containers/vpn/flag', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));

jest.mock('@proton/components/components/v2/phone/flagSvgs', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));
