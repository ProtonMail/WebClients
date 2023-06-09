import { CONTENT_FORMAT_VERSION, EncryptionTag, VaultKey } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoVaultError } from '../../utils/errors';
import { randomContents } from '../../utils/testing';
import { updateVault } from './update-vault';

describe('updateVault crypto process', () => {
    test('should re-encrypt vault content with supplied vault key', async () => {
        const key = generateKey();
        const shareKey = await getSymmetricKey(key);
        const content = randomContents();

        const vaultKey: VaultKey = {
            key: shareKey,
            raw: key,
            rotation: 42,
        };

        const vaultUpdate = await updateVault({ vaultKey, content });

        const decryptedContent = await decryptData(
            vaultKey.key,
            base64StringToUint8Array(vaultUpdate.Content),
            EncryptionTag.VaultContent
        );

        expect(decryptedContent).toStrictEqual(content);
        expect(vaultUpdate.ContentFormatVersion).toEqual(CONTENT_FORMAT_VERSION);
        expect(vaultUpdate.KeyRotation).toEqual(42);
    });

    test('should throw when provided with empty content', async () => {
        const key = generateKey();
        const shareKey = await getSymmetricKey(key);

        const vaultKey: VaultKey = {
            key: shareKey,
            raw: key,
            rotation: 42,
        };

        await expect(
            updateVault({
                content: new Uint8Array(0),
                vaultKey,
            })
        ).rejects.toThrow(PassCryptoVaultError);
    });
});
