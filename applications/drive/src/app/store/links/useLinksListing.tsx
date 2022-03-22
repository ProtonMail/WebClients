import { c, msgid } from 'ttag';
import { createContext, useContext, useCallback, useRef } from 'react';

import { chunk } from '@proton/shared/lib/helpers/array';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { BATCH_REQUEST_SIZE } from '@proton/shared/lib/drive/constants';
import { queryFolderChildren } from '@proton/shared/lib/api/drive/folder';
import { queryLinkMetaBatch } from '@proton/shared/lib/api/drive/link';
import { queryTrashList } from '@proton/shared/lib/api/drive/share';
import { querySharedLinks } from '@proton/shared/lib/api/drive/sharing';
import {
    LinkChildrenResult,
    LinkMeta,
    FolderLinkMeta,
    LinkMetaBatchPayload,
} from '@proton/shared/lib/interfaces/drive/link';
import { ShareURL } from '@proton/shared/lib/interfaces/drive/sharing';

import { waitFor, useErrorHandler } from '../utils';
import { useDebouncedRequest, linkMetaToEncryptedLink } from '../api';
import useLinksState, { Link } from './useLinksState';
import useLinks from './useLinks';
import { EncryptedLink, DecryptedLink } from './interface';

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

type FetchMeta = {
    isEverythingFetched?: boolean;
    isInProgress?: boolean;
    lastSorting?: SortParams;
    lastPage?: number;
};

// SortParams are available sorting methods for listing.
type SortParams = {
    sortField: 'mimeType' | 'size' | 'createTime' | 'metaDataModifyTime';
    sortOrder: SORT_DIRECTION;
};

// FetchResponse is internal data holder of results from API.
type FetchResponse = {
    // links contain all requests links (that is links in specified folder
    // in case folder children were requested).
    links: EncryptedLink[];
    // parents contain links not directly requested but needed so they can
    // be decrypted (useful for shared links which don't have the same
    // parent, for example).
    parents: EncryptedLink[];
};

// API supports up to 150 but we hardly fit 150 items on the page anyway.
// Because decrypting takes time, lets do it in smaller batches. We could
// optimise it to do it in smaller batches for listings when we can use
// sorting on API, but the maximum what API allows for cases when we need
// to load everything anyway. That is a bit tricky, as it needs more complex
// paging algorithm (to properly compute page when page size differs).
// Therefore, lets keep it simple for now unless it is really needed.
export const PAGE_SIZE = 50;
export const DEFAULT_SORTING: SortParams = {
    sortField: 'createTime',
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useLinksListingProvider provides way to list links, such as folder links or
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
    const { showErrorNotification, showAggregatedErrorNotification } = useErrorHandler();
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const { decryptLinks } = useLinks();

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

    /**
     * decryptAndCacheLinks runs in parallel decryption of links and stores them in the cache.
     */
    const decryptAndCacheLinks = async (abortSignal: AbortSignal, shareId: string, links: EncryptedLink[]) => {
        if (!links.length) {
            return;
        }

        const result = await decryptLinks(abortSignal, shareId, links);
        linksState.setLinks(shareId, result.links);

        if (result.errors.length) {
            showAggregatedErrorNotification(result.errors, (errors: any[]) => {
                const count = errors.length;
                return c('Notification').ngettext(
                    msgid`${count} item failed to be decrypted`,
                    `${count} items failed to be decrypted`,
                    count
                );
            });
        }
    };

    /**
     * cacheLoadedLinks stores encrypted versions of loaded links and runs
     * its decryption right away.
     */
    const cacheLoadedLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        links: EncryptedLink[],
        parents: EncryptedLink[]
    ): Promise<void> => {
        // Set encrypted data right away because it is needed for decryption.
        const allEncryptedLinks = [...parents, ...links].map((encrypted) => ({ encrypted }));
        linksState.setLinks(shareId, allEncryptedLinks);

        // Decrypt only links which are not decrypted yet or need re-decryption.
        const encryptedLinksOnly = links.filter(({ linkId }) => {
            const cachedLink = linksState.getLink(shareId, linkId);
            return !cachedLink?.decrypted || cachedLink.decrypted.isStale;
        });
        await decryptAndCacheLinks(abortSignal, shareId, encryptedLinksOnly);
    };

    /**
     * fetchNextPageWithSortingHelper ensures only one fetch for the given
     * `fetchMeta` is in progress, and it never runs if all was already fetched
     * before.
     * The algorithm also ensures proper paging; e.g., if first page used sort
     * by create time, and next page uses the same sorting, paging can continue,
     * but if the sort is different, we need to start from page one again, so
     * we don't miss any link.
     * In case no sorting is provided, the previously used one is used; that is
     * useful for example when some pages were already loaded and then we just
     * don't care about sorting but we want to load everything.
     * The return value is boolean whether there is next page.
     */
    const fetchNextPageWithSortingHelper = async (
        abortSignal: AbortSignal,
        shareId: string,
        sorting: SortParams | undefined,
        fetchMeta: FetchMeta,
        fetchLinks: (sorting: SortParams, page: number) => Promise<FetchResponse>
    ): Promise<boolean> => {
        await waitFor(() => !fetchMeta.isInProgress, { abortSignal });
        if (fetchMeta.isEverythingFetched) {
            return false;
        }
        fetchMeta.isInProgress = true;

        const currentSorting = sorting || fetchMeta.lastSorting || DEFAULT_SORTING;
        const currentPage =
            isSameSorting(fetchMeta.lastSorting, currentSorting) && fetchMeta.lastPage !== undefined
                ? fetchMeta.lastPage + 1
                : 0;
        const hasNextPage = await fetchLinks(currentSorting, currentPage)
            .then(async ({ links, parents }) => {
                fetchMeta.lastSorting = currentSorting;
                fetchMeta.lastPage = currentPage;
                fetchMeta.isEverythingFetched = links.length < PAGE_SIZE;

                await cacheLoadedLinks(abortSignal, shareId, links, parents);

                return !fetchMeta.isEverythingFetched;
            })
            .catch((err) => {
                showErrorNotification(err, c('Notification').t`Next page failed to be loaded`);
                // Very probably the next page is still there, but to not cause
                // inifinite loop requesting next page, lets return false.
                return false;
            })
            .finally(() => {
                // Make sure isInProgress is always unset, even during failure,
                // and that it is the last thing after everything else is set.
                fetchMeta.isInProgress = false;
            });

        return hasNextPage;
    };

    /**
     * fetchNextPageHelper is the wrapper around fetchNextPageWithSortingHelper.
     * Basically the same thing, just for cases when sorting is not available
     * (for example, listing trash or shared links).
     */
    const fetchNextPageHelper = async (
        abortSignal: AbortSignal,
        shareId: string,
        fetchMeta: FetchMeta,
        fetchLinks: (page: number) => Promise<FetchResponse>
    ): Promise<boolean> => {
        return fetchNextPageWithSortingHelper(abortSignal, shareId, undefined, fetchMeta, (_, page: number) =>
            fetchLinks(page)
        );
    };

    const fetchChildrenPage = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        sorting: SortParams,
        page: number,
        foldersOnly?: boolean
    ): Promise<FetchResponse> => {
        const { Links } = await debouncedRequest<LinkChildrenResult>(
            queryFolderChildren(shareId, parentLinkId, {
                ...sortParamsToServerSortArgs(sorting),
                PageSize: PAGE_SIZE,
                Page: page,
                FoldersOnly: foldersOnly ? 1 : 0,
            }),
            abortSignal
        );
        return { links: Links.map(linkMetaToEncryptedLink), parents: [] };
    };

    /**
     * fetchChildrenNextPage fetches next page for the given folder.
     * If request for `foldersOnly` is made and there is already ongoing
     * request for all files for the same folder, it waits till its finished
     * to not ask for the same links twice.
     */
    const fetchChildrenNextPage = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        sorting?: SortParams,
        foldersOnly?: boolean
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
                return fetchChildrenPage(abortSignal, shareId, parentLinkId, sorting, page, foldersOnly);
            }
        );
    };

    const fetchTrashedLinksPage = async (
        abortSignal: AbortSignal,
        shareId: string,
        page: number
    ): Promise<FetchResponse> => {
        const { Links, Parents } = await debouncedRequest<{
            Links: LinkMeta[];
            Parents: { [id: string]: FolderLinkMeta };
        }>(
            queryTrashList(shareId, {
                PageSize: PAGE_SIZE,
                Page: page,
            }),
            abortSignal
        );
        return {
            links: Links.map(linkMetaToEncryptedLink),
            parents: Object.values(Parents).map(linkMetaToEncryptedLink),
        };
    };

    const fetchTrashedLinksNextPage = async (abortSignal: AbortSignal, shareId: string): Promise<boolean> => {
        const shareState = getShareFetchState(shareId);
        let fetchMeta = shareState.trash;
        if (!fetchMeta) {
            fetchMeta = {};
            state.current[shareId].trash = fetchMeta;
        }
        return fetchNextPageHelper(abortSignal, shareId, fetchMeta, (page: number) =>
            fetchTrashedLinksPage(abortSignal, shareId, page)
        );
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

        const allLinks = enhancedLinks.map(linkMetaToEncryptedLink);
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

    const fetchLinks = async (abortSignal: AbortSignal, shareId: string, linkIds: string[]): Promise<FetchResponse> => {
        const { Links, Parents } = await debouncedRequest<LinkMetaBatchPayload>(
            queryLinkMetaBatch(shareId, linkIds),
            abortSignal
        );

        return {
            links: Links.map(linkMetaToEncryptedLink),
            parents: Parents ? Object.values(Parents).map(linkMetaToEncryptedLink) : [],
        };
    };

    const fetchLinksPage = async (abortSignal: AbortSignal, shareId: string, linkIds: string[]) => {
        const { links, parents } = await fetchLinks(abortSignal, shareId, linkIds);
        await cacheLoadedLinks(abortSignal, shareId, links, parents);
    };

    /**
     * loadHelper just calls `callback` (any version of next page returnig
     * whether there is next page) until all pages are loaded.
     */
    const loadHelper = async (callback: () => Promise<boolean>): Promise<void> => {
        const hasNextPage = await callback();
        if (hasNextPage) {
            await loadHelper(callback);
        }
    };

    const loadChildren = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        foldersOnly?: boolean
    ): Promise<void> => {
        // undefined means keep the sorting used the last time = lets reuse what we loaded so far.
        const sorting = undefined;
        return loadHelper(() => fetchChildrenNextPage(abortSignal, shareId, linkId, sorting, foldersOnly));
    };

    const loadTrashedLinks = async (abortSignal: AbortSignal, shareId: string): Promise<void> => {
        return loadHelper(() => fetchTrashedLinksNextPage(abortSignal, shareId));
    };

    const loadLinksSharedByLink = async (abortSignal: AbortSignal, shareId: string): Promise<void> => {
        return loadHelper(() => fetchLinksSharedByLinkNextPage(abortSignal, shareId));
    };

    const loadLinks = async (
        abortSignal: AbortSignal,
        fetchKey: string,
        shareId: string,
        linkIds: string[]
    ): Promise<void> => {
        const shareState = getShareFetchState(shareId);
        let fetchMeta = shareState.links[fetchKey];
        if (!fetchMeta) {
            fetchMeta = {};
            state.current[shareId].links[fetchKey] = fetchMeta;
        }
        await waitFor(() => !fetchMeta.isInProgress, { abortSignal });
        fetchMeta.isInProgress = true;

        const load = async () => {
            const missingLinkIds = linkIds.filter((linkId) => !linksState.getLink(shareId, linkId));
            for (const pageLinkIds of chunk(missingLinkIds, BATCH_REQUEST_SIZE)) {
                await fetchLinksPage(abortSignal, shareId, pageLinkIds);
                if (abortSignal.aborted) {
                    break;
                }
            }
        };
        await load().finally(() => {
            fetchMeta.isInProgress = false;
        });
    };

    /**
     * getCachedLinksHelper returns directly cached decrypted links (even
     * the staled links), and ensures all non-decrypted or stale links are
     * decrypted on background. Once that is done, the cache is updated,
     * and call to list of decrypted links repeated.
     * The second returned value represents whether some decryption (and
     * thus future update) is happening. Useful for indication in GUI.
     */
    const getCachedLinksHelper = (
        abortSignal: AbortSignal,
        shareId: string,
        links: Link[],
        fetchMeta?: FetchMeta
    ): { links: DecryptedLink[]; isDecrypting: boolean } => {
        // On background, decrypt or re-decrypt links which were updated
        // elsewhere, for example, by event update. It is done in background
        // so we return cached links right away, but we do the work only
        // when the link is really needed (not decrypted sooner when its
        // not displayed anywhere).
        const linksToBeDecrypted = links
            .filter(
                ({ decrypted }) =>
                    decrypted?.isStale || // When link was updated.
                    (!decrypted && !fetchMeta?.isInProgress) // When link was added not by listing.
            )
            .map(({ encrypted }) => encrypted);
        void decryptAndCacheLinks(abortSignal, shareId, linksToBeDecrypted);

        return {
            links: links.map(({ decrypted }) => decrypted).filter(isTruthy),
            isDecrypting: linksToBeDecrypted.length > 0,
        };
    };

    const getCachedChildren = useCallback(
        (
            abortSignal: AbortSignal,
            shareId: string,
            parentLinkId: string,
            foldersOnly: boolean = false
        ): { links: DecryptedLink[]; isDecrypting: boolean } => {
            return getCachedLinksHelper(
                abortSignal,
                shareId,
                linksState.getChildren(shareId, parentLinkId, foldersOnly),
                getShareFetchState(shareId).folders[parentLinkId]?.all
            );
        },
        [linksState.getChildren]
    );

    const getCachedTrashed = useCallback(
        (abortSignal: AbortSignal, shareId: string): { links: DecryptedLink[]; isDecrypting: boolean } => {
            return getCachedLinksHelper(
                abortSignal,
                shareId,
                linksState.getTrashed(shareId),
                getShareFetchState(shareId).trash
            );
        },
        [linksState.getTrashed]
    );

    const getCachedSharedByLink = useCallback(
        (abortSignal: AbortSignal, shareId: string): { links: DecryptedLink[]; isDecrypting: boolean } => {
            return getCachedLinksHelper(
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
            return getCachedLinksHelper(abortSignal, shareId, links, getShareFetchState(shareId).links[fetchKey]);
        },
        [linksState.getLink]
    );

    return {
        fetchChildrenNextPage,
        loadChildren,
        loadTrashedLinks,
        loadLinksSharedByLink,
        loadLinks,
        getCachedChildren,
        getCachedTrashed,
        getCachedSharedByLink,
        getCachedLinks,
    };
}

function isSameSorting(one?: SortParams, other?: SortParams): boolean {
    return (
        one !== undefined &&
        other !== undefined &&
        one.sortField === other.sortField &&
        one.sortOrder === other.sortOrder
    );
}

function sortParamsToServerSortArgs({ sortField, sortOrder }: SortParams): { Sort: string; Desc: 0 | 1 } {
    const Sort = {
        mimeType: 'MIMEType',
        size: 'Size',
        createTime: 'CreateTime',
        metaDataModifyTime: 'ModifyTime',
    }[sortField];
    return {
        Sort,
        Desc: sortOrder === SORT_DIRECTION.ASC ? 0 : 1,
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
