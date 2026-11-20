import { mockHandlers } from './channel.handlers';

const channel = {
    registerMessage: vi.fn().mockImplementation((type, handler) => mockHandlers.set(type, handler)),
    onMessage: vi.fn(),
    buffer: {
        push: vi.fn(),
        flush: vi.fn(),
    },
    ports: {
        broadcast: vi.fn(),
        onConnect: vi.fn(),
        disconnect: vi.fn(),
        query: vi.fn(),
    },
};

export { mockHandlers } from './channel.handlers';
export default channel;
