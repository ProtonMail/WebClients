import { useCallback, useRef } from 'react';

import { querySharedByMeLinks } from '@proton/shared/lib/api/drive/sharing';
import { queryVolumeSharedLinks } from '@proton/shared/lib/api/drive/volume';
import { ListDriveSharedByMeLinksPayload } from '@proton/shared/lib/interfaces/drive/sharing';
import { ListDriveVolumeSharedLinksPayload } from '@proton/shared/lib/interfaces/drive/volume';

import { useDebouncedRequest } from '../../_api';
import useVolumesState from '../../_volumes/useVolumesState';
import { DecryptedLink } from '../interface';
import useLinksState from '../useLinksState';
import { FetchLoadLinksMeta } from './interface';
import { DEFAULT_SORTING, FetchMeta, PAGE_SIZE, SortParams, useLinksListingHelpers } from './useLinksListingHelpers';

interface FetchSharedLinksMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

type SharedLinksFetchState = {
    [volumeId: string]: FetchSharedLinksMeta;
};

/**
 * Custom hook for managing and fetching shared links for a given volume.
 */
export function useSharedLinksListing() {
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const volumesState = useVolumesState();

    const { loadFullListing, loadFullListingWithAnchor, getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
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

    const queryVolumeSharedLinksPage = async (
        volumeId: string,
        page: number
    ): Promise<{ response: ListDriveVolumeSharedLinksPayload; hasNextPage: boolean }> => {
        const response = await debouncedRequest<ListDriveVolumeSharedLinksPayload>(
            queryVolumeSharedLinks(volumeId, { Page: page, PageSize: PAGE_SIZE })
        );

        const totalLinks = Object.values(response.ShareURLContexts).reduce(
            (acc, share) => acc + share.ShareURLs.length,
            0
        );
        const hasNextPage = totalLinks >= PAGE_SIZE;

        return {
            response,
            hasNextPage,
        };
    };

    const loadSharedLinksMeta = async (
        signal: AbortSignal,
        transformedResponse: {
            [shareId: string]: string[];
        },
        loadLinksMeta: FetchLoadLinksMeta
    ) => {
        for (const shareId in transformedResponse) {
            await loadLinksMeta(signal, 'sharedByLink', shareId, transformedResponse[shareId]);
        }
    };

    const fetchSharedLinksNextPage = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<boolean> => {
        let sharedLinksFetchMeta = getSharedLinksFetchState(volumeId);

        if (sharedLinksFetchMeta.isEverythingFetched) {
            return false;
        }

        const { response, hasNextPage } = await queryVolumeSharedLinksPage(volumeId, sharedLinksFetchMeta.lastPage);
        const volumeShareIds = response.ShareURLContexts.map((share) => share.ContextShareID);
        volumesState.setVolumeShareIds(volumeId, volumeShareIds);

        const transformedResponse = transformSharedLinksResponseToLinkMap(response);
        await loadSharedLinksMeta(signal, transformedResponse, loadLinksMeta);

        sharedLinksFetchMeta.lastPage++;
        sharedLinksFetchMeta.isEverythingFetched = !hasNextPage;

        return hasNextPage;
    };

    const fetchSharedByMeLinksNextPage = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta,
        AnchorID?: string
    ): Promise<{ AnchorID: string; More: boolean }> => {
        const response = await debouncedRequest<ListDriveSharedByMeLinksPayload>(
            querySharedByMeLinks(volumeId, { AnchorID })
        );

        const volumeShareIds = response.Links.map((link) => link.ContextShareID);
        volumesState.setVolumeShareIds(volumeId, volumeShareIds);

        const transformedResponse = transformSharedByMeLinksResponseToLinkMap(response);
        await loadSharedLinksMeta(signal, transformedResponse, loadLinksMeta);

        return {
            AnchorID: response.AnchorID,
            More: response.More,
        };
    };

    /**
     * Loads shared links for a given volume.
     */
    const loadSharedLinksLEGACY = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<void> => {
        return loadFullListing(() => fetchSharedLinksNextPage(signal, volumeId, loadLinksMeta));
    };

    /**
     * Loads shared by me links.
     */
    const loadSharedByMeLinks = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<void> => {
        const callback = (AnchorID?: string) => fetchSharedByMeLinksNextPage(signal, volumeId, loadLinksMeta, AnchorID);
        return loadFullListingWithAnchor(callback);
    };

    /**
     * Gets shared links that have already been fetched and cached.
     */
    const getCachedSharedLinks = useCallback(
        (abortSignal: AbortSignal, volumeId?: string): { links: DecryptedLink[]; isDecrypting: boolean } => {
            if (!volumeId) {
                return {
                    links: [],
                    isDecrypting: false,
                };
            }
            const associatedShareIds = volumesState.getVolumeShareIds(volumeId);
            const result = associatedShareIds.map((shareId) => {
                return getDecryptedLinksAndDecryptRest(
                    abortSignal,
                    shareId,
                    linksState.getSharedByLink(shareId),
                    getSharedLinksFetchState(volumeId)
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
        loadSharedLinksLEGACY,
        // This include direct sharing shares,
        loadSharedByMeLinks,
        getCachedSharedLinks,
    };
}

/**
 * Transforms a shared links response from the API into an object with share IDs as keys,
 * and link IDs and parent IDs as values.
 */
function transformSharedLinksResponseToLinkMap(response: ListDriveVolumeSharedLinksPayload) {
    return response.ShareURLContexts.reduce<{
        [shareId: string]: string[];
    }>((acc, share) => {
        acc[share.ContextShareID] = share.LinkIDs;
        return acc;
    }, {});
}

/**
 * Transforms a shared links response from the API into an object with ContextShare IDs as keys,
 * and link IDs as values
 */
function transformSharedByMeLinksResponseToLinkMap(response: ListDriveSharedByMeLinksPayload) {
    return response.Links.reduce<{
        [shareId: string]: string[];
    }>((acc, link) => {
        acc[link.ContextShareID] = acc[link.ContextShareID]
            ? [...acc[link.ContextShareID], link.LinkID]
            : [link.LinkID];
        return acc;
    }, {});
}
