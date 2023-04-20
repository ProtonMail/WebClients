import { EncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import lastItem from '@proton/utils/lastItem';

import { decryptData } from '../../utils/crypto-helpers';
import {
    createRandomKey,
    randomAddress,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createVault } from './create-vault';
import { openVaultKey } from './open-vault-key';

describe('openVaultKey crypto process', () => {
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

        const vaultKey = await openVaultKey({
            shareKey: { Key: vault.EncryptedVaultKey, KeyRotation: 1, CreateTime: 0 },
            userKeys,
        });

        const decryptedContent = await decryptData(
            vaultKey.key,
            base64StringToUint8Array(vault.Content),
            EncryptionTag.VaultContent
        );

        expect(vaultKey.rotation).toEqual(1);
        expect(decryptedContent).toStrictEqual(content);
    });
});
