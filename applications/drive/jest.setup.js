import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// JSDom does not include a full implementation of webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;

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

jest.mock('@proton/shared/lib/pow/wasmWorkerWrapper.ts', () => ({
    __esModule: true,
}));

jest.mock('@proton/shared/lib/pow/pbkdfWorkerWrapper.ts', () => ({
    __esModule: true,
}));
