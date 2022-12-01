import { createContext, useCallback, useContext, useRef } from 'react';

import { queryFolderChildren } from '@proton/shared/lib/api/drive/folder';
import { queryLinkMetaBatch } from '@proton/shared/lib/api/drive/link';
import { querySharedLinks } from '@proton/shared/lib/api/drive/sharing';
import { BATCH_REQUEST_SIZE } from '@proton/shared/lib/drive/constants';
import { LinkChildrenResult, LinkMeta, LinkMetaBatchPayload } from '@proton/shared/lib/interfaces/drive/link';
import { ShareURL } from '@proton/shared/lib/interfaces/drive/sharing';
import chunk from '@proton/utils/chunk';
import isTruthy from '@proton/utils/isTruthy';

import { linkMetaToEncryptedLink, useDebouncedRequest } from '../../_api';
import { waitFor } from '../../_utils';
import { DecryptedLink, EncryptedLink } from './../interface';
import useLinksState from './../useLinksState';
import {
    FetchMeta,
    FetchResponse,
    PAGE_SIZE,
    SortParams,
    sortParamsToServerSortArgs,
    useLinksListingHelpers,
} from './useLinksListingHelpers';
import { useTrashedLinksListing } from './useTrashedLinksListing';

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
    trash: FetchMeta;
    sharedByLink: FetchMeta;
    links: {
        [key: string]: FetchMeta;
    };
};

/**
 * Provides way to list links, such as folder links or
 * trashed links or shared links, and ensure the links are decrypted.
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
    const trashedLinksListing = useTrashedLinksListing();

    const {
        cacheLoadedLinks,
        fetchNextPageWithSortingHelper,
        fetchNextPageHelper,
        loadFullListing,
        getDecryptedLinksAndDecryptRest,
    } = useLinksListingHelpers();
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
            trash: {},
            sharedByLink: {},
            links: {},
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
        showNotification = true
    ): Promise<FetchResponse> => {
        const { Links } = await debouncedRequest<LinkChildrenResult>(
            {
                ...queryFolderChildren(shareId, parentLinkId, {
                    ...sortParamsToServerSortArgs(sorting),
                    PageSize: PAGE_SIZE,
                    Page: page,
                    FoldersOnly: foldersOnly ? 1 : 0,
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
        showNotification = true
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
                    showNotification
                );
            },
            showNotification
        );
    };

    const fetchLinksMeta = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkIds: string[]
    ): Promise<FetchResponse> => {
        const { Links, Parents } = await debouncedRequest<LinkMetaBatchPayload>(
            queryLinkMetaBatch(shareId, linkIds),
            abortSignal
        );

        return {
            links: Links.map((link) => linkMetaToEncryptedLink(link, shareId)),
            parents: Parents ? Object.values(Parents).map((link) => linkMetaToEncryptedLink(link, shareId)) : [],
        };
    };

    const loadLinksMeta = async (
        abortSignal: AbortSignal,
        query: string,
        shareId: string,
        linkIds: string[],
        cache: boolean = true
    ): Promise<{
        links: EncryptedLink[];
        parents: EncryptedLink[];
    }> => {
        const shareState = getShareFetchState(shareId);
        let fetchMeta = shareState.links[query];
        if (!fetchMeta) {
            fetchMeta = {};
            state.current[shareId].links[query] = fetchMeta;
        }
        await waitFor(() => !fetchMeta.isInProgress, { abortSignal });
        fetchMeta.isInProgress = true;

        const linksAcc: EncryptedLink[] = [];
        const parentsAcc: EncryptedLink[] = [];
        const load = async () => {
            const missingLinkIds = linkIds.filter((linkId) => !linksState.getLink(shareId, linkId));
            for (const pageLinkIds of chunk(missingLinkIds, BATCH_REQUEST_SIZE)) {
                const { links, parents } = await fetchLinksMeta(abortSignal, shareId, pageLinkIds);
                if (cache) {
                    await cacheLoadedLinks(abortSignal, shareId, links, parents);
                }
                linksAcc.push(...links);
                parentsAcc.push(...parents);
                if (abortSignal.aborted) {
                    break;
                }
            }
        };
        await load().finally(() => {
            fetchMeta.isInProgress = false;
        });

        return {
            links: linksAcc,
            parents: parentsAcc,
        };
    };

    const fetchLinksSharedByLinkPage = async (
        abortSignal: AbortSignal,
        shareId: string,
        page: number
    ): Promise<FetchResponse> => {
        const { ShareURLs = [], Links = {} } = await debouncedRequest<{
            ShareURLs: ShareURL[];
            Links?: { [id: string]: LinkMeta };
        }>(
            querySharedLinks(shareId, {
                PageSize: PAGE_SIZE,
                Page: page,
                Recursive: 1,
            }),
            abortSignal
        );

        // Enhance links with shareURL so we can set # of accesses to the cached link.
        const shareUrls = ShareURLs.reduce((obj, shareUrl) => {
            obj[shareUrl.ShareURLID] = shareUrl;
            return obj;
        }, {} as { [id: string]: ShareURL });
        const enhancedLinks = Object.values(Links).map((link) => ({
            ...link,
            ShareUrls: link.ShareUrls.map((shareUrl) => ({
                ...shareUrl,
                ShareURL: shareUrls[shareUrl.ShareUrlID],
            })),
        }));

        const allLinks = enhancedLinks.map((link) => linkMetaToEncryptedLink(link, shareId));
        const links = allLinks.filter(({ isShared }) => isShared);
        const parents = allLinks.filter(({ isShared }) => !isShared);
        return { links, parents };
    };

    const fetchLinksSharedByLinkNextPage = async (abortSignal: AbortSignal, shareId: string): Promise<boolean> => {
        const shareState = getShareFetchState(shareId);
        let fetchMeta = shareState.sharedByLink;
        if (!fetchMeta) {
            fetchMeta = {};
            state.current[shareId].sharedByLink = fetchMeta;
        }
        return fetchNextPageHelper(abortSignal, shareId, fetchMeta, (page: number) =>
            fetchLinksSharedByLinkPage(abortSignal, shareId, page)
        );
    };

    const loadChildren = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        foldersOnly?: boolean,
        showNotification = true
    ): Promise<void> => {
        // undefined means keep the sorting used the last time = lets reuse what we loaded so far.
        const sorting = undefined;
        return loadFullListing(() =>
            fetchChildrenNextPage(abortSignal, shareId, linkId, sorting, foldersOnly, showNotification)
        );
    };

    const loadLinksSharedByLink = async (abortSignal: AbortSignal, shareId: string): Promise<void> => {
        return loadFullListing(() => fetchLinksSharedByLinkNextPage(abortSignal, shareId));
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

    const getCachedChildrenCount = useCallback(
        (shareId: string, parentLinkId: string): number => {
            const links = linksState.getChildren(shareId, parentLinkId);
            return links.length;
        },
        [linksState.getChildren]
    );

    const getCachedSharedByLink = useCallback(
        (abortSignal: AbortSignal, shareId: string): { links: DecryptedLink[]; isDecrypting: boolean } => {
            return getDecryptedLinksAndDecryptRest(
                abortSignal,
                shareId,
                linksState.getSharedByLink(shareId),
                getShareFetchState(shareId).sharedByLink
            );
        },
        [linksState.getSharedByLink]
    );

    const getCachedLinks = useCallback(
        (
            abortSignal: AbortSignal,
            fetchKey: string,
            shareId: string,
            linkIds: string[]
        ): { links: DecryptedLink[]; isDecrypting: boolean } => {
            const links = linkIds.map((linkId) => linksState.getLink(shareId, linkId)).filter(isTruthy);
            return getDecryptedLinksAndDecryptRest(
                abortSignal,
                shareId,
                links,
                getShareFetchState(shareId).links[fetchKey]
            );
        },
        [linksState.getLink]
    );

    return {
        fetchChildrenNextPage,
        loadChildren,
        loadTrashedLinks: (signal: AbortSignal, volumeId: string) => {
            return trashedLinksListing.loadTrashedLinks(signal, volumeId, loadLinksMeta);
        },
        loadLinksSharedByLink,
        loadLinksMeta,
        getCachedChildren,
        getCachedChildrenCount,
        getCachedTrashed: trashedLinksListing.getCachedTrashed,
        getCachedSharedByLink,
        getCachedLinks,
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
