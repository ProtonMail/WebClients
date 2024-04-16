import { generateKey, getSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import { TEST_USER_KEY_ID, randomContents } from '@proton/pass/lib/crypto/utils/testing';
import type { ItemRevisionContentsResponse, VaultKey } from '@proton/pass/types';
import { ItemState } from '@proton/pass/types';

import { createItem } from './create-item';
import { openItem } from './open-item';

describe('openItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();
    const timestamp = Math.floor(Date.now() / 1000);
    const itemId = `itemId-${Math.random()}`;

    test('should decrypt item accordingly', async () => {
        const vaultKey: VaultKey = {
            key: await getSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const createItemRequest = await createItem({ content, vaultKey });

        const encryptedItem: ItemRevisionContentsResponse = {
            Content: createItemRequest.Content,
            ContentFormatVersion: createItemRequest.ContentFormatVersion,
            CreateTime: timestamp,
            Flags: 0,
            ItemID: itemId,
            ItemKey: createItemRequest.ItemKey,
            KeyRotation: 1,
            LastUseTime: timestamp,
            ModifyTime: timestamp,
            Pinned: false,
            Revision: 1,
            RevisionTime: timestamp,
            State: ItemState.Active,
        };

        const item = await openItem({ encryptedItem, vaultKey });

        expect(item.itemId).toEqual(itemId);
        expect(item.contentFormatVersion).toEqual(createItemRequest.ContentFormatVersion);
        expect(item.content).toStrictEqual(content);
        expect(item.state).toEqual(ItemState.Active);
        expect(item.revision).toEqual(1);
    });

    test('should throw if provided with an incorrect share key rotation', async () => {
        const vaultKey: VaultKey = {
            key: await getSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const createItemRequest = await createItem({ content, vaultKey });

        const encryptedItem: ItemRevisionContentsResponse = {
            Content: createItemRequest.Content,
            ContentFormatVersion: createItemRequest.ContentFormatVersion,
            CreateTime: timestamp,
            Flags: 0,
            ItemID: itemId,
            ItemKey: createItemRequest.ItemKey,
            KeyRotation: 2 /* ⛔️ */,
            LastUseTime: timestamp,
            ModifyTime: timestamp,
            Pinned: false,
            Revision: 12,
            RevisionTime: timestamp,
            State: ItemState.Active,
        };

        await expect(openItem({ encryptedItem, vaultKey })).rejects.toThrow(PassCryptoItemError);
    });
});
