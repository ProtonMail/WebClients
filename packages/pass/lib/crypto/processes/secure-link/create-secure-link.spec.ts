import type { ItemKey } from '../../../../types';
import { PassEncryptionTag } from '../../../../types';
import { decryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { createSecureLink } from './create-secure-link';

describe('createSecureLink crypto process', () => {
    test('should generate a secure-link key to encrypt the item key with', async () => {
        const rawItemKey = generateKey();

        const itemKey: ItemKey = {
            key: await importSymmetricKey(rawItemKey),
            raw: rawItemKey,
            rotation: 1,
        };

        const result = await createSecureLink({ itemKey });

        expect(result.encryptedItemKey instanceof Uint8Array).toBe(true);
        expect(result.secureLinkKey instanceof Uint8Array).toBe(true);
        expect(result.encryptedLinkKey instanceof Uint8Array).toBe(true);

        const secureLinkKey = await importSymmetricKey(result.secureLinkKey);
        const decryptedItemKey = await decryptData(secureLinkKey, result.encryptedItemKey, PassEncryptionTag.ItemKey);
        const decryptedLinkKey = await decryptData(itemKey.key, result.encryptedLinkKey, PassEncryptionTag.LinkKey);

        expect(decryptedItemKey).toStrictEqual(itemKey.raw);
        expect(decryptedLinkKey).toStrictEqual(result.secureLinkKey);
    });
});
