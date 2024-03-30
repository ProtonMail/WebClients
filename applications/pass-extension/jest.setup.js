import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

/* Getting ReferenceError: TextDecoder is not defined without */
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

/* Do not start crypto worker pool, let the single tests setup/mock
 * the CryptoProxy as needed */
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

jest.mock('loglevel');

/* JSDom does not include webcrypto */
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;
global.VERSION = '0.0.1';

/**  JSDom has an inconsistent `postMessage` implementation:
 * It lacks support for falling back to `/` as the `targetOrigin`.
 * Additionally, setting the `targetOrigin` to `/` is not supported
 * due to a missing reference to the source window.
 * See: https://github.com/jsdom/jsdom/blob/main/lib/jsdom/living/post-message.js */
const originalPostMessage = window.postMessage.bind(window);
window.postMessage = (message, _, transferable) => originalPostMessage(message, '*', transferable);
