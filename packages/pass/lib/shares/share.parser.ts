import { PassCrypto } from '@proton/pass/lib/crypto';
import { getAllShareKeys, getShareLatestEventId } from '@proton/pass/lib/shares/share.requests';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { Maybe, Share, ShareGetResponse, ShareKeyResponse } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

export const parseShareResponse = async (
    encryptedShare: ShareGetResponse,
    options?: { eventId?: string; shareKeys?: ShareKeyResponse[] }
): Promise<Maybe<Share<ShareType.Vault>>> => {
    const shareId = encryptedShare.ShareID;
    const [shareKeys, eventId] = await Promise.all([
        options?.shareKeys ?? getAllShareKeys(shareId),
        options?.eventId ?? getShareLatestEventId(shareId),
    ]);

    /** Remove when supporting Item shares */
    if (encryptedShare.TargetType !== ShareType.Vault) return;

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
