import { useCallback, useRef } from 'react';

import { querySharedWithMeLinks } from '@proton/shared/lib/api/drive/sharing';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import type { ListDriveSharedWithMeLinksPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import { useDirectSharingInfo } from '../../_shares/useDirectSharingInfo';
import { useVolumesState } from '../../_volumes';
import type { DecryptedLink } from '../interface';
import useLinksState from '../useLinksState';
import type { FetchLoadLinksMetaByVolume } from './interface';
import type { FetchMeta, SortParams } from './useLinksListingHelpers';
import { DEFAULT_SORTING, useLinksListingHelpers } from './useLinksListingHelpers';

interface FetchSharedLinksMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

/**
 * Custom hook for managing and fetching shared with me links.
 */
export function useSharedWithMeLinksListingByVolume() {
    const debouncedRequest = useDebouncedRequest();
    const linksState = useLinksState();
    const volumesState = useVolumesState();
    const { getVerificationKey } = useDriveCrypto();
    const { getDirectSharingInfo } = useDirectSharingInfo();
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

    const { cacheLoadedLinks, loadFullListingWithAnchor, getDecryptedLinksAndDecryptRest } = useLinksListingHelpers();
    const fetchMeta = useRef<FetchSharedLinksMeta>({
        lastPage: 0,
        lastSorting: DEFAULT_SORTING,
    });

    const loadSharedLinksMeta = async (
        signal: AbortSignal,
        transformedResponse: {
            [volumeId: string]: { shareId: string; linkId: string }[];
        },
        loadLinksMetaByVolume: FetchLoadLinksMetaByVolume
    ) => {
        /*
        The store with state in React hooks was not ready for "shared with me".

        The store can load dynamically anything what is missing and update its
        state as needed. But it comes with a performance and edge cases price.
        The state must be updated frequently, causing re-renders of everything
        that must count with that and ensure computation is not done twice etc.

        That doesn't work well in all cases, killing the app or React due to
        recursion on re-renders. Its better to avoid doing state update in
        parallel to avoid such issues. But that has very slow performance.

        Alternatively, we could keep it at series, but fetch everything we know
        (even if its not concern of this module) in advance (even if its
        blocking to decrypt and show anything until that is done). That ensures
        that state will be updated less frequently and will not be blocking
        itself, avoid edge cases that the same resource is fetched or decrypted
        twice, and then the serial aproach is used only to actualy node
        decryption and updating the cache to avoid causing re-renders.

        With that, the load of shared with me page goes down to ~25% of the
        original time.

        Note: this solution will work enough for less than around 100 of items.
        For more, major refactor will be required to change completely how the
        loading is done. The reason is that the whole page must be loaded
        first before we show anything.

        Future consideration: we verify signatures together with decryption.
        For refactor, we should do it async on background that doesnt block
        loading. Validating signatures for own files is easier than for others
        as that requires loading public address keys which own keys are in
        memory ready to be used.
        */

        // We cannot let fetch all resources at once, that can be 100s of requests.
        const BATCH_PROCESSING = 10;

        const nodeQueue = Object.keys(transformedResponse).map((volumeId) => {
            return () =>
                loadLinksMetaByVolume(signal, volumeId, transformedResponse[volumeId], {
                    fetchMeta: fetchMeta.current,
                    removeParentLinkId: true,
                });
        });
        const results = await runInQueue(nodeQueue, BATCH_PROCESSING);

        const addresses = new Set(
            Object.values(results).flatMap((result) => {
                return Object.values(result).flatMap(({ links }) => {
                    return [...links.map(({ signatureAddress }) => signatureAddress)];
                });
            })
        );
        const addressesQueue = [...addresses].map((address) => {
            return () => getVerificationKey(address);
        });
        await runInQueue(addressesQueue, BATCH_PROCESSING);

        const shareIds = new Set(Object.values(results).flatMap(Object.keys));
        const sharesQueue = [...shareIds].map((shareId) => {
            return () =>
                getDirectSharingInfo(signal, shareId)
                    .then((shareInfo) => ({
                        ...shareInfo,
                        shareId,
                    }))
                    .catch((e) => {
                        // If we can't get the share info, continue to load the rest of shares
                        const error = new EnrichedError(e.message, {
                            tags: { shareId },
                            extra: { e },
                        });
                        sendErrorReport(error);
                        return {
                            shareId,
                            sharedOn: undefined,
                            sharedBy: undefined,
                        };
                    });
        });
        const shareInfoResults = await runInQueue(sharesQueue, BATCH_PROCESSING);

        // Create a map for quick lookup of shareInfo
        const shareInfoMap = new Map(shareInfoResults.map((info) => [info.shareId, info]));

        // Sort results based on sharedOn date in descending order
        const sortedResults = Object.entries(results).sort((a, b) => {
            const getSharedOnDate = (entry: [string, any]) => {
                const shareId = Object.keys(entry[1])[0];
                return shareInfoMap.get(shareId)?.sharedOn || 0;
            };
            return getSharedOnDate(b) - getSharedOnDate(a);
        });

        for (const [, result] of sortedResults) {
            for (const [shareId, { links, parents }] of Object.entries(result)) {
                const shareInfo = shareInfoMap.get(shareId);
                const linksWithShareInfo = links.map((link) => ({
                    ...link,
                    sharedOn: shareInfo?.sharedOn,
                    sharedBy: shareInfo?.sharedBy,
                }));
                await cacheLoadedLinks(signal, shareId, linksWithShareInfo, parents);
            }
        }
    };

    const fetchSharedLinksNextPage = async (
        signal: AbortSignal,
        loadLinksMetaByVolume: FetchLoadLinksMetaByVolume,
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
        await loadSharedLinksMeta(signal, transformedResponse, loadLinksMetaByVolume);

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
        loadLinksMetaByVolume: FetchLoadLinksMetaByVolume,
        resetFetchStatus: boolean = false
    ): Promise<{ Count?: number } | void> => {
        // TODO: Remove this when we will have share events in place
        // This allow us to retrigger the loadSharedWithMeLinks call
        if (resetFetchStatus) {
            fetchMeta.current.isEverythingFetched = false;
        }
        const callback = (AnchorID?: string) => fetchSharedLinksNextPage(signal, loadLinksMetaByVolume, AnchorID);
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
        [volumeId: string]: { linkId: string; shareId: string }[];
    }>((acc, link) => {
        acc[link.VolumeID] = acc[link.VolumeID]
            ? [...acc[link.VolumeID], { linkId: link.LinkID, shareId: link.ShareID }]
            : [{ linkId: link.LinkID, shareId: link.ShareID }];
        return acc;
    }, {});
}
