import { useCallback, useRef } from 'react';

import { querySharedWithMeLinks } from '@proton/shared/lib/api/drive/sharing';
import type { ListDriveSharedWithMeLinksPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { useDebouncedRequest } from '../../_api';
import { useVolumesState } from '../../_volumes';
import type { DecryptedLink } from '../interface';
import useLinksState from '../useLinksState';
import type { FetchLoadLinksMeta } from './interface';
import type { FetchMeta, SortParams } from './useLinksListingHelpers';
import { DEFAULT_SORTING, useLinksListingHelpers } from './useLinksListingHelpers';

interface FetchSharedLinksMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

/**
 * Custom hook for managing and fetching shared with me links.
 */
export function useSharedWithMeLinksListing() {
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const volumesState = useVolumesState();
    const shareIdsState = useRef<Set<string>>();

    const setShareIdsState = (shareIds: string[]) => {
        const shareIdsSet = shareIdsState.current || new Set();

        for (const shareId of shareIds) {
            shareIdsSet.add(shareId);
        }

        shareIdsState.current = shareIdsSet;
        return shareIdsState.current;
    };

    const getShareIdsState = (): string[] => Array.from(shareIdsState.current || new Set());

    const { loadFullListingWithAnchor, getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
    const fetchMeta = useRef<FetchSharedLinksMeta>({
        lastPage: 0,
        lastSorting: DEFAULT_SORTING,
    });

    const loadSharedLinksMeta = async (
        signal: AbortSignal,
        transformedResponse: {
            [shareId: string]: string[];
        },
        loadLinksMeta: FetchLoadLinksMeta
    ) => {
        for (const shareId in transformedResponse) {
            await loadLinksMeta(signal, 'sharedWithMeLink', shareId, transformedResponse[shareId], {
                fetchMeta: fetchMeta.current,
            });
        }
    };

    const fetchSharedLinksNextPage = async (
        signal: AbortSignal,
        loadLinksMeta: FetchLoadLinksMeta,
        AnchorID?: string
    ): Promise<{ AnchorID: string; More: boolean; Count?: number }> => {
        if (fetchMeta.current.isEverythingFetched) {
            return {
                AnchorID: '',
                More: false,
                Count: shareIdsState.current?.size,
            };
        }

        const response = await debouncedRequest<ListDriveSharedWithMeLinksPayload>(
            querySharedWithMeLinks({ AnchorID })
        );
        const shareIds = response.Links.map((link) => {
            volumesState.setVolumeShareIds(link.VolumeID, [link.ShareID]);
            return link.ShareID;
        });
        const newShareIdsState = setShareIdsState(shareIds);

        const transformedResponse = transformSharedLinksResponseToLinkMap(response);
        await loadSharedLinksMeta(signal, transformedResponse, loadLinksMeta);

        fetchMeta.current.isEverythingFetched = !response.More;

        return {
            AnchorID: response.AnchorID,
            More: response.More,
            Count: newShareIdsState.size,
        };
    };

    /**
     * Loads shared with me links.
     */
    const loadSharedWithMeLinks = async (
        signal: AbortSignal,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<{ Count?: number } | void> => {
        const callback = (AnchorID?: string) => fetchSharedLinksNextPage(signal, loadLinksMeta, AnchorID);
        return loadFullListingWithAnchor(callback);
    };

    /**
     * Gets shared links that have already been fetched and cached.
     */
    const getCachedSharedWithMeLinks = useCallback(
        (abortSignal: AbortSignal): { links: DecryptedLink[]; isDecrypting: boolean } => {
            const associatedShareIds = getShareIdsState();
            const result = associatedShareIds.map((shareId) => {
                return getDecryptedLinksAndDecryptRest(
                    abortSignal,
                    shareId,
                    linksState.getSharedWithMeByLink(shareId),
                    fetchMeta.current
                );
            });

            const links = result.reduce<DecryptedLink[]>((acc, element) => {
                return [...acc, ...element.links];
            }, []);

            const isDecrypting = result.some((element) => {
                return element.isDecrypting;
            });

            return {
                links,
                isDecrypting,
            };
        },
        [linksState.getSharedByLink]
    );

    return {
        loadSharedWithMeLinks,
        getCachedSharedWithMeLinks,
        setShareIdsState,
    };
}

/**
 * Transforms a shared links response from the API into an object with share IDs as keys,
 * and link IDs and parent IDs as values.
 */
function transformSharedLinksResponseToLinkMap(response: ListDriveSharedWithMeLinksPayload) {
    return response.Links.reduce<{
        [shareId: string]: string[];
    }>((acc, link) => {
        acc[link.ShareID] = acc[link.ShareID] ? [...acc[link.ShareID], link.LinkID] : [link.LinkID];
        return acc;
    }, {});
}
