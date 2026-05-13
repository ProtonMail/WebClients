import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { createRandomVaultKey } from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';

import { createAccessTokenShareKeys } from './create-access-token-share-keys';

describe('createAccessTokenShareKeys crypto process', () => {
    test('should encrypt each vault share key with the PAT key', async () => {
        const vaultKeys = await Promise.all(Array.from({ length: 3 }).map((_, i) => createRandomVaultKey(i)));
        const rawPatKey = generateKey();
        const patKey = await importSymmetricKey(rawPatKey);
        const result = await createAccessTokenShareKeys(rawPatKey, vaultKeys);

        expect(result).toHaveLength(3);

        for (let i = 0; i < result.length; i++) {
            expect(result[i].KeyRotation).toBe(vaultKeys[i].rotation);
            const b64Key = Uint8Array.fromBase64(result[i].Key);
            const decrypted = await decryptData(patKey, b64Key, PassEncryptionTag.ShareKey);
            expect(decrypted).toStrictEqual(vaultKeys[i].raw);
        }
    });

    test('should return an empty array when there are no share keys', async () => {
        const result = await createAccessTokenShareKeys(generateKey(), []);
        expect(result).toStrictEqual([]);
    });
});
