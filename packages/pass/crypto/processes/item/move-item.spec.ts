import { CONTENT_FORMAT_VERSION, EncryptionTag, ItemKey, VaultKey } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { randomContents } from '../../utils/testing';
import { moveItem } from './move-item';

describe('moveItem crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should re-encrypt item content with destination vault key', async () => {
        const destinationShareId = `shareId-${Math.random()}`;
        const destinationVaultKey: ItemKey = {
            key: await getSymmetricKey(key),
            raw: key,
            rotation: 42,
        };

        const movedItem = await moveItem({ content, destinationVaultKey, destinationShareId });

        expect(movedItem.Item.ContentFormatVersion).toEqual(CONTENT_FORMAT_VERSION);
        expect(movedItem.Item.KeyRotation).toEqual(destinationVaultKey.rotation);

        const newItemKey = await decryptData(
            destinationVaultKey.key,
            base64StringToUint8Array(movedItem.Item.ItemKey),
            EncryptionTag.ItemKey
        );

        const decryptedContent = await decryptData(
            await getSymmetricKey(newItemKey),
            base64StringToUint8Array(movedItem.Item.Content!),
            EncryptionTag.ItemContent
        );

        expect(decryptedContent).toStrictEqual(content);
    });

    test('should throw when provided with empty content', async () => {
        const vaultKey: VaultKey = {
            key: await getSymmetricKey(key),
            raw: key,
            rotation: 42,
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
