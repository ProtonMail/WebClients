import type { ItemKey } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { decryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { randomContents } from '../../utils/testing';
import { updateItem } from './update-item';

describe('updateItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should re-encrypt item content with supplied item key', async () => {
        const itemKey: ItemKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 42,
        };

        const update = await updateItem({ content, itemKey, lastRevision: 3 });

        expect(update.ContentFormatVersion).toEqual(ContentFormatVersion.Item);
        expect(update.KeyRotation).toEqual(itemKey.rotation);
        expect(update.LastRevision).toEqual(3);

        const decryptedContent = await decryptData(
            itemKey.key,
            Uint8Array.fromBase64(update.Content!),
            PassEncryptionTag.ItemContent
        );

        expect(decryptedContent).toStrictEqual(content);
    });

    test('should throw when provided with empty content', async () => {
        const itemKey: ItemKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 42,
        };

        await expect(
            updateItem({
                content: new Uint8Array(0),
                itemKey,
                lastRevision: 3,
            })
        ).rejects.toThrow(PassCryptoItemError);
    });

    test('should throw if base64 content is over MAX_ITEM_CONTENT_B64_LENGTH', async () => {
        const itemKey: ItemKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 42,
        };

        await expect(
            updateItem({
                content: new Uint8Array(40000),
                itemKey,
                lastRevision: 3,
            })
        ).rejects.toThrow(PassCryptoItemError);
    });
});
