import { useCallback, useRef } from 'react';

import { querySharedWithMeLinks } from '@proton/shared/lib/api/drive/sharing';
import { ListDriveSharedWithMeLinksPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { useDebouncedRequest } from '../../_api';
import { useVolumesState } from '../../_volumes';
import { DecryptedLink } from '../interface';
import useLinksState from '../useLinksState';
import { FetchLoadLinksMeta } from './interface';
import { DEFAULT_SORTING, FetchMeta, SortParams, useLinksListingHelpers } from './useLinksListingHelpers';

interface FetchSharedLinksMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

type SharedLinksFetchState = {
    [volumeId: string]: FetchSharedLinksMeta;
};

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
    };

    const getShareIdsState = (): string[] => Array.from(shareIdsState.current || new Set());

    const { loadFullListingWithAnchor, getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
    const sharedLinksFetchState = useRef<SharedLinksFetchState>({});

    const getSharedLinksFetchState = useCallback((volumeId: string) => {
        if (sharedLinksFetchState.current[volumeId]) {
            return sharedLinksFetchState.current[volumeId];
        }

        sharedLinksFetchState.current[volumeId] = {
            lastPage: 0,
            lastSorting: DEFAULT_SORTING,
        };

        return sharedLinksFetchState.current[volumeId];
    }, []);

    const loadSharedLinksMeta = async (
        signal: AbortSignal,
        transformedResponse: {
            [shareId: string]: string[];
        },
        loadLinksMeta: FetchLoadLinksMeta
    ) => {
        for (const shareId in transformedResponse) {
            await loadLinksMeta(signal, 'sharedWithMyLink', shareId, transformedResponse[shareId]);
        }
    };

    const fetchSharedLinksNextPage = async (
        signal: AbortSignal,
        loadLinksMeta: FetchLoadLinksMeta,
        AnchorID?: string
    ): Promise<{ AnchorID: string; More: boolean }> => {
        const response = await debouncedRequest<ListDriveSharedWithMeLinksPayload>(
            querySharedWithMeLinks({ AnchorID })
        );
        const shareIds = response.Links.map((link) => {
            volumesState.setVolumeShareIds(link.VolumeID, [link.ShareID]);
            return link.ShareID;
        });
        setShareIdsState(shareIds);

        const transformedResponse = transformSharedLinksResponseToLinkMap(response);
        await loadSharedLinksMeta(signal, transformedResponse, loadLinksMeta);

        return {
            AnchorID: response.AnchorID,
            More: response.More,
        };
    };

    /**
     * Loads shared with me links.
     */
    const loadSharedWithMeLinks = async (signal: AbortSignal, loadLinksMeta: FetchLoadLinksMeta): Promise<void> => {
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
                    getSharedLinksFetchState('sharedWithMe')
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
