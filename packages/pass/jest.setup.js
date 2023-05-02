import '@testing-library/jest-dom/extend-expect';
import { TextDecoder, TextEncoder } from 'util';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

jest.mock('loglevel');

// JSDom does not include webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;
