export const mockHandlers = new Map();

const channel = {
    registerMessage: jest.fn().mockImplementation((type, handler) => mockHandlers.set(type, handler)),
    onMessage: jest.fn(),
    buffer: {
        push: jest.fn(),
        flush: jest.fn(),
    },
    ports: {
        broadcast: jest.fn(),
        onConnect: jest.fn(),
        disconnect: jest.fn(),
        query: jest.fn(),
    },
};

export default channel;
