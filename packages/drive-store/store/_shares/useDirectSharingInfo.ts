import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import useDefaultShare from './useDefaultShare';
import { useDriveSharingFlags } from './useDriveSharingFlags';
import useShare from './useShare';
import { getSharedWithMeMembership } from './utils';

/*
 * This hook is meant to get additional info for direct sharing shares.
 *
 * Info: All useCallbacks don't have getShare, getShareWithKey and getDefaultShare in deps params.
 * This is due to issue with infinite rereding caused by issue in those functions hooks
 */

export const useDirectSharingInfo = () => {
    const { getDefaultShare } = useDefaultShare();
    const { getShare, getShareWithKey } = useShare();
    const { isReadOnlyMode } = useDriveSharingFlags();

    const isSharedWithMe = async (abortSignal: AbortSignal, shareId: string) => {
        const [defaultShare, share] = await Promise.all([getDefaultShare(abortSignal), getShare(abortSignal, shareId)]);

        // If volume is not the same as the main one, we can consider that it's a shared share
        return defaultShare.volumeId !== share.volumeId;
    };

    const getSharePermissions = async (abortSignal: AbortSignal, shareId: string) => {
        const sharedWithMe = await isSharedWithMe(abortSignal, shareId);
        // SharedWithMe memberships length is always 1, which may not be the case of default share,
        // that's why we don't use membership for permissions of normal share.
        if (!sharedWithMe) {
            return SHARE_MEMBER_PERMISSIONS.OWNER;
        }
        // Kill switch to disable all editing/modifications actions
        if (isReadOnlyMode) {
            return SHARE_MEMBER_PERMISSIONS.READ;
        }
        const share = await getShareWithKey(abortSignal, shareId);
        const membership = getSharedWithMeMembership(share.shareId, share.memberships);
        return membership.permissions;
    };

    const getDirectSharingInfo = async (abortSignal: AbortSignal, shareId: string) => {
        const sharedWithMe = await isSharedWithMe(abortSignal, shareId);
        if (!sharedWithMe) {
            return;
        }
        const share = await getShareWithKey(abortSignal, shareId);
        const membership = getSharedWithMeMembership(share.shareId, share.memberships);
        return {
            sharedOn: membership.createTime,
            sharedBy: membership.inviterEmail,
        };
    };

    return {
        isSharedWithMe,
        getSharePermissions,
        getDirectSharingInfo,
    };
};
