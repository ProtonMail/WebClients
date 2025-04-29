import { useEffect, useMemo, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import type { SharedWithMeItem } from '../../components/sections/SharedWithMe/SharedWithMe';
import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveEventManager } from '../_events';
import { useInvitationsListing } from '../_invitations/useInvitationsListing';
import { useUserSettings } from '../_settings';
import { useDefaultShare } from '../_shares';
import { useMemoArrayNoMatterTheOrder } from './utils';

export const useInvitationsView = () => {
    const [isLoading, withLoading] = useLoading(true);
    const { getCachedInvitations, loadInvitations } = useInvitationsListing();
    const driveEventManager = useDriveEventManager();
    const [showPhotosWithAlbums, setShowPhotosWithAlbums] = useState<undefined | boolean>();

    const cachedInvitations = getCachedInvitations();
    const invitations = useMemoArrayNoMatterTheOrder(
        cachedInvitations.filter((invitation) => invitation.link.type !== LinkType.ALBUM || showPhotosWithAlbums)
    );
    const { getDefaultPhotosShare } = useDefaultShare();

    const { photosWithAlbumsEnabled } = useUserSettings();

    const invitationsBrowserItems: SharedWithMeItem[] = useMemo(
        () =>
            invitations.reduce<SharedWithMeItem[]>((acc, item) => {
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
        [invitations]
    );

    useEffect(() => {
        const abortController = new AbortController();
        const unsubscribe = driveEventManager.eventHandlers.subscribeToCore((event) => {
            if (event.DriveShareRefresh?.Action === EVENT_ACTIONS.UPDATE) {
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

        if (photosWithAlbumsEnabled) {
            setShowPhotosWithAlbums(true);
        } else {
            void getDefaultPhotosShare(abortController.signal).then((photosShare) =>
                setShowPhotosWithAlbums(photosShare?.volumeType === VolumeType.Photos)
            );
        }

        return () => {
            abortController.abort();
        };
    }, []);

    return { invitations, invitationsBrowserItems, isLoading };
};
