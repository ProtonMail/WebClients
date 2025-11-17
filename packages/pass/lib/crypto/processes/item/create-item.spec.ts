import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import { TEST_USER_KEY_ID, randomContents } from '@proton/pass/lib/crypto/utils/testing';
import type { VaultShareKey } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';

import { createItem } from './create-item';

describe('createItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should encrypt item content with item key and encrypt item key with vault key', async () => {
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const item = await createItem({ content, vaultKey });
        const decryptedItemKey = await decryptData(
            vaultKey.key,
            Uint8Array.fromBase64(item.ItemKey),
            PassEncryptionTag.ItemKey
        );

        const itemKey = await importSymmetricKey(decryptedItemKey);
        const decryptedContent = await decryptData(
            itemKey,
            Uint8Array.fromBase64(item.Content),
            PassEncryptionTag.ItemContent
        );

        expect(item.ContentFormatVersion).toEqual(ContentFormatVersion.Item);
        expect(item.KeyRotation).toEqual(1);
        expect(decryptedContent).toStrictEqual(content);
    });

    test('should throw when provided with empty content', async () => {
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        await expect(createItem({ content: new Uint8Array(0), vaultKey })).rejects.toThrow(PassCryptoItemError);
    });

    test('should throw if base64 content is over MAX_ITEM_CONTENT_B64_LENGTH', async () => {
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        await expect(createItem({ content: new Uint8Array(40000), vaultKey })).rejects.toThrow(PassCryptoItemError);
    });
});
