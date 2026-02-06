import { openGroupShareKey } from '@proton/pass/lib/crypto/processes/share/open-group-share-key';
import { createVault } from '@proton/pass/lib/crypto/processes/vault/create-vault';
import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import {
    createRandomGroupKey,
    createRandomKey,
    randomAddress,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';

const createGroupVault = async (content: Uint8Array<ArrayBuffer>) => {
    const addressKey = await createRandomKey();
    const addressKeys = [addressKey];

    const { group, groupKey } = await createRandomGroupKey('groupId');
    const groupKeys = group.Address.Keys;

    const vault = await createVault({
        content,
        encryptionKey: addressKey,
        signingKey: groupKey,
        addressId: randomAddress().ID,
    });

    return { addressKeys, groupKeys, vault };
};

describe('openGroupShareKey crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt vault key using private user keys', async () => {
        const content = randomContents();
        const { addressKeys, groupKeys, vault } = await createGroupVault(content);

        const vaultKey = await openGroupShareKey({
            shareKey: {
                CreateTime: 0,
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                UserKeyID: 'test_user_key_id',
            },
            addressKeys,
            groupKeys,
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
