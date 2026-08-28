import { mockHandlers } from './channel.handlers';

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

export { mockHandlers } from './channel.handlers';
export default channel;
