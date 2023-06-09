import type { ItemKeyResponse, VaultKey } from '@proton/pass/types';
import { EncryptionTag } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { encryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { TEST_USER_KEY_ID } from '../../utils/testing';
import { openItemKey } from './open-item-key';

describe('openItemKey crypto process', () => {
    const key = generateKey();
    const itemKey = generateKey();

    test('should decrypt item key accordingly', async () => {
        const vaultKey: VaultKey = {
            key: await getSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const encryptedItemKey: ItemKeyResponse = {
            Key: uint8ArrayToBase64String(await encryptData(vaultKey.key, itemKey, EncryptionTag.ItemKey)),
            KeyRotation: 42,
        };

        const decryptedItemKey = await openItemKey({ encryptedItemKey, vaultKey });

        expect(decryptedItemKey.raw).toStrictEqual(itemKey);
        expect(decryptedItemKey.rotation).toStrictEqual(42);
        expect(decryptedItemKey.key).toBeDefined();
    });
});
