import { binaryStringToUint8Array } from '@proton/crypto/lib/utils';

import { hashedResult0, hashedResult2, hashedResult4, watResult } from '../test/passwords.data';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../test/setup';
import { expandHash, hashPassword } from './passwords';

describe('passwords', () => {
    beforeAll(setupCryptoProxyForTesting);
    afterAll(releaseCryptoProxy);

    it('should expand a hash', async () => {
        const result = await expandHash(binaryStringToUint8Array('wat'));
        expect(result).toEqual(watResult);
    });

    it('should hash password version 4', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 4,
        });
        expect(hashed).toEqual(hashedResult4);
    });

    it('should hash password version 3', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 3,
        });
        expect(hashed).toEqual(hashedResult4);
    });

    it('should hash password version 2', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 2,
        });
        expect(hashed).toEqual(hashedResult2);
    });

    it('should hash password version 1', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 1,
        });
        expect(hashed).toEqual(hashedResult2);
    });

    it('should hash password version 0', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 0,
        });
        expect(hashed).toEqual(hashedResult0);
    });
});
