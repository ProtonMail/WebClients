import type { MockInstance } from 'vitest';

import * as bridge from './bridge/message';

vi.mock('./bridge/message', async () => ({ __esModule: true, ...(await vi.importActual('./bridge/message')) }));

describe('webauthn [unsupported]', () => {
    let createMessageBridge: MockInstance;

    beforeEach(async () => {
        createMessageBridge = vi.spyOn(bridge, 'createMessageBridge').mockImplementation(() => ({
            init: vi.fn(),
            sendMessage: vi.fn(),
            getState: vi.fn(() => ({
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
