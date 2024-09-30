import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import { TEST_USER_KEY_ID, randomContents } from '@proton/pass/lib/crypto/utils/testing';
import type { VaultKey } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { moveItem } from './move-item';

describe('moveItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should re-encrypt item content with destination vault key', async () => {
        const destinationShareId = `shareId-${Math.random()}`;
        const destinationVaultKey: VaultKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 42,
            userKeyId: TEST_USER_KEY_ID,
        };

        const movedItem = await moveItem({ content, destinationVaultKey, destinationShareId });

        expect(movedItem.Item.ContentFormatVersion).toEqual(ContentFormatVersion.Item);
        expect(movedItem.Item.KeyRotation).toEqual(destinationVaultKey.rotation);

        const newItemKey = await decryptData(
            destinationVaultKey.key,
            base64StringToUint8Array(movedItem.Item.ItemKey),
            PassEncryptionTag.ItemKey
        );

        const decryptedContent = await decryptData(
            await importSymmetricKey(newItemKey),
            base64StringToUint8Array(movedItem.Item.Content!),
            PassEncryptionTag.ItemContent
        );

        expect(decryptedContent).toStrictEqual(content);
    });

    test('should throw when provided with empty content', async () => {
        const vaultKey: VaultKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 42,
            userKeyId: TEST_USER_KEY_ID,
        };

        await expect(
            moveItem({
                content: new Uint8Array(0),
                destinationShareId: '',
                destinationVaultKey: vaultKey,
            })
        ).rejects.toThrow(PassCryptoItemError);
    });
});
