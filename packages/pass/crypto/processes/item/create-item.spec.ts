import type { VaultKey } from '@proton/pass/types';
import { CONTENT_FORMAT_VERSION, EncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { TEST_USER_KEY_ID, randomContents } from '../../utils/testing';
import { createItem } from './create-item';

describe('createItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should encrypt item content with item key and encrypt item key with vault key', async () => {
        const vaultKey: VaultKey = {
            raw: key,
            key: await getSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const item = await createItem({ content, vaultKey });
        const decryptedItemKey = await decryptData(
            vaultKey.key,
            base64StringToUint8Array(item.ItemKey),
            EncryptionTag.ItemKey
        );

        const itemKey = await getSymmetricKey(decryptedItemKey);
        const decryptedContent = await decryptData(
            itemKey,
            base64StringToUint8Array(item.Content),
            EncryptionTag.ItemContent
        );

        expect(item.ContentFormatVersion).toEqual(CONTENT_FORMAT_VERSION);
        expect(item.KeyRotation).toEqual(1);
        expect(decryptedContent).toStrictEqual(content);
    });

    test('should throw when provided with empty content', async () => {
        const vaultKey: VaultKey = {
            raw: key,
            key: await getSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        await expect(createItem({ content: new Uint8Array(0), vaultKey })).rejects.toThrow(PassCryptoItemError);
    });

    test('should throw if base64 content is over MAX_ITEM_CONTENT_B64_LENGTH', async () => {
        const vaultKey: VaultKey = {
            raw: key,
            key: await getSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        await expect(createItem({ content: new Uint8Array(40000), vaultKey })).rejects.toThrow(PassCryptoItemError);
    });
});
