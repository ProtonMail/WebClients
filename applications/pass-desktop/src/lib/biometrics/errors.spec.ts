import { PRESENCE_CANCELLED_MESSAGE, assertPresenceVerified } from './errors';

describe('assertPresenceVerified', () => {
    test('passes a verified check', () => {
        expect(() => assertPresenceVerified(true)).not.toThrow();
    });

    test('rejects a cancelled check with the message the renderer recognises', () => {
        expect(() => assertPresenceVerified(false)).toThrow(new Error(PRESENCE_CANCELLED_MESSAGE));
    });
});
