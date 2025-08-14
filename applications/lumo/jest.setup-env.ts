import '@testing-library/jest-dom';
import { Blob, File } from 'buffer';
import { ReadableStream, WritableStream } from 'stream/web';
import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;
// @ts-ignore
global.ReadableStream = ReadableStream;
// @ts-ignore
global.WritableStream = WritableStream;
// @ts-ignore
global.Blob = Blob;
// @ts-ignore
global.File = File;

// @ts-ignore
global.ENV = 'test';

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

jest.mock('@proton/shared/lib/pow/pbkdfWorkerWrapper.ts', () => ({
    __esModule: true,
}));

jest.mock('loglevel');
jest.mock('@proton/pass/lib/core/ui.proxy');
jest.mock('@proton/pass/lib/crypto/utils/worker');

// JSDom does not include webcrypto
const crypto = require('crypto').webcrypto;
// @ts-ignore
global.crypto.subtle = crypto.subtle;

expect.extend({
    async toMatchResponse(received, expected) {
        const compareProps = ['status', 'statusText', 'ok'];
        const mismatchedProps = compareProps.filter((prop) => received[prop] !== expected[prop]);

        const bodyReceived = await received.clone().text();
        const bodyExpected = await expected.clone().text();
        if (bodyExpected !== bodyReceived) mismatchedProps.push('body');

        const headersReceived = JSON.stringify(received.headers);
        const headersExpected = JSON.stringify(expected.headers);
        if (headersExpected !== headersReceived) mismatchedProps.push('headers');

        const pass = mismatchedProps.length === 0;

        const message = pass
            ? () => `expected Response not to match the received Response`
            : () => `expected Response to match for properties: ${mismatchedProps.join(', ')}`;

        return { message, pass };
    },
});
