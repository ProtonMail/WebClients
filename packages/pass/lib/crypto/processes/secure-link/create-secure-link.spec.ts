import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { type ItemKey, PassEncryptionTag, type VaultKey } from '@proton/pass/types';

import { createSecureLink } from './create-secure-link';

describe('createSecureLink crypto process', () => {
    test('should generate a secure-link key to encrypt the item key with', async () => {
        const rawItemKey = generateKey();
        const rawVaultKey = generateKey();

        const itemKey: ItemKey = {
            key: await importSymmetricKey(rawItemKey),
            raw: rawItemKey,
            rotation: 1,
        };

        const vaultKey: VaultKey = {
            key: await importSymmetricKey(rawVaultKey),
            raw: rawVaultKey,
            rotation: 1,
            userKeyId: 'userkey-id',
        };

        const result = await createSecureLink({ itemKey, vaultKey });

        expect(result.encryptedItemKey instanceof Uint8Array).toBe(true);
        expect(result.secureLinkKey instanceof Uint8Array).toBe(true);
        expect(result.encryptedLinkKey instanceof Uint8Array).toBe(true);

        const secureLinkKey = await importSymmetricKey(result.secureLinkKey);
        const decryptedItemKey = await decryptData(secureLinkKey, result.encryptedItemKey, PassEncryptionTag.ItemKey);
        const decryptedLinkKey = await decryptData(vaultKey.key, result.encryptedLinkKey, PassEncryptionTag.LinkKey);

        expect(decryptedItemKey).toStrictEqual(itemKey.raw);
        expect(decryptedLinkKey).toStrictEqual(result.secureLinkKey);
    });
});
