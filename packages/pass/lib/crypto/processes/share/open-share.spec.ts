import { openShareKey } from '@proton/pass/lib/crypto/processes/share/open-share-key';
import { createVault } from '@proton/pass/lib/crypto/processes/vault/create-vault';
import {
    createRandomKey,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '@proton/pass/lib/crypto/utils/testing';
import { ContentFormatVersion, type ShareGetResponse, ShareRole, ShareType } from '@proton/pass/types';

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
        const vaultKey = await openShareKey({
            shareKey: {
                CreateTime: 0,
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                UserKeyID: 'test_user_key_id',
            },
            userKeys: [userKey],
        });

        const encryptedShare: ShareGetResponse = {
            AddressID: addressId,
            Content: vault.Content,
            ContentFormatVersion: ContentFormatVersion.Share,
            ContentKeyRotation: 1,
            CreateTime: createTime,
            NewUserInvitesReady: 0,
            Owner: true,
            PendingInvites: 0,
            Permission: permission,
            Primary: false,
            Shared: false,
            ShareID: shareId,
            ShareRoleID: ShareRole.MANAGER,
            TargetID: vaultId,
            TargetMaxMembers: 2,
            TargetMembers: 0,
            TargetType: ShareType.Vault,
            VaultID: vaultId,
            CanAutoFill: true,
            Flags: 0,
        };

        const share = await openShare({ type: ShareType.Vault, encryptedShare, vaultKey });

        /* check share properties */
        expect(share.addressId).toEqual(addressId);
        expect(share.content).toStrictEqual(content);
        expect(share.contentFormatVersion).toEqual(ContentFormatVersion.Share);
        expect(share.contentKeyRotation).toEqual(1);
        expect(share.permission).toEqual(permission);
        expect(share.shareId).toEqual(shareId);
        expect(share.targetId).toEqual(vaultId);
        expect(share.targetType).toEqual(ShareType.Vault);
        expect(share.vaultId).toEqual(vaultId);
    });
});
