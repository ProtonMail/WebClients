import { PassCrypto } from '@proton/pass/lib/crypto';
import { getAllShareKeys, getShareLatestEventId } from '@proton/pass/lib/shares/share.keys';
import { SYNC_STRATEGY } from '@proton/pass/lib/sync/global';
import { SyncStrategy } from '@proton/pass/lib/sync/types';
import { decodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { Maybe, Share, ShareContent, ShareGetResponse, ShareType } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

type ShareParserOptions = { eventId?: string; strategy?: SyncStrategy };

/** Resolves the latest event ID when the sync strategy is `LEGACY`.
 * The strategy defaults to the global `SYNC_STRATEGY` but can be overridden.
 * Pass `SyncStrategy.LEGACY` to force resolution during a V2→V1 rollback, or
 * `SyncStrategy.USER_EVENTS` to skip it for shares that won't be polled. Pass
 * `eventId` to reuse a known value and skip the extra request. */
export const parseShareResponse = async <T extends ShareType = ShareType>(
    encryptedShare: ShareGetResponse,
    options?: ShareParserOptions
): Promise<Maybe<Share<T>>> => {
    const shareId = encryptedShare.ShareID;

    try {
        const encryptedShareKeys = PassCrypto.canOpenShare(shareId) ? undefined : await getAllShareKeys(shareId);
        const eventId =
            (options?.strategy ?? SYNC_STRATEGY) === SyncStrategy.LEGACY
                ? (options?.eventId ?? (await getShareLatestEventId(shareId)))
                : undefined;

        const share = await PassCrypto.openShare<T>({ encryptedShare, encryptedShareKeys });

        if (share) {
            return {
                addressId: share.addressId,
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
                groupId: share.groupId,
                permission: share.permission,
            };
        }
    } catch (err) {
        /** A failure here (eg: from `getAllShareKeys`) means the share's keys
         * are unavailable, so it couldn't be decrypted anyway. Return `undefined`
         * and let the caller treat it as inactive. Transient errors should self
         * correct on the next poll or manual sync. */
        logger.warn(`[share] Failed parsing share ${logId(shareId)}`, err);
    }
};

export const parseUnpolledShareResponse = <T extends ShareType = ShareType>(
    encryptedShare: ShareGetResponse
): Promise<Maybe<Share<T>>> => parseShareResponse(encryptedShare, { strategy: SyncStrategy.USER_EVENTS });
