import '@testing-library/jest-dom';
import 'whatwg-fetch';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

import ResizeObserver from './src/tests/mock/ResizeObserver';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
console.error = () => {};
console.warn = () => {};

beforeAll(() => {
    window.ResizeObserver = ResizeObserver;
});

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));
