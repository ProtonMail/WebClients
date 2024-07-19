import { useCallback, useRef } from 'react';

import { queryVolumeTrash } from '@proton/shared/lib/api/drive/volume';
import type { ListDriveVolumeTrashPayload } from '@proton/shared/lib/interfaces/drive/volume';

import { useDebouncedRequest } from '../../_api';
import useVolumesState from '../../_volumes/useVolumesState';
import type { DecryptedLink } from './../interface';
import useLinksState from './../useLinksState';
import type { FetchLoadLinksMeta } from './interface';
import type { FetchMeta, SortParams } from './useLinksListingHelpers';
import { DEFAULT_SORTING, PAGE_SIZE, useLinksListingHelpers } from './useLinksListingHelpers';

interface FetchTrashMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

type TrashFetchState = {
    [volumeId: string]: FetchTrashMeta;
};

/**
 * Custom hook for managing and fetching trashed links for a given volume.
 */
export function useTrashedLinksListing() {
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const volumesState = useVolumesState();

    const { loadFullListing, getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
    const trashFetchState = useRef<TrashFetchState>({});

    const getTrashFetchState = useCallback((volumeId: string) => {
        if (trashFetchState.current[volumeId]) {
            return trashFetchState.current[volumeId];
        }

        trashFetchState.current[volumeId] = {
            lastPage: 0,
            lastSorting: DEFAULT_SORTING,
        };

        return trashFetchState.current[volumeId];
    }, []);

    const queryVolumeTrashPage = async (
        volumeId: string,
        page: number
    ): Promise<{ response: ListDriveVolumeTrashPayload; hasNextPage: boolean }> => {
        const response = await debouncedRequest<ListDriveVolumeTrashPayload>(
            queryVolumeTrash(volumeId, { Page: page, PageSize: PAGE_SIZE })
        );

        const totalLinks = Object.values(response.Trash).reduce((acc, trash) => acc + trash.LinkIDs.length, 0);
        const hasNextPage = totalLinks >= PAGE_SIZE;

        return {
            response,
            hasNextPage,
        };
    };

    const loadTrashedLinksMeta = async (
        signal: AbortSignal,
        transformedResponse: {
            [shareId: string]: { linkIds: string[]; parentIds: string[] };
        },
        fetchMeta: FetchTrashMeta,
        loadLinksMeta: FetchLoadLinksMeta
    ) => {
        for (const shareId in transformedResponse) {
            await loadLinksMeta(signal, 'trash', shareId, transformedResponse[shareId].linkIds, {
                fetchMeta,
            });
        }
    };

    const fetchTrashedLinksNextPage = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<boolean> => {
        let trashFetchMeta = getTrashFetchState(volumeId);

        if (trashFetchMeta.isEverythingFetched) {
            return false;
        }

        const { response, hasNextPage } = await queryVolumeTrashPage(volumeId, trashFetchMeta.lastPage);
        const volumeShareIds = response.Trash.map((share) => share.ShareID);
        volumesState.setVolumeShareIds(volumeId, volumeShareIds);

        const transformedResponse = transformTrashResponseToLinkMap(response);
        await loadTrashedLinksMeta(signal, transformedResponse, trashFetchMeta, loadLinksMeta);

        trashFetchMeta.lastPage++;
        trashFetchMeta.isEverythingFetched = !hasNextPage;

        return hasNextPage;
    };

    /**
     * Loads trashed links for a given volume.
     */
    const loadTrashedLinks = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<void> => {
        return loadFullListing(() => fetchTrashedLinksNextPage(signal, volumeId, loadLinksMeta));
    };

    /**
     * Gets trashed links that have already been fetched and cached.
     */
    const getCachedTrashed = useCallback(
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
                    linksState.getTrashed(shareId),
                    getTrashFetchState(volumeId)
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
        [linksState.getTrashed]
    );

    return {
        loadTrashedLinks,
        getCachedTrashed,
    };
}

/**
 * Transforms a trash response from the API into an object with share IDs as keys,
 * and link IDs and parent IDs as values.
 */
function transformTrashResponseToLinkMap(response: ListDriveVolumeTrashPayload) {
    return response.Trash.reduce<{
        [shareId: string]: {
            linkIds: string[];
            parentIds: string[];
        };
    }>((acc, share) => {
        acc[share.ShareID] = {
            linkIds: share.LinkIDs,
            parentIds: share.ParentIDs,
        };
        return acc;
    }, {});
}
