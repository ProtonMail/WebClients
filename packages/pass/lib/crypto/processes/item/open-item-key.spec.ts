import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { TEST_USER_KEY_ID } from '@proton/pass/lib/crypto/utils/testing';
import type { ItemKeyResponse, VaultKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { openItemKey } from './open-item-key';

describe('openItemKey crypto process', () => {
    test('should decrypt item key accordingly', async () => {
        const key = generateKey();
        const itemKey = generateKey();

        const vaultKey: VaultKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const encryptedItemKey: ItemKeyResponse = {
            Key: uint8ArrayToBase64String(await encryptData(vaultKey.key, itemKey, PassEncryptionTag.ItemKey)),
            KeyRotation: 42,
        };

        const decryptedItemKey = await openItemKey({ encryptedItemKey, vaultKey });

        expect(decryptedItemKey.raw).toStrictEqual(itemKey);
        expect(decryptedItemKey.rotation).toStrictEqual(42);
        expect(decryptedItemKey.key).toBeDefined();
    });
});
