import '@testing-library/jest-dom';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

const { getComputedStyle } = window;

window.getComputedStyle = (elt) => getComputedStyle(elt);
window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();

// JSDom does not include a full implementation of webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));
