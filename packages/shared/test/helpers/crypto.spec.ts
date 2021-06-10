import { xorEncryptDecrypt } from '../../lib/helpers/crypto';

describe('Crypto helpers', () => {
    describe('xorEncryptDecrypt', () => {
        it('encrypts and decrypts', () => {
            const key = 'dog';
            const data = 'cat';
            const xored = xorEncryptDecrypt({ key, data });

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });

        it('does not strip trailing zeros when encrypting or decrypting', () => {
            const key = 'dogs';
            const data = 'cats';
            const xored = xorEncryptDecrypt({ key, data });
            // because the last letter of 'dogs' and 'cats' is the same,
            // xored will have a trailing 0 in its Uint8Array representation

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });
    });
});
