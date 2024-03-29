import * as bridge from './bridge/message';

describe('webauthn [unsupported]', () => {
    let createMessageBridge: jest.SpyInstance;

    beforeEach(async () => {
        createMessageBridge = jest.spyOn(bridge, 'createMessageBridge').mockImplementation(() => ({
            init: jest.fn(),
            sendMessage: jest.fn(),
            getState: jest.fn(() => ({
                connected: true,
                ready: Promise.resolve(),
            })) as any,
        }));
    });

    afterEach(() => createMessageBridge.mockClear());

    test('should noop', async () => {
        await import('./webauthn');
        expect(navigator.credentials?.get).toBeUndefined();
        expect(navigator.credentials?.create).toBeUndefined();
        expect(createMessageBridge).not.toHaveBeenCalled();
    });
});
