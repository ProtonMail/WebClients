import { useEffect, useMemo } from 'react';

import useLoading from '@proton/hooks/useLoading';

import type { SharedWithMeItem } from '../../components/sections/SharedWithMe/SharedWithMe';
import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveEventManager } from '../_events';
import { useInvitationsListing } from '../_invitations/useInvitationsListing';

export const useInvitationsView = () => {
    const [isLoading, withLoading] = useLoading(true);
    const { getCachedInvitations, loadInvitations } = useInvitationsListing();
    const driveEventManager = useDriveEventManager();

    const cachedInvitations = getCachedInvitations();

    const invitationsBrowserItems: SharedWithMeItem[] = useMemo(
        () =>
            cachedInvitations.reduce<SharedWithMeItem[]>((acc, item) => {
                acc.push({
                    isFile: item.link.isFile,
                    trashed: null,
                    mimeType: item.link.mimeType,
                    rootShareId: item.share.shareId,
                    id: item.share.shareId,
                    // DecrypptedLinkName will always be defined as it's retrieve in the listing
                    name: item.decryptedLinkName || '',
                    invitationDetails: item,
                    sharedBy: item.invitation.inviterEmail,
                    isInvitation: true,
                    size: 0,
                    isLocked: item.isLocked,
                    linkId: item.link.linkId,
                    parentLinkId: '',
                    volumeId: item.share.volumeId,
                });
                return acc;
            }, []),
        [cachedInvitations]
    );

    useEffect(() => {
        const abortController = new AbortController();
        const unsubscribe = driveEventManager.eventHandlers.subscribeToCore((event) => {
            if (event.DriveShareRefresh?.Action === 2) {
                loadInvitations(abortController.signal).catch(sendErrorReport);
            }
        });
        return () => {
            unsubscribe();
            abortController.abort();
        };
    }, [driveEventManager.eventHandlers.subscribeToCore]);

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(loadInvitations(abortController.signal).catch(sendErrorReport));

        return () => {
            abortController.abort();
        };
    }, []);

    return { invitations: cachedInvitations, invitationsBrowserItems, isLoading };
};
