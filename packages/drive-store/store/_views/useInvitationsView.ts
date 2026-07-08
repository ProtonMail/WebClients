import { useEffect, useMemo } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveEventManager } from '../_events';
import type { ExtendedInvitationDetails } from '../_invitations/interface';
import { useInvitationsListing } from '../_invitations/useInvitationsListing';
import type { AlbumProperties, EncryptedLink, PhotoProperties, SignatureIssues } from '../_links';
import { useMemoArrayNoMatterTheOrder } from './utils';

interface FileBrowserBaseItem {
    id: string;
    linkId: string;
    isLocked?: boolean;
    isInvitation?: boolean;
    isBookmark?: boolean;
    itemRowStyle?: React.CSSProperties;
    isAnonymous?: boolean;
    albumProperties?: AlbumProperties;
    photoProperties?: PhotoProperties;
}

interface SharedWithMeItem extends FileBrowserBaseItem {
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail?: boolean;
    isFile: boolean;
    mimeType: string;
    name: string;
    signatureIssues?: SignatureIssues;
    signatureEmail?: string;
    size: number;
    trashed: number | null;
    rootShareId: string;
    volumeId: string;
    sharedOn?: number;
    sharedBy?: string;
    parentLinkId: string;
    invitationDetails?: ExtendedInvitationDetails;
    bookmarkDetails?: { token: string; createTime: number; urlPassword: string };
}
export const useInvitationsView = () => {
    const [isLoading, withLoading] = useLoading(true);
    const { getCachedInvitations, loadInvitations } = useInvitationsListing();
    const driveEventManager = useDriveEventManager();
    const cachedInvitations = getCachedInvitations();

    const invitations = useMemoArrayNoMatterTheOrder(
        cachedInvitations.filter((invitation) => invitation.link.type !== LinkType.ALBUM)
    );

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

        return () => {
            abortController.abort();
        };
    }, []);

    return { invitations, invitationsBrowserItems, isLoading };
};
