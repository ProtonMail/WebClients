import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import {
    createRandomKey,
    randomAddress,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';
import lastItem from '@proton/utils/lastItem';

import { createVault } from '../vault/create-vault';
import { openShareKey } from './open-share-key';

describe('openShareKey crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt vault key using private user keys', async () => {
        const userKeys = [await createRandomKey(), await createRandomKey(), await createRandomKey()];
        const content = randomContents();

        const vault = await createVault({
            content,
            addressId: randomAddress().ID,
            userKey: lastItem(userKeys)!,
        });

        const vaultKey = await openShareKey({
            shareKey: {
                CreateTime: 0,
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                UserKeyID: 'test_user_key_id',
            },
            userKeys,
        });

        const decryptedContent = await decryptData(
            vaultKey.key,
            Uint8Array.fromBase64(vault.Content),
            PassEncryptionTag.VaultContent
        );

        expect(vaultKey.rotation).toEqual(1);
        expect(decryptedContent).toStrictEqual(content);
    });
});
