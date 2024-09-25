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
};

export default browser;
