import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { getAllShareKeys, getShareLatestEventId } from '@proton/pass/lib/shares/share.requests';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { Maybe, Share, ShareGetResponse, ShareKeyResponse, VaultShareContent } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

export const getShareName = (share: Share): string => {
    switch (share.targetType) {
        case ShareType.Vault:
            const content = share.content as VaultShareContent;
            return content.name;
        case ShareType.Item:
        default:
            return 'Not defined yet';
    }
};

export const parseShareResponse = async (
    encryptedShare: ShareGetResponse,
    options?: { eventId?: string; shareKeys?: ShareKeyResponse[] }
): Promise<Maybe<Share<ShareType.Vault>>> => {
    const shareId = encryptedShare.ShareID;
    const [shareKeys, eventId] = await Promise.all([
        options?.shareKeys ?? getAllShareKeys(shareId),
        options?.eventId ?? getShareLatestEventId(shareId),
    ]);

    const share = await PassCrypto.openShare<ShareType.Vault>({ encryptedShare, shareKeys });

    if (share) {
        return {
            content: decodeVaultContent(share.content),
            createTime: share.createTime,
            eventId,
            newUserInvitesReady: share.newUserInvitesReady,
            owner: share.owner,
            shared: share.shared,
            shareId: share.shareId,
            shareRoleId: share.shareRoleId,
            targetId: share.targetId,
            targetMembers: share.targetMembers,
            targetMaxMembers: share.targetMaxMembers,
            targetType: share.targetType,
            vaultId: share.vaultId,
        };
    }
};
