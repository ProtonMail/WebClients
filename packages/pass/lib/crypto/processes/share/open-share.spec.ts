import { CONTENT_FORMAT_VERSION, type ShareGetResponse, ShareType } from '@proton/pass/types';

import { createRandomKey, randomContents, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../utils/testing';
import { createVault } from '../vault/create-vault';
import { openVaultKey } from '../vault/open-vault-key';
import { openShare } from './open-share';

describe('openShare crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    const content = randomContents();
    const createTime = Math.floor(Date.now() / 1000);
    const vaultId = `vaultId-${Math.random()}`;
    const shareId = `shareId-${Math.random()}`;
    const addressId = `addressId-${Math.random()}`;
    const permission = Math.random();

    test('should decrypt VaultShare accordingly', async () => {
        const userKey = await createRandomKey();
        const vault = await createVault({ content, addressId, userKey });

        /* resolve vault key */
        const vaultKey = await openVaultKey({
            shareKey: {
                KeyRotation: 1,
                Key: vault.EncryptedVaultKey,
                CreateTime: 0,
            },
            userKeys: [userKey],
        });

        const encryptedShare: ShareGetResponse = {
            AddressID: addressId,
            Content: vault.Content,
            ContentFormatVersion: CONTENT_FORMAT_VERSION,
            ContentKeyRotation: 1,
            CreateTime: createTime,
            NewUserInvitesReady: 0,
            Owner: true,
            PendingInvites: 0,
            Permission: permission,
            Primary: false,
            Shared: false,
            ShareID: shareId,
            TargetID: vaultId,
            TargetMaxMembers: 2,
            TargetMembers: 0,
            TargetType: ShareType.Vault,
            VaultID: vaultId,
        };

        const share = await openShare({ type: ShareType.Vault, encryptedShare, vaultKey });

        /* check share properties */
        expect(share.addressId).toEqual(addressId);
        expect(share.content).toStrictEqual(content);
        expect(share.contentFormatVersion).toEqual(CONTENT_FORMAT_VERSION);
        expect(share.contentKeyRotation).toEqual(1);
        expect(share.permission).toEqual(permission);
        expect(share.shareId).toEqual(shareId);
        expect(share.targetId).toEqual(vaultId);
        expect(share.targetType).toEqual(ShareType.Vault);
        expect(share.vaultId).toEqual(vaultId);
    });
});
