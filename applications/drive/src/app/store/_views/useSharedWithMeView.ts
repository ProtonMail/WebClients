import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortParams } from '../../components/FileBrowser';
import type { SharedWithMeItem } from '../../components/sections/SharedWithMe/SharedWithMe';
import { useRedirectToPublicPage } from '../../hooks/util/useRedirectToPublicPage';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { getTokenFromSearchParams } from '../../utils/url/token';
import { useBookmarksActions, useDriveShareURLBookmarkingFeatureFlag } from '../_bookmarks';
import { useLink, useLinksListing } from '../_links';
import { usePendingInvitationsListing } from '../_links/useLinksListing/usePendingInvitationsListing';
import { useUserSettings } from '../_settings';
import { useShareInvitation } from '../_shares';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useLoadLinksShareInfo } from '../_shares/useLoadLinksShareInfo';
import { useVolumesState } from '../_volumes';
import { useAbortSignal, useMemoArrayNoMatterTheOrder, useSortingWithDefault } from './utils';
import { sortItemsWithPositions } from './utils/sortItemsWithPositions';
import type { SortField } from './utils/useSorting';

const DEFAULT_SORT = {
    sortField: 'sharedOn' as SortField,
    sortOrder: SORT_DIRECTION.DESC,
};

/**
 * useSharedWithMeView provides data for shared with me links view (file browser of shared links).
 * @params {string} shareId
 * @params {boolean} disabledByFF, This is used to prevent loading on InitContainer if the flag is enabled.
 * Context is that we want to show the section if user have FF disabled for sharing by have item shared with him.
 * TODO: This should be removed after full rollout
 */
export default function useSharedWithMeView(shareId: string) {
    const [isLoading, withLoading] = useLoading(true);
    const [isPendingLoading, withPendingLoading] = useLoading(true);
    const isDriveShareUrlBookmarkingEnabled = useDriveShareURLBookmarkingFeatureFlag();
    const [isBookmarksLoading, withBookmarksLoading] = useLoading(isDriveShareUrlBookmarkingEnabled);
    const linksListing = useLinksListing();
    const { setVolumeShareIds } = useVolumesState();
    const { getLink } = useLink();
    const { acceptInvitation, rejectInvitation } = useShareInvitation();
    const { getDirectSharingInfo } = useDirectSharingInfo();
    const { createNotification } = useNotifications();
    const [acceptedInvitationsPosition, setAcceptedInvitationsPosition] = useState<Map<string, number>>(new Map());
    const {
        pendingInvitations,
        removePendingInvitation,
        getPendingInvitation,
        updatePendingInvitation,
        loadPendingInvitations,
    } = usePendingInvitationsListing();
    const { addBookmarkFromPrivateApp } = useBookmarksActions();
    const { cleanupUrl } = useRedirectToPublicPage();

    const loadSharedWithMeLinks = useCallback(async (signal: AbortSignal) => {
        await linksListing.loadLinksSharedWithMeLink(signal);
    }, []); //TODO: No deps params as too much work needed in linksListing
    const abortSignal = useAbortSignal([]);
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedWithMeLink(abortSignal);
    const { links: bookmarksLinks, isDecrypting: isDecryptingBookmarks } =
        linksListing.getCachedBookmarksLinks(abortSignal);

    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks.concat(bookmarksLinks));

    const { layout } = useUserSettings();

    const { isLoading: isShareInfoLoading, linksWithShareInfo } = useLoadLinksShareInfo({
        shareId,
        links: cachedSharedLinks,
        areLinksLoading: isDecrypting || isLoading,
    });
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(
        isShareInfoLoading ? cachedSharedLinks : linksWithShareInfo,
        DEFAULT_SORT
    );

    const browserItems: SharedWithMeItem[] = sortedList.reduce<SharedWithMeItem[]>((acc, item) => {
        // rootShareId is equivalent of token in this context
        const bookmarkDetails = linksListing.getCachedBookmarkDetails(item.rootShareId);
        acc.push({
            ...item,
            id: item.rootShareId,
            isBookmark: !!bookmarkDetails,
            bookmarkDetails: bookmarkDetails ?? undefined,
        });
        return acc;
    }, []);

    const invitationsBrowserItems: SharedWithMeItem[] = [...pendingInvitations.values()].reduce<SharedWithMeItem[]>(
        (acc, item) => {
            acc.push({
                isFile: item.link.isFile,
                trashed: null,
                mimeType: item.link.mimeType,
                rootShareId: item.share.shareId,
                id: item.share.shareId,
                name: item.link.name,
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
        },
        []
    );

    const sortedItems = useMemo(
        () => sortItemsWithPositions([...invitationsBrowserItems, ...browserItems], acceptedInvitationsPosition),
        [invitationsBrowserItems, browserItems, acceptedInvitationsPosition]
    );

    const acceptPendingInvitation = async (invitationId: string) => {
        const abortSignal = new AbortController().signal;
        const pendingInvitation = getPendingInvitation(invitationId);
        updatePendingInvitation({ ...pendingInvitation, isLocked: true });
        await acceptInvitation(abortSignal, pendingInvitation)
            .then((response) => {
                if (response?.Code !== 1000) {
                    throw new EnrichedError(c('Notification').t`Failed to accept share invitation`, {
                        tags: {
                            volumeId: pendingInvitation.share.volumeId,
                            shareId: pendingInvitation.share.shareId,
                            linkId: pendingInvitation.link.linkId,
                            invitationId,
                        },
                    });
                }
            })
            .catch((error) => {
                sendErrorReport(error);
                createNotification({
                    type: 'error',
                    text: error.message,
                });
                updatePendingInvitation({ ...pendingInvitation, isLocked: false });
                throw error;
            });

        // Preload link's info
        await Promise.all([
            getLink(abortSignal, pendingInvitation.share.shareId, pendingInvitation.link.linkId),
            getDirectSharingInfo(abortSignal, pendingInvitation.share.shareId),
        ]);

        const index = sortedItems.findIndex((item) => item.rootShareId === pendingInvitation.share.shareId);

        setAcceptedInvitationsPosition((prevState) => {
            const newState = new Map(prevState);
            newState.set(pendingInvitation.share.shareId, index);
            return newState;
        });
        // TODO: Remove this when we will have events
        linksListing.setSharedWithMeShareIdsState([pendingInvitation.share.shareId]);
        setVolumeShareIds(pendingInvitation.share.volumeId, [pendingInvitation.share.shareId]);

        removePendingInvitation(pendingInvitation.invitation.invitationId);
        createNotification({
            type: 'success',
            text: c('Notification').t`Share invitation accepted successfully`,
        });
    };

    const rejectPendingInvitation = async (invitationId: string) => {
        // When rejecting an invitation, we can optimistically remove it, and if any issue occurs, we add it back.
        const pendingInvitation = getPendingInvitation(invitationId);
        removePendingInvitation(invitationId);
        await rejectInvitation(new AbortController().signal, invitationId)
            .then((response) => {
                if (response?.Code !== 1000) {
                    throw new EnrichedError(c('Notification').t`Failed to reject share invitation`, {
                        tags: {
                            volumeId: pendingInvitation.share.volumeId,
                            shareId: pendingInvitation.share.shareId,
                            linkId: pendingInvitation.link.linkId,
                            invitationId,
                        },
                    });
                }
            })
            .catch((err) => {
                createNotification({
                    type: 'error',
                    text: err.message,
                });
                // Adding invite back if any issue happened
                if (pendingInvitation) {
                    updatePendingInvitation(pendingInvitation);
                }
                throw err;
            });
        createNotification({
            type: 'success',
            text: c('Notification').t`Share invitation declined`,
        });
    };

    useEffect(() => {
        // Even if the user is going into a folder, we keep shared with me items decryption ongoing in the background
        // This is due to issue with how we decrypt stuff, to prevent infinite loop
        void withLoading(async () => loadSharedWithMeLinks(abortSignal)).catch(sendErrorReport);
        void withPendingLoading(async () => loadPendingInvitations(abortSignal)).catch(sendErrorReport);
        if (isDriveShareUrlBookmarkingEnabled) {
            void withBookmarksLoading(async () => {
                // In case the user Sign-up from public page we will add the file to bookmarks and let him on shared-with-me section
                // For Sign-in with redirection to public page logic, check MainContainer
                const token = getTokenFromSearchParams();
                if (token) {
                    await addBookmarkFromPrivateApp(abortSignal, { token });
                }
                // Cleanup if there any token or redirectToPublic key in search params
                cleanupUrl();
                await linksListing.loadLinksBookmarks(abortSignal, shareId);
            }).catch(sendErrorReport);
        }
    }, [isDriveShareUrlBookmarkingEnabled]);

    return {
        layout,
        // Until we have separate section for pending invitations, we do this trick to keep the position of the item in the list,
        // after invite as been transformed to normal link
        // This will get all saved index of accepted invites, and place them at the same place in the final list.
        items: sortedItems,
        sortParams,
        setSorting: (sortParams: SortParams<SortField>) => {
            // If user wants to sort items we clear the pinnedItemsIds to have the normal sortedList
            setAcceptedInvitationsPosition(new Map());
            return setSorting(sortParams);
        },
        acceptPendingInvitation,
        rejectPendingInvitation,
        isLoading:
            isLoading ||
            isPendingLoading ||
            isDecrypting ||
            isShareInfoLoading ||
            isBookmarksLoading ||
            isDecryptingBookmarks,
    };
}
