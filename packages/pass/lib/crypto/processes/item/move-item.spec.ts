import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { TEST_USER_KEY_ID } from '@proton/pass/lib/crypto/utils/testing';
import type { ItemKey, VaultShareKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';

import { moveItem } from './move-item';

describe('moveItem crypto process', () => {
    const shareKeyBuffer = generateKey();
    const itemKeyBuffer = generateKey();

    test('should re-encrypt item content with destination vault key', async () => {
        const itemId = `itemId-${Math.random()}`;

        const targetVaultKey: VaultShareKey = {
            key: await importSymmetricKey(shareKeyBuffer),
            raw: shareKeyBuffer,
            rotation: 42,
            userKeyId: TEST_USER_KEY_ID,
        };

        const itemKey: ItemKey = {
            key: await importSymmetricKey(itemKeyBuffer),
            raw: itemKeyBuffer,
            rotation: 1,
        };

        const movedItem = await moveItem({ targetVaultKey, itemKeys: [itemKey], itemId });
        const decryptedItemKey = await decryptData(
            targetVaultKey.key,
            Uint8Array.fromBase64(movedItem.ItemKeys[0].Key),
            PassEncryptionTag.ItemKey
        );

        /** Check that we can recover the initial item
         * key from the initial vault key */
        expect(movedItem.ItemID).toEqual(itemId);
        expect(movedItem.ItemKeys[0].KeyRotation).toEqual(1);
        expect(decryptedItemKey).toStrictEqual(itemKey.raw);
    });
});
