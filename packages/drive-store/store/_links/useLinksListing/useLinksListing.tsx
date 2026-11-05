import { createContext, useCallback, useContext, useRef } from 'react';

import { queryFolderChildren } from '@proton/shared/lib/api/drive/folder';
import type { LinkChildrenResult } from '@proton/shared/lib/interfaces/drive/link';

import { linkMetaToEncryptedLink } from '../../_api/transformers';
import useDebouncedRequest from '../../_api/useDebouncedRequest';
import waitFor from '../../_utils/waitFor';
import type { DecryptedLink } from './../interface';
import useLinksState from './../useLinksState';
import type { FetchMeta, FetchResponse, SortParams } from './useLinksListingHelpers';
import { PAGE_SIZE, sortParamsToServerSortArgs, useLinksListingHelpers } from './useLinksListingHelpers';
import { useSharedWithMeLinksListingByVolume } from './useSharedWithMeLinksListingByVolume';

type FetchState = {
    [shareId: string]: FetchShareState;
};

type FetchShareState = {
    folders: {
        [linkId: string]: {
            // all represents version for all files in the folder, whereas
            // foldersOnly is state of requesting only folders for the given
            // folder. In case `all` is ongoing, `foldersOnly` version waits
            // till that is done. See `fetchChildrenNextPage` for more info.
            all: FetchMeta;
            foldersOnly: FetchMeta;
        };
    };
};

/**
 * Provides way to list links, such as folder links or
 * shared links, and ensure the links are decrypted.
 * The typical usage should be as follow:
 *
 *      const listing = useLinksListingProvider();
 *
 *      // getCachedChildren returns links right away.
 *      // abortSignal is used for background decryption of stale links
 *      // (links not loaded by listing, but using events, for example).
 *      const children = listing.getCachedChildren(abortSignal, shareId, linkId);
 *
 *      useEffect(() => {
 *          const ac = new AbortController();
 *          // Load and decrypt all children for given folder.
 *          linksListing.loadChildren(ac.signal, shareId, linkId)
 *          return () => {
 *              // Stop the load operation when its not needed anymore.
 *              // E.g., different folder was requested.
 *              ac.abort();
 *          };
 *      }, [shareId, linkId]);
 */
export function useLinksListingProvider() {
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const sharedWithMeLinksListingByVolume = useSharedWithMeLinksListingByVolume();

    const { fetchNextPageWithSortingHelper, loadFullListing, getDecryptedLinksAndDecryptRest } =
        useLinksListingHelpers();
    const state = useRef<FetchState>({});

    /**
     * getShareFetchState returns state for given `shareId`.
     * It ensures that the share is present in the state.
     */
    const getShareFetchState = (shareId: string): FetchShareState => {
        if (state.current[shareId]) {
            return state.current[shareId];
        }
        state.current[shareId] = {
            folders: {},
        };

        return state.current[shareId];
    };

    const fetchChildrenPage = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        sorting: SortParams,
        page: number,
        foldersOnly?: boolean,
        showNotification = true,
        showAll?: boolean
    ): Promise<FetchResponse> => {
        const { Links } = await debouncedRequest<LinkChildrenResult>(
            {
                ...queryFolderChildren(shareId, parentLinkId, {
                    ...sortParamsToServerSortArgs(sorting),
                    PageSize: PAGE_SIZE,
                    Page: page,
                    FoldersOnly: foldersOnly ? 1 : 0,
                    ShowAll: showAll ? 1 : 0,
                }),
                silence: !showNotification,
            },
            abortSignal
        );
        return { links: Links.map((link) => linkMetaToEncryptedLink(link, shareId)), parents: [] };
    };

    /**
     * Fetches next page for the given folder. If request for `foldersOnly`
     * is made and there is already ongoing request for all files for the same folder,
     * it waits till its finished to not ask for the same links twice.
     */
    const fetchChildrenNextPage = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        sorting?: SortParams,
        foldersOnly?: boolean,
        showNotification = true,
        showAll?: boolean
    ): Promise<boolean> => {
        const shareState = getShareFetchState(shareId);
        let linkFetchMeta = shareState.folders[parentLinkId];
        if (!linkFetchMeta) {
            linkFetchMeta = {
                all: {},
                foldersOnly: {},
            };
            shareState.folders[parentLinkId] = linkFetchMeta;
        }
        if (foldersOnly) {
            // If request to query all items is in progress, lets wait
            // as that might fetch all folder children as well.
            await waitFor(() => !linkFetchMeta.all.isInProgress, { abortSignal });
            // If all items were downloaded, no need to perform fetch
            // for folders only.
            if (linkFetchMeta.all.isEverythingFetched) {
                return false;
            }
        }

        const fetchMeta = foldersOnly ? linkFetchMeta.foldersOnly : linkFetchMeta.all;
        return fetchNextPageWithSortingHelper(
            abortSignal,
            shareId,
            sorting,
            fetchMeta,
            (sorting: SortParams, page: number) => {
                return fetchChildrenPage(
                    abortSignal,
                    shareId,
                    parentLinkId,
                    sorting,
                    page,
                    foldersOnly,
                    showNotification,
                    showAll
                );
            },
            showNotification
        );
    };

    const loadChildren = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        foldersOnly?: boolean,
        showNotification = true,
        showAll?: boolean
    ): Promise<void> => {
        // undefined means keep the sorting used the last time = lets reuse what we loaded so far.
        const sorting = undefined;
        return loadFullListing(() =>
            fetchChildrenNextPage(abortSignal, shareId, linkId, sorting, foldersOnly, showNotification, showAll)
        );
    };

    const getCachedChildren = useCallback(
        (
            abortSignal: AbortSignal,
            shareId: string,
            parentLinkId: string,
            foldersOnly: boolean = false
        ): { links: DecryptedLink[]; isDecrypting: boolean } => {
            return getDecryptedLinksAndDecryptRest(
                abortSignal,
                shareId,
                linksState.getChildren(shareId, parentLinkId, foldersOnly),
                getShareFetchState(shareId).folders[parentLinkId]?.all
            );
        },
        [linksState.getChildren]
    );

    return {
        fetchChildrenNextPage,
        loadChildren,
        getCachedChildren,

        // TODO: Remove this with Invitation section refactor
        setShareIdsState: sharedWithMeLinksListingByVolume.setShareIdsState,
    };
}

const LinksListingContext = createContext<ReturnType<typeof useLinksListingProvider> | null>(null);

export function LinksListingProvider({ children }: { children: React.ReactNode }) {
    const value = useLinksListingProvider();
    return <LinksListingContext.Provider value={value}>{children}</LinksListingContext.Provider>;
}

export default function useLinksListing() {
    const state = useContext(LinksListingContext);
    if (!state) {
        throw new Error('Trying to use uninitialized LinksListingProvider');
    }
    return state;
}
