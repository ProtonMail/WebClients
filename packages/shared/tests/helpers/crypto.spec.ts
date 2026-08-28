import { xorEncryptDecrypt } from '../../lib/helpers/crypto';

describe('Crypto helpers', () => {
    describe('xorEncryptDecrypt', () => {
        it('encrypts and decrypts', () => {
            const key = new Uint8Array([1, 2, 3]);
            const data = new Uint8Array([4, 5, 6]);
            const xored = xorEncryptDecrypt({ key, data });

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });

        it('does not strip trailing zeros when encrypting or decrypting', () => {
            const key = new Uint8Array([1, 2, 3, 255]);
            const data = new Uint8Array([4, 5, 6, 255]);
            const xored = xorEncryptDecrypt({ key, data });
            // because the last byte of `key` and `data` is the same,
            // xored will have a trailing 0

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });
    });
});
