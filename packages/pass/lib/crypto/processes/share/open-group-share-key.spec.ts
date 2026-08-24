import { PassEncryptionTag } from '../../../../types';
import { decryptData } from '../../utils/crypto-helpers';
import {
    createRandomGroupKey,
    createRandomKey,
    randomAddress,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createVault } from '../vault/create-vault';
import { openGroupShareKey } from './open-group-share-key';

const createGroupVault = async (content: Uint8Array<ArrayBuffer>) => {
    const addressKey = await createRandomKey();
    const addressKeys = [addressKey];

    const { groupKey, groupPublicKey } = await createRandomGroupKey('groupId');

    const vault = await createVault({
        content,
        encryptionKey: addressKey,
        signingKey: groupKey,
        addressId: randomAddress().ID,
    });

    return { addressKeys, groupPublicKey, vault };
};

describe('openGroupShareKey crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should decrypt vault key using private user keys', async () => {
        const content = randomContents();
        const { addressKeys, groupPublicKey, vault } = await createGroupVault(content);

        const vaultKey = await openGroupShareKey({
            shareKey: {
                CreateTime: 0,
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                UserKeyID: 'test_user_key_id',
            },
            addressKeys,
            groupPublicKeys: [groupPublicKey],
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
