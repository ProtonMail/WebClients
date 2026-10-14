import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// JSDom does not include a full implementation of webcrypto
global.crypto.subtle = require('crypto').webcrypto.subtle;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();

jest.mock('loglevel', () => require('@proton/pass/utils/logger/loglevel.mock'));
jest.mock('@proton/pass/lib/core/ui.proxy');
jest.mock('webextension-polyfill', () => ({}));

// No extension to answer in jsdom: resolve right away instead of arming a 15s timeout
jest.mock('@proton/shared/lib/browser/extension', () => ({
    ...jest.requireActual('@proton/shared/lib/browser/extension'),
    sendExtensionMessage: jest.fn().mockResolvedValue({ type: 'error', error: 'No extension in tests' }),
}));

// Module-level channels (service worker client) would otherwise keep jest from exiting
const NativeBroadcastChannel = global.BroadcastChannel;
global.BroadcastChannel = class extends NativeBroadcastChannel {
    constructor(name) {
        super(name);
        this.unref?.();
    }
};
