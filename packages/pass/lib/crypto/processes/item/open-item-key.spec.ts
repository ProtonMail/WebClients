import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { TEST_USER_KEY_ID } from '@proton/pass/lib/crypto/utils/testing';
import type { EncodedItemKeyRotation, VaultShareKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';

import { openItemKey } from './open-item-key';

describe('openItemKey crypto process', () => {
    test('should decrypt item key accordingly', async () => {
        const key = generateKey();
        const itemKey = generateKey();

        const shareKey: VaultShareKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const encryptedItemKey: EncodedItemKeyRotation = {
            Key: (await encryptData(shareKey.key, itemKey, PassEncryptionTag.ItemKey)).toBase64(),
            KeyRotation: 42,
        };

        const decryptedItemKey = await openItemKey({ encryptedItemKey, shareKey });

        expect(decryptedItemKey.raw).toStrictEqual(itemKey);
        expect(decryptedItemKey.rotation).toStrictEqual(42);
        expect(decryptedItemKey.key).toBeDefined();
    });
});
