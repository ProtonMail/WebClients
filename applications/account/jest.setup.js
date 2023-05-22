import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import '@proton/testing/lib/mockMatchMedia';

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
// That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
// In particular, we need this fix to render all the components that have PaymentMethodDetails in their trees
window.SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });
