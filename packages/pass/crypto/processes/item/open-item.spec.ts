import type { ItemRevisionContentsResponse, VaultKey } from '@proton/pass/types';
import { ItemState } from '@proton/pass/types';

import { generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { TEST_USER_KEY_ID, randomContents } from '../../utils/testing';
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
            ItemID: itemId,
            Revision: 1,
            KeyRotation: 1,
            ContentFormatVersion: createItemRequest.ContentFormatVersion,
            Content: createItemRequest.Content,
            ItemKey: createItemRequest.ItemKey,
            State: ItemState.Active,
            CreateTime: timestamp,
            ModifyTime: timestamp,
            LastUseTime: timestamp,
            RevisionTime: timestamp,
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
            ItemID: itemId,
            Revision: 12,
            KeyRotation: 2 /* ⛔️ */,
            ContentFormatVersion: createItemRequest.ContentFormatVersion,
            Content: createItemRequest.Content,
            ItemKey: createItemRequest.ItemKey,
            State: ItemState.Active,
            CreateTime: timestamp,
            ModifyTime: timestamp,
            LastUseTime: timestamp,
            RevisionTime: timestamp,
        };

        await expect(openItem({ encryptedItem, vaultKey })).rejects.toThrow(PassCryptoItemError);
    });
});
