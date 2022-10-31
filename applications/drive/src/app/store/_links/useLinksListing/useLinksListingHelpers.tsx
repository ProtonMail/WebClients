import { c, msgid } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';

import { reportError, useErrorHandler, waitFor } from '../../_utils';
import { DecryptedLink, EncryptedLink } from '../interface';
import useLinks from '../useLinks';
import useLinksState, { Link } from '../useLinksState';

export type FetchMeta = {
    isEverythingFetched?: boolean;
    isInProgress?: boolean;
    lastSorting?: SortParams;
    lastPage?: number;
};

// SortParams are available sorting methods for listing.
export type SortParams = {
    sortField: 'size' | 'createTime' | 'metaDataModifyTime';
    sortOrder: SORT_DIRECTION;
};

// FetchResponse is internal data holder of results from API.
export type FetchResponse = {
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
 * useLinksListingProvider provides helpers to list links.
 */
export function useLinksListingHelpers() {
    const { showErrorNotification, showAggregatedErrorNotification } = useErrorHandler();
    const linksState = useLinksState();
    const { decryptLinks } = useLinks();

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
        fetchLinks: (sorting: SortParams, page: number) => Promise<FetchResponse>,
        showNotification = true
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
                if (err?.data?.Code === RESPONSE_CODE.INVALID_LINK_TYPE) {
                    throw err;
                }
                // If you do bigger changes around, consider this:
                // It looked like a good idea to handle errors by showing
                // notification here to handle all places nicely on one
                // place without need to duplicate the code. However, for
                // download, we need to throw exception back so it can be
                // properly handled by transfer manager. But still, for all
                // other places its convenient to handle here. Maybe in the
                // future we could do another helper which would wrap the
                // logic with notifications, similarly like we have hook
                // useActions, to have better freedom to chose what to use.
                if (showNotification) {
                    showErrorNotification(err, c('Notification').t`Next page failed to be loaded`);
                    // Very probably the next page is still there, but to not cause
                    // inifinite loop requesting next page, lets return false.
                    return false;
                }
                throw err;
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
        decryptAndCacheLinks(abortSignal, shareId, linksToBeDecrypted).catch(reportError);

        return {
            links: links.map(({ decrypted }) => decrypted).filter(isTruthy),
            isDecrypting: linksToBeDecrypted.length > 0,
        };
    };

    return {
        cacheLoadedLinks,
        fetchNextPageWithSortingHelper,
        fetchNextPageHelper,
        loadHelper,
        getCachedLinksHelper,
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

export function sortParamsToServerSortArgs({ sortField, sortOrder }: SortParams): { Sort: string; Desc: 0 | 1 } {
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
