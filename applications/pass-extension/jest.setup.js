import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('loglevel');

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// JSDom does not include webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;
global.VERSION = '0.0.1';
