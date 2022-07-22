import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// JSDom does not include webcrypto
window.crypto = require('crypto').webcrypto;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// Globally mocked @proton/components modules
jest.mock('@proton/components/hooks/useEventManager.ts', () => {
    const subscribe = jest.fn();
    const call = jest.fn();
    const stop = jest.fn();
    const start = jest.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return result;
});

// Globally mocked upload helper (standard requests are mocked through context)
jest.mock('./src/app/helpers/upload');

global.MutationObserver = class {
    disconnect() {} // eslint-disable-line
    observe() {} // eslint-disable-line
};

// Mock backdrop container because it's always rendered, and it's rendered in a portal which causes issues with the hook renderer
jest.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();
