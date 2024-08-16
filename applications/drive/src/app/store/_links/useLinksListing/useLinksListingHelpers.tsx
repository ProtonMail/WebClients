import { c, msgid } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';

import { sendErrorReport } from '../../../utils/errorHandling';
import { useErrorHandler, waitFor } from '../../_utils';
import type { DecryptedLink, EncryptedLink } from '../interface';
import useLinks from '../useLinks';
import type { Link } from '../useLinksState';
import useLinksState, { isLinkDecrypted } from '../useLinksState';

export type FetchMeta = {
    isEverythingFetched?: boolean;
    isInProgress?: boolean;
    lastSorting?: SortParams;
    lastPage?: number;
};

/**
 * Available sorting methods for listing.
 */
export type SortParams = {
    sortField: 'size' | 'createTime' | 'metaDataModifyTime';
    sortOrder: SORT_DIRECTION;
};

/**
 * FetchResponse is internal data holder of results from API.
 */
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
 * Provides helpers to list links.
 */
export function useLinksListingHelpers() {
    const { showErrorNotification, showAggregatedErrorNotification } = useErrorHandler();
    const linksState = useLinksState();
    const { decryptLinks } = useLinks();

    /**
     * Decrypts links in parallel and caches them.
     */
    const decryptAndCacheLinks = async (abortSignal: AbortSignal, shareId: string, links: EncryptedLink[]) => {
        if (!links.length) {
            return {
                links: [],
                errors: [],
            };
        }

        const result = await decryptLinks(abortSignal, shareId, links);

        if (result.links.length) {
            linksState.setLinks(shareId, result.links);
        }

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

        return result;
    };

    /**
     * Caches encrypted links and decrypts them.
     */
    const cacheLoadedLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        links: EncryptedLink[],
        parents: EncryptedLink[]
    ) => {
        // Set encrypted data right away because it is needed for decryption
        const allEncryptedLinks = [...parents, ...links].map((encrypted) => ({ encrypted }));
        linksState.setLinks(shareId, allEncryptedLinks);

        // Decrypt only links which are not decrypted yet or need re-decryption
        const decryptedLinks: Required<Link>[] = [];
        const encryptedLinks: EncryptedLink[] = [];

        links.forEach((link) => {
            const cachedLink = linksState.getLink(shareId, link.linkId);

            if (isLinkDecrypted(cachedLink)) {
                decryptedLinks.push(cachedLink);
            } else {
                encryptedLinks.push(link);
            }
        });

        // Merge results to return all provided links
        const result = await decryptAndCacheLinks(abortSignal, shareId, encryptedLinks);

        return {
            links: [...decryptedLinks, ...result.links],
            errors: result.errors,
        };
    };

    /**
     * Ensures only one fetch for the given
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
                    showErrorNotification(err, c('Notification').t`Cannot load next page`);
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
     * A wrapper around fetchNextPageWithSortingHelper.
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
     * Invokes a callback function until all pages are loaded. The callback function must
     * return a boolean value representing a presence of the next page in listing.
     */
    const loadFullListing = async (callback: () => Promise<boolean>): Promise<void> => {
        const hasNextPage = await callback();

        if (hasNextPage) {
            await loadFullListing(callback);
        }
    };

    /**
     * Invokes a callback function until all pages are loaded using technique with AnchorID.
     * The callback function must return a AnchorID and More as boolean value representing a presence of the next page in listing.
     */
    const loadFullListingWithAnchor = async (
        callback: (AnchorID?: string) => Promise<{ AnchorID?: string; More: boolean; Count?: number }>,
        AnchorIdIn?: string
    ): Promise<{ Count?: number } | void> => {
        const result = await callback(AnchorIdIn);

        if (result.More) {
            await loadFullListingWithAnchor(callback, result.AnchorID);
        }
        if (result.Count) {
            return { Count: result.Count };
        }
    };

    /**
     * Returns cached decrypted links (including stale), decrypts
     * all encrypted or stale links in the background.
     */
    const getDecryptedLinksAndDecryptRest = (
        abortSignal: AbortSignal,
        shareId: string,
        links: Link[],
        fetchMeta?: FetchMeta
    ): { links: DecryptedLink[]; isDecrypting: boolean } => {
        // Return decrypted links right away.
        // Those links the have been updated in the background by an event,
        // still need to be decrypted. We run descryption asynchronous.
        const linksToBeDecrypted = links
            .filter(
                ({ decrypted }) =>
                    decrypted?.isStale ||
                    // Link was added outside of this listing and thus we need to decrypt it now
                    // (if the listing is in progress, it might still be decrypted)
                    (!decrypted && !fetchMeta?.isInProgress) // Link was added not by listing.
            )
            .map(({ encrypted }) => encrypted);
        decryptAndCacheLinks(abortSignal, shareId, linksToBeDecrypted).catch(sendErrorReport);

        return {
            links: links.map(({ decrypted }) => decrypted).filter(isTruthy),
            isDecrypting: linksToBeDecrypted.length > 0,
        };
    };

    return {
        cacheLoadedLinks,
        fetchNextPageWithSortingHelper,
        fetchNextPageHelper,
        loadFullListing,
        loadFullListingWithAnchor,
        getDecryptedLinksAndDecryptRest,
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
