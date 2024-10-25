import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import type { SortParams } from '../../components/FileBrowser';
import type { SharedWithMeItem } from '../../components/sections/SharedWithMe/SharedWithMe';
import { useRedirectToPublicPage } from '../../hooks/util/useRedirectToPublicPage';
import { sendErrorReport } from '../../utils/errorHandling';
import { getTokenFromSearchParams } from '../../utils/url/token';
import { useBookmarksActions } from '../_bookmarks';
import { useDriveEventManager } from '../_events';
import { useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useInvitationsView } from './useInvitationsView';
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
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const [isBookmarksLoading, withBookmarksLoading] = useLoading(!bookmarksFeatureDisabled);
    const linksListing = useLinksListing();
    const invitationsPositions = useRef<Map<string, number>>(new Map());
    const { invitationsBrowserItems, isLoading: isInvitationsLoading } = useInvitationsView();
    const { addBookmarkFromPrivateApp } = useBookmarksActions();
    const { cleanupUrl } = useRedirectToPublicPage();
    const driveEventManager = useDriveEventManager();

    const loadSharedWithMeLinks = useCallback(
        async (signal: AbortSignal) => {
            await linksListing.loadLinksSharedWithMeLink(signal);
        },
        [linksListing]
    );
    const abortSignalForCache = useAbortSignal([]);
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedWithMeLink(abortSignalForCache);
    const { links: bookmarksLinks, isDecrypting: isDecryptingBookmarks } =
        linksListing.getCachedBookmarksLinks(abortSignalForCache);

    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks.concat(bookmarksLinks));

    const { layout } = useUserSettings();

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedSharedLinks, DEFAULT_SORT);

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

    useEffect(() => {
        const abortController = new AbortController();
        const unsubscribe = driveEventManager.eventHandlers.subscribeToCore((event) => {
            if (event.DriveShareRefresh?.Action === 2) {
                loadSharedWithMeLinks(abortController.signal).catch(sendErrorReport);
            }
        });

        return () => {
            unsubscribe();
            abortController.abort();
        };
    }, [loadSharedWithMeLinks, driveEventManager.eventHandlers]);

    useEffect(() => {
        const newInvitationsPositions = new Map(invitationsPositions.current);
        invitationsBrowserItems.forEach((item, index) => {
            newInvitationsPositions.set(item.rootShareId, index);
        });
        invitationsPositions.current = newInvitationsPositions;
    }, [invitationsBrowserItems]);

    const sortedItems = useMemo(
        () => sortItemsWithPositions([...invitationsBrowserItems, ...browserItems], invitationsPositions.current),
        [invitationsBrowserItems, browserItems, invitationsPositions.current]
    );

    useEffect(() => {
        const abortController = new AbortController();
        // Even if the user is going into a folder, we keep shared with me items decryption ongoing in the background
        // This is due to issue with how we decrypt stuff, to prevent infinite loop
        void withLoading(async () => loadSharedWithMeLinks(abortController.signal)).catch(sendErrorReport);

        return () => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        if (!bookmarksFeatureDisabled) {
            void withBookmarksLoading(async () => {
                // In case the user Sign-up from public page we will add the file to bookmarks and let him on shared-with-me section
                // For Sign-in with redirection to public page logic, check MainContainer
                const token = getTokenFromSearchParams();
                if (token) {
                    await addBookmarkFromPrivateApp(abortController.signal, { token });
                }
                // Cleanup if there any token or redirectToPublic key in search params
                cleanupUrl();
                await linksListing.loadLinksBookmarks(abortController.signal, shareId);
            }).catch(sendErrorReport);
        }
        return () => {
            abortController.abort();
        };
    }, [bookmarksFeatureDisabled]);

    return {
        layout,
        // Until we have separate section for pending invitations, we do this trick to keep the position of the item in the list,
        // after invite as been transformed to normal link
        // This will get all saved index of accepted invites, and place them at the same place in the final list.
        items: sortedItems,
        sortParams,
        setSorting: (sortParams: SortParams<SortField>) => {
            // If user wants to sort items we clear the pinnedItemsIds to have the normal sortedList
            invitationsPositions.current = new Map(
                Array.from(invitationsPositions.current).filter(
                    ([key]) => !browserItems.some((item) => item.rootShareId === key)
                )
            );
            return setSorting(sortParams);
        },
        isLoading: isLoading || isInvitationsLoading || isDecrypting || isBookmarksLoading || isDecryptingBookmarks,
    };
}
