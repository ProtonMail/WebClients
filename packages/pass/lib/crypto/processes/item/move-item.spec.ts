import type { ItemKey, VaultShareKey } from '../../../../types';
import { PassEncryptionTag } from '../../../../types';
import { decryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { TEST_USER_KEY_ID } from '../../utils/testing';
import { moveItem } from './move-item';

describe('moveItem crypto process', () => {
    const shareKeyBuffer = generateKey();
    const itemKeyBuffer = generateKey();

    const getKeys = async () => {
        const targetKey: VaultShareKey = {
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

        return { targetKey, itemKey };
    };

    test('should re-encrypt the item key with the destination key', async () => {
        const itemId = `itemId-${crypto.randomUUID()}`;
        const targetFolderId = `folderId-${crypto.randomUUID()}`;
        const { targetKey, itemKey } = await getKeys();

        const movedItem = await moveItem({ targetKey, itemKeys: [itemKey], itemId, targetFolderId });
        const decryptedItemKey = await decryptData(
            targetKey.key,
            Uint8Array.fromBase64(movedItem.ItemKeys[0].Key),
            PassEncryptionTag.ItemKey
        );

        /** Check that we can recover the initial item key from the destination key */
        expect(movedItem.ItemID).toEqual(itemId);
        expect(movedItem.DestinationFolderID).toEqual(targetFolderId);
        expect(movedItem.ItemKeys[0].KeyRotation).toEqual(1);
        expect(decryptedItemKey).toStrictEqual(itemKey.raw);
    });
});
