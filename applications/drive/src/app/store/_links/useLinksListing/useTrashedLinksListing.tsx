import { useCallback, useRef } from 'react';

import { queryVolumeTrash } from '@proton/shared/lib/api/drive/volume';
import { ListDriveVolumeTrashPayload } from '@proton/shared/lib/interfaces/drive/volume';

import { useDebouncedRequest } from '../../_api';
import useVolumesState from '../../_volumes/useVolumesState';
import { DecryptedLink, EncryptedLink } from './../interface';
import useLinksState from './../useLinksState';
import { DEFAULT_SORTING, FetchMeta, FetchResponse, PAGE_SIZE, useLinksListingHelpers } from './useLinksListingHelpers';

type TrashFetchState = {
    [volumeId: string]: FetchMeta;
};

type FetchLoadLinksMeta = (
    abortSignal: AbortSignal,
    query: string,
    shareId: string,
    linkIds: string[]
) => Promise<{
    links: EncryptedLink[];
    parents: EncryptedLink[];
}>;

export function useTrashedLinksListing() {
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const volumesState = useVolumesState();

    const { loadFullListing, cacheLoadedLinks, getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
    const trashFetchState = useRef<TrashFetchState>({});

    const getTrashFetchState = (volumeId: string): FetchMeta => {
        if (trashFetchState.current[volumeId]) {
            return trashFetchState.current[volumeId];
        }

        trashFetchState.current[volumeId] = {
            lastPage: 0,
            lastSorting: DEFAULT_SORTING,
        };

        return trashFetchState.current[volumeId];
    };

    const fetchTrashedLinksNextPage = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<boolean> => {
        let trashFetchMeta = getTrashFetchState(volumeId);

        const handleVolumePage = async () => {
            const queryLinkIds = async () => {
                const response = await debouncedRequest<ListDriveVolumeTrashPayload>(
                    queryVolumeTrash(volumeId, { Page: trashFetchMeta.lastPage, PageSize: 5 })
                );

                const hasNextPage = Object.values(response.Trash).some((share) => {
                    return share.LinkIDs.length < PAGE_SIZE;
                });

                return {
                    hasNextPage,
                    response,
                };
            };

            const { response, hasNextPage } = await queryLinkIds();

            const volumeShareIds = response.Trash.map((share) => share.ShareID);
            volumesState.setVolumeShareIds(volumeId, volumeShareIds);

            const transformedResponse = response.Trash.reduce(
                (acc, share) => {
                    acc[share.ShareID] = { linkIds: share.LinkIDs, parentIds: share.ParentIDs };
                    return acc;
                },
                {} as {
                    [shareId: string]: {
                        linkIds: string[];
                        parentIds: string[];
                    };
                }
            );

            const links: FetchResponse['links'] = [];
            const parents: FetchResponse['parents'] = [];

            // Loading links meta
            for (const shareId in transformedResponse) {
                const result = await loadLinksMeta(signal, 'trash', shareId, transformedResponse[shareId].linkIds);
                links.push(...result.links);
                parents.push(...result.parents);

                await cacheLoadedLinks(signal, shareId, result.links, result.parents);
            }

            trashFetchMeta.lastPage!++;

            return hasNextPage;
        };

        return handleVolumePage();
    };

    const loadTrashedLinks = async (
        signal: AbortSignal,
        volumeId: string,
        loadLinksMeta: FetchLoadLinksMeta
    ): Promise<void> => {
        return loadFullListing(() => fetchTrashedLinksNextPage(signal, volumeId, loadLinksMeta));
    };

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

            const links = result.reduce((acc, element) => {
                return [...acc, ...element.links];
            }, [] as DecryptedLink[]);

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
