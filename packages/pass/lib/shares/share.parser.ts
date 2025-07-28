import { PassCrypto } from '@proton/pass/lib/crypto';
import { getAllShareKeys, getShareLatestEventId } from '@proton/pass/lib/shares/share.requests';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { Maybe, Share, ShareContent, ShareGetResponse, ShareKeyResponse, ShareType } from '@proton/pass/types';

export const parseShareResponse = async <T extends ShareType = ShareType>(
    encryptedShare: ShareGetResponse,
    options?: { eventId?: string; shareKeys?: ShareKeyResponse[] }
): Promise<Maybe<Share<T>>> => {
    const shareId = encryptedShare.ShareID;
    const [shareKeys, eventId] = await Promise.all([
        options?.shareKeys ?? getAllShareKeys(shareId),
        options?.eventId ?? getShareLatestEventId(shareId),
    ]);

    const share = await PassCrypto.openShare<T>({ encryptedShare, shareKeys });

    if (share) {
        return {
            content: (share.content ? decodeVaultContent(share.content) : {}) as ShareContent<T>,
            createTime: share.createTime,
            eventId,
            canAutofill: share.canAutofill,
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
            flags: share.flags,
        };
    }
};
