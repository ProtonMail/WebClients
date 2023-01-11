import '@testing-library/jest-dom';
import fetch from 'cross-fetch';

import ResizeObserver from './tests/mock/ResizeObserver';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
console.error = () => {};
console.warn = () => {};

/**
 * JSDOM does not support fetch API
 * so we need to fake it
 */
let prevFetch;
beforeAll(() => {
    prevFetch = fetch;
    global.fetch = fetch;
    window.ResizeObserver = ResizeObserver;
});
afterAll(() => {
    global.fetch = prevFetch;
});

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();
