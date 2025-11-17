import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import { TEST_USER_KEY_ID, randomContents } from '@proton/pass/lib/crypto/utils/testing';
import type { VaultShareKey } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';

import { updateVault } from './update-vault';

describe('updateVault crypto process', () => {
    test('should re-encrypt vault content with supplied vault key', async () => {
        const key = generateKey();
        const shareKey = await importSymmetricKey(key);
        const content = randomContents();

        const vaultKey: VaultShareKey = {
            key: shareKey,
            raw: key,
            rotation: 42,
            userKeyId: TEST_USER_KEY_ID,
        };

        const vaultUpdate = await updateVault({ vaultKey, content });

        const decryptedContent = await decryptData(
            vaultKey.key,
            Uint8Array.fromBase64(vaultUpdate.Content),
            PassEncryptionTag.VaultContent
        );

        expect(decryptedContent).toStrictEqual(content);
        expect(vaultUpdate.ContentFormatVersion).toEqual(ContentFormatVersion.Share);
        expect(vaultUpdate.KeyRotation).toEqual(42);
    });

    test('should throw when provided with empty content', async () => {
        const key = generateKey();
        const shareKey = await importSymmetricKey(key);

        const vaultKey: VaultShareKey = {
            key: shareKey,
            raw: key,
            rotation: 42,
            userKeyId: TEST_USER_KEY_ID,
        };

        await expect(
            updateVault({
                content: new Uint8Array(0),
                vaultKey,
            })
        ).rejects.toThrow(PassCryptoVaultError);
    });
});
