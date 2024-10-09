import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
    KEY_LENGTH_BYTES,
    decryptData,
    deriveKey,
    encryptData,
    encryptDataWith16ByteIV,
    generateKey,
    importKey,
} from '../../lib/subtle/aesGcm';
import { stringToUtf8Array } from '../../lib/utils';

chaiUse(chaiAsPromised);

describe('Subtle - AES-GCM helpers', () => {
    it('generateKey - key has declared size', async () => {
        const keyBytes = generateKey();
        expect(keyBytes).to.have.length(KEY_LENGTH_BYTES);
    });

    it('generateKey/importKey/encryptData/decryptData - successful with additional data', async () => {
        const keyBytes = generateKey();
        const key = await importKey(keyBytes);
        const data = stringToUtf8Array('hello world');
        const context = stringToUtf8Array('@proton/crypto gcm test');
        const encrypted = await encryptData(key, data, context);
        const decrypted = await decryptData(key, encrypted, context);

        expect(decrypted).to.deep.equal(data);
    });

    it('generateKey/importKey/encryptData/decryptData - successful without additional data', async () => {
        const keyBytes = generateKey();
        const key = await importKey(keyBytes);
        const data = stringToUtf8Array('hello world');
        const context = undefined;
        const encrypted = await encryptData(key, data, context);
        const decrypted = await decryptData(key, encrypted, context);

        expect(decrypted).to.deep.equal(data);
    });

    it('encryptDataWith16ByteIV/decryptData - successful if decryption support for legacy 16-byte IV is set', async () => {
        const keyBytes = generateKey();
        const key = await importKey(keyBytes);
        const data = stringToUtf8Array('hello world');
        const context = stringToUtf8Array('@proton/crypto gcm test');
        const encryptedLegacy = await encryptDataWith16ByteIV(key, data, context);
        // expect failure since a 12-byte IV should be used by default
        await expect(decryptData(key, encryptedLegacy, context)).to.be.rejected;
        // expect success if support for 16-byte IV is explictly set
        const decrypted = await decryptData(key, encryptedLegacy, context, true);

        expect(decrypted).to.deep.equal(data);
    });

    it('deriveKey - throws on short secret input', async () => {
        const context = stringToUtf8Array('@proton/crypto gcm test');
        const salt = crypto.getRandomValues(new Uint8Array(32));
        await expect(deriveKey(crypto.getRandomValues(new Uint8Array(8)), salt, context)).to.be.rejectedWith(
            /too short/
        );
    });

    it('deriveKey - extractable key can be exported', async () => {
        const context = stringToUtf8Array('@proton/crypto gcm test');
        const salt = crypto.getRandomValues(new Uint8Array(32));
        const hkdfInput = crypto.getRandomValues(new Uint8Array(16));

        const key = await deriveKey(hkdfInput, salt, context, { extractable: true });
        const exportedKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
        expect(exportedKey).to.have.length(KEY_LENGTH_BYTES);
    });

    it('deriveKey/encryptData/decryptData - derived key can be used as-is', async () => {
        const context = stringToUtf8Array('@proton/crypto gcm test');
        const hkdfSalt = crypto.getRandomValues(new Uint8Array(32));
        const hkdfInput = crypto.getRandomValues(new Uint8Array(16));

        const key = await deriveKey(hkdfInput, hkdfSalt, context);
        const data = stringToUtf8Array('hello world');
        const encrypted = await encryptData(key, data, context);
        const decrypted = await decryptData(key, encrypted, context);

        expect(decrypted).to.deep.equal(data);
    });
});
