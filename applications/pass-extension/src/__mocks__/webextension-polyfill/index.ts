import { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';
import { sender } from 'proton-pass-extension/__mocks__/mocks';

const browser = {
    runtime: {
        getVersion: jest.fn(() => '0.0.1'),
        getURL: jest.fn((asset: string) => `test://${asset}`),
        sendMessage: jest.fn((_, message) => {
            const handler = mockHandlers.get(message.type);
            if (handler) return handler(message, sender);
            return false;
        }),
        getManifest: () => ({}),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        },
    },
    permissions: {
        request: jest.fn(async () => true),
        contains: jest.fn(async () => true),
    },
    privacy: {
        services: {
            autofillAddressEnabled: { get: jest.fn(), set: jest.fn() },
            passwordSavingEnabled: { get: jest.fn(), set: jest.fn() },
        },
    },
};

export const clearBrowserMocks = () => {
    browser.runtime.getURL.mockClear();
    browser.runtime.sendMessage.mockClear();
    browser.runtime.onMessage.addListener.mockClear();
    browser.runtime.onMessage.removeListener.mockClear();
    browser.permissions.request.mockClear();
    browser.permissions.contains.mockClear();
    browser.privacy.services.autofillAddressEnabled.get.mockClear();
    browser.privacy.services.autofillAddressEnabled.set.mockClear();
    browser.privacy.services.passwordSavingEnabled.get.mockClear();
    browser.privacy.services.passwordSavingEnabled.set.mockClear();
};

export default browser;
