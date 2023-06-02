import '@testing-library/jest-dom';
import fetch from 'cross-fetch';

import '@proton/testing/lib/mockMatchMedia';

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

jest.mock('@proton/shared/lib/pow/wasmWorkerWrapper.ts', () => ({
    __esModule: true,
}));

/**
 * Due to a JSDom issue `dialog` tag is not understood correctly
 * Delete this test when the Jest will implement the fix
 * - Issue: https://github.com/jsdom/jsdom/issues/3294
 * - Fix pull request: https://github.com/jsdom/jsdom/pull/3403
 */
jest.mock('./components/dialog/Dialog.tsx', () => {
    const { forwardRef } = jest.requireActual('react');
    return {
        __esModule: true,
        default: forwardRef(({ children, ...rest }, ref) => {
            return (
                <div {...rest} ref={ref}>
                    {children}
                </div>
            );
        }),
    };
});

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();

// That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
// In particular, we need this fix to render all the components that have PaymentMethodDetails in their trees
window.SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });
