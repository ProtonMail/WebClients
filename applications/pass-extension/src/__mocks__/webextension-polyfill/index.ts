import { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';
import { sender } from 'proton-pass-extension/__mocks__/mocks';

const browser = {
    runtime: {
        sendMessage: jest.fn((_, message) => {
            const handler = mockHandlers.get(message.type);
            if (handler) return handler(message, sender);
            return false;
        }),
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

export default browser;
