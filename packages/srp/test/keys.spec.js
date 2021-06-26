import { describe, it } from 'mocha';
import assert from 'assert';

import './setup';
import { generateKeySalt, computeKeyPassword } from '../lib/keys';

describe('passwords', () => {
    it('should generate key salt', () => {
        const salt = generateKeySalt();
        assert.strictEqual(salt.length, 24);
    });

    it('should compute key password', async () => {
        const keyp = await computeKeyPassword('hello', 'ajHO5Xshwb9h9DcAExIkbg==');
        assert.strictEqual(keyp, 'vQp4euSvXpBygefcOfyhCbWmFgFmgeW');
    });

    it('should throw without a salt', async () => {
        const promise = computeKeyPassword('hello');
        await assert.rejects(promise, {
            name: 'Error',
            message: 'Password and salt required.'
        });
    });

    it('should throw without a password', async () => {
        const promise = computeKeyPassword(undefined, 'ajHO5Xshwb9h9DcAExIkbg==');
        await assert.rejects(promise, {
            name: 'Error',
            message: 'Password and salt required.'
        });
    });
});
