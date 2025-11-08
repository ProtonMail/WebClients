import { useRef } from 'react';

import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

import { getIsPublicContext } from '../../utils/getIsPublicContext';
import type { ShareWithKey } from './interface';
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
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();
    const { getShare, getShareWithKey } = useShare();
    const { isReadOnlyMode } = useDriveSharingFlags();
    const isPublicContext = getIsPublicContext();
    const defaultSharePromiseRef = useRef<Promise<ShareWithKey> | undefined>(undefined);
    const photoSharePromiseRef = useRef<Promise<ShareWithKey | undefined> | undefined>(undefined);

    if (!defaultSharePromiseRef.current && !isPublicContext) {
        defaultSharePromiseRef.current = getDefaultShare();
    }

    if (!photoSharePromiseRef.current && !isPublicContext) {
        photoSharePromiseRef.current = getDefaultPhotosShare();
    }

    const isSharedWithMe = async (abortSignal: AbortSignal, shareId: string): Promise<boolean> => {
        const [defaultShare, photoShare, share] = await Promise.all([
            defaultSharePromiseRef.current,
            photoSharePromiseRef.current,
            getShare(abortSignal, shareId),
        ]);

        return (
            defaultShare?.volumeId !== share.volumeId && (photoShare ? photoShare.volumeId !== share.volumeId : true)
        );
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
            return SHARE_MEMBER_PERMISSIONS.VIEWER;
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
