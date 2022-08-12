import assert from 'assert';
import { describe, it } from 'mocha';

import { binaryStringToArray } from '@proton/crypto/lib/utils';

import { hashedResult0, hashedResult2, hashedResult4, watResult } from '../test/passwords.data';
import '../test/setup';
import { expandHash, hashPassword } from './passwords';

describe('passwords', () => {
    it('should expand a hash', async () => {
        const result = await expandHash(binaryStringToArray('wat'));
        assert.deepStrictEqual(result, watResult);
    });

    it('should hash password version 4', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 4,
        });
        assert.deepStrictEqual(hashed, hashedResult4);
    });

    it('should hash password version 3', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 3,
        });
        assert.deepStrictEqual(hashed, hashedResult4);
    });

    it('should hash password version 2', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 2,
        });
        assert.deepStrictEqual(hashed, hashedResult2);
    });

    it('should hash password version 1', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 1,
        });
        assert.deepStrictEqual(hashed, hashedResult2);
    });

    it('should hash password version 0', async () => {
        const hashed = await hashPassword({
            password: 'hello',
            username: 'user1',
            salt: '»¢põó<±Ò&',
            modulus: new Uint8Array(256),
            version: 0,
        });
        assert.deepStrictEqual(hashed, hashedResult0);
    });
});
