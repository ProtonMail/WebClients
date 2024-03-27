import { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';

const browser = {
    runtime: {
        sendMessage: jest.fn((_, message) => {
            const handler = mockHandlers.get(message.type);
            if (handler) return handler(message);
            return false;
        }),
    },
};

export default browser;
