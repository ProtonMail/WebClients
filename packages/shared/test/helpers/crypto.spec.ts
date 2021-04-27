import { xorEncryptDecrypt } from '../../lib/helpers/crypto';

describe('Crypto helpers', () => {
    describe('xorEncryptDecrypt', () => {
        it('encrypts and decrypts', () => {
            const key = 'dog';
            const data = 'cat';
            const xored = xorEncryptDecrypt({ key, data });

            expect(xorEncryptDecrypt({ key, data: xored })).toEqual(data);
        });
    });
});
