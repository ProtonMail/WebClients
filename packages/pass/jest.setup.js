import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
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
jest.mock('@proton/pass/lib/core/core.ui');

// JSDom does not include webcrypto
const crypto = require('crypto').webcrypto;
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
