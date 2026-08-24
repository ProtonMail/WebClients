import lastItem from '@proton/utils/lastItem';

import { PassEncryptionTag } from '../../../../types';
import { decryptData } from '../../utils/crypto-helpers';
import {
    createRandomKey,
    randomAddress,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createVault } from '../vault/create-vault';
import { openShareKey } from './open-share-key';

describe('openShareKey crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt vault key using private user keys', async () => {
        const userKeys = [await createRandomKey(), await createRandomKey(), await createRandomKey()];
        const userKey = lastItem(userKeys)!;
        const content = randomContents();

        const vault = await createVault({
            content,
            addressId: randomAddress().ID,
            encryptionKey: userKey,
            signingKey: userKey,
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
