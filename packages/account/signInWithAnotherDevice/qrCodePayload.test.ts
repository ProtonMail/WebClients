import { deserializeQrCodePayload } from './qrCodePayload';

describe('deserializeQrCodePayload', () => {
    it('accepts a valid payload', () => {
        expect(deserializeQrCodePayload('0:3Q9CZ7YE:Ynl0ZXM=:macos-pass')).toEqual({
            version: 0,
            userCode: '3Q9CZ7YE',
            encodedBytes: 'Ynl0ZXM=',
            childClientId: 'macos-pass',
        });
    });

    // The full alphabet the API's Crockford encoder uses, in 8-char chunks
    it.each(['01234567', '89ABCDEF', 'GHJKMNPQ', 'RSTVWXYZ'])('accepts the user code %s', (userCode) => {
        expect(deserializeQrCodePayload(`0:${userCode}::macos-pass`).userCode).toBe(userCode);
    });

    it.each([
        ['empty', ''],
        ['too short', '3Q9CZ7Y'],
        ['too long', 'FOO3Q9CZ7YE'],
        ['lowercase', '3q9cz7ye'],
        ['using I, L, O or U (not in Crockford base32)', '3Q9CZ7IO'],
        ['using U', 'UUUUUUUU'],
        ['spaces', '3Q9C Z7Y'],
        ['text', 'VERIFIED-BY-PROTON'],
        ['phone number', '+41 22 555 0100'],
        ['unicode lookalike', '3Q9CZ7Y\u0415'],
    ])('rejects a user code that is %s', (_, userCode) => {
        expect(() => deserializeQrCodePayload(`0:${userCode}::macos-pass`)).toThrow('Invalid code');
    });
});
