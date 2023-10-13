import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { getAllShareKeys, getShareLatestEventId } from '@proton/pass/lib/shares/share.requests';
import { decodeVaultContent, encodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { VaultTransferOwnerIntent } from '@proton/pass/types';
import { type Share, type ShareContent, ShareRole, type ShareType, type VaultCreateRequest } from '@proton/pass/types';

export const createVault = async (data: {
    content: ShareContent<ShareType.Vault>;
    primary?: boolean;
}): Promise<Share<ShareType.Vault>> => {
    const encoded = encodeVaultContent(data.content);

    const encryptedVault: VaultCreateRequest = {
        ...(await PassCrypto.createVault(encoded)),
        Primary: data.primary ?? false,
    };

    const encryptedShare = (
        await api({
            url: 'pass/v1/vault',
            method: 'post',
            data: encryptedVault,
        })
    ).Share!;

    const [eventId, shareKeys] = await Promise.all([
        getShareLatestEventId(encryptedShare.ShareID),
        getAllShareKeys(encryptedShare.ShareID),
    ]);

    const share = await PassCrypto.openShare<ShareType.Vault>({ encryptedShare, shareKeys });
    if (!share) throw new Error(c('Error').t`Could not open created vault`);

    const content = decodeVaultContent(share.content);

    return {
        content,
        createTime: share.createTime,
        eventId,
        owner: true,
        primary: Boolean(encryptedShare.Primary),
        shared: false,
        shareId: share.shareId,
        shareRoleId: ShareRole.ADMIN,
        targetId: share.targetId,
        targetMembers: 1,
        targetType: share.targetType,
        vaultId: share.vaultId,
    };
};

export const editVault = async (
    shareId: string,
    content: ShareContent<ShareType.Vault>
): Promise<Share<ShareType.Vault>> => {
    /**
     * Future-proofing : retrieve all share keys
     * and update the share in the crypto context
     */
    const [eventId, shareKeys] = await Promise.all([getShareLatestEventId(shareId), getAllShareKeys(shareId)]);
    await PassCrypto.updateShareKeys({ shareId, shareKeys });

    const encoded = encodeVaultContent(content);
    const encryptedVaultUpdate = await PassCrypto.updateVault({ shareId, content: encoded });

    const encryptedShare = (
        await api({
            url: `pass/v1/vault/${shareId}`,
            method: 'put',
            data: encryptedVaultUpdate,
        })
    ).Share!;

    const share = await PassCrypto.openShare<ShareType.Vault>({ encryptedShare, shareKeys });
    if (!share) throw new Error(c('Error').t`Could not open updated vault`);

    return {
        createTime: share.createTime,
        content: decodeVaultContent(share.content),
        eventId,
        owner: share.owner,
        primary: Boolean(encryptedShare.Primary),
        shared: share.shared,
        shareId: share.shareId,
        shareRoleId: share.shareRoleId,
        targetId: share.targetId,
        targetMembers: share.targetMembers,
        targetType: share.targetType,
        vaultId: share.vaultId,
    };
};

export const vaultTransferOwner = async ({ shareId, userShareId }: VaultTransferOwnerIntent) =>
    api({
        url: `pass/v1/vault/${shareId}/owner`,
        method: 'put',
        data: { NewOwnerShareID: userShareId },
    });
