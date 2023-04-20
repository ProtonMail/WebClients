import { CONTENT_FORMAT_VERSION, EncryptionTag, ItemKey } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { randomContents } from '../../utils/testing';
import { updateItem } from './update-item';

describe('updateItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should re-encrypt item content with supplied item key', async () => {
        const itemKey: ItemKey = {
            key: await getSymmetricKey(key),
            raw: key,
            rotation: 42,
        };

        const update = await updateItem({ content, itemKey, lastRevision: 3 });

        expect(update.ContentFormatVersion).toEqual(CONTENT_FORMAT_VERSION);
        expect(update.KeyRotation).toEqual(itemKey.rotation);
        expect(update.LastRevision).toEqual(3);

        const decryptedContent = await decryptData(
            itemKey.key,
            base64StringToUint8Array(update.Content!),
            EncryptionTag.ItemContent
        );

        expect(decryptedContent).toStrictEqual(content);
    });

    test('should throw when provided with empty content', async () => {
        const itemKey: ItemKey = {
            key: await getSymmetricKey(key),
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
});
