import '@testing-library/jest-dom';
import { ReadableStream, WritableStream } from 'stream/web';
import { TextDecoder, TextEncoder } from 'util';

/* Getting ReferenceError: TextDecoder is not defined without */
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.Blob = Blob;
global.File = File;

/* Do not start crypto worker pool, let the single tests setup/mock
 * the CryptoProxy as needed */
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

jest.mock('@proton/pass/lib/core/ui.proxy');
jest.mock('loglevel');

/* JSDom does not include webcrypto */
global.crypto.subtle = require('crypto').webcrypto.subtle;
