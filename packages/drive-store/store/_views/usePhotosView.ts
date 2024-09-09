import type React from 'react';
import { useEffect, useMemo } from 'react';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import type { LinkDownload } from '../_downloads';
import { useDownloadProvider } from '../_downloads';
import type { DriveEvent, DriveEvents } from '../_events';
import { useDriveEventManager } from '../_events';
import { useLinksListing, useLinksQueue } from '../_links';
import { isPhotoGroup, sortWithCategories, usePhotos } from '../_photos';
import type { PhotoLink } from '../_photos';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from './utils';

/**
 * For Photos, we listen for delete and move events
 * to update our internal state which is not linked to the global state.
 */
export function updateByEvents(
    { events, eventId }: DriveEvents,
    shareId: string,
    removePhotosFromCache: (linkIds: string[]) => void,
    processedEventCounter: (eventId: string, event: DriveEvent) => void
) {
    const linksToRemove = events
        .filter(
            (event) =>
                event.eventType === EVENT_TYPES.DELETE ||
                (event.originShareId === shareId && event.encryptedLink.rootShareId !== event.originShareId)
        )
        .map((event) => {
            processedEventCounter(eventId, event);
            return event.encryptedLink.linkId;
        });

    removePhotosFromCache(linksToRemove);
}

export const usePhotosView = () => {
    const eventsManager = useDriveEventManager();
    const { getCachedChildren, loadLinksMeta } = useLinksListing();
    const { shareId, linkId, isLoading, volumeId, photos, loadPhotos, removePhotosFromCache } = usePhotos();
    const { addToQueue } = useLinksQueue({ loadThumbnails: true });
    const { download } = useDownloadProvider();

    const abortSignal = useAbortSignal([shareId, linkId]);
    const cache = shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);

    // This will be flattened to contain categories and links
    const { photosViewData, photoLinkIdToIndexMap, photoLinkIds } = useMemo(() => {
        if (!shareId || !linkId) {
            return {
                photosViewData: [],
                photoLinkIdToIndexMap: {},
                photoLinkIds: [],
            };
        }

        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        photos.forEach((photo) => {
            result[photo.linkId] = {
                linkId: photo.linkId,
                rootShareId: shareId,
                parentLinkId: linkId,
                isFile: true,
                activeRevision: {
                    photo,
                },
            };
        });

        // Add data from cache
        cachedLinks.forEach((link) => {
            // If this link is not a photo, ignore it
            if (!link.activeRevision?.photo) {
                return;
            }

            // Related photos are not supported by the web client for now
            if (link.activeRevision.photo.mainPhotoLinkId) {
                return;
            }

            result[link.linkId] = link;
        });

        const photosViewData = sortWithCategories(Object.values(result));

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        let photoLinkIdToIndexMap: Record<string, number> = {};

        // We also provide a list of linkIds for the preview navigation,
        // so it's important that this array follows the sorted view order.
        let photoLinkIds: string[] = [];

        photosViewData.forEach((item, index) => {
            if (!isPhotoGroup(item)) {
                photoLinkIdToIndexMap[item.linkId] = index;
                photoLinkIds.push(item.linkId);
            }
        });

        return {
            photosViewData,
            photoLinkIdToIndexMap,
            photoLinkIds,
        };
    }, [photos, cachedLinks, linkId, shareId]);

    useEffect(() => {
        if (!volumeId || !shareId) {
            return;
        }
        const abortController = new AbortController();

        loadPhotos(abortController.signal, volumeId);

        const callbackId = eventsManager.eventHandlers.register((eventVolumeId, events, processedEventCounter) => {
            if (eventVolumeId === volumeId) {
                updateByEvents(events, shareId, removePhotosFromCache, processedEventCounter);
            }
        });

        return () => {
            eventsManager.eventHandlers.unregister(callbackId);
            abortController.abort();
        };
    }, [volumeId, shareId]);

    const loadPhotoLink = (linkId: string, domRef?: React.MutableRefObject<unknown>) => {
        if (!shareId) {
            return;
        }

        addToQueue(shareId, linkId, domRef);
    };

    /**
     * A `PhotoLink` may not be fully loaded, so we need to preload all links in the cache
     * first to request a download.
     *
     * @param linkIds List of Link IDs to preload
     */
    const requestDownload = async (linkIds: string[]) => {
        if (!shareId) {
            return;
        }

        const ac = new AbortController();
        const meta = await loadLinksMeta(ac.signal, 'photos-download', shareId, linkIds);

        if (meta.links.length === 0) {
            return;
        }

        if (meta.errors.length > 0) {
            sendErrorReport(
                new EnrichedError('Failed to load links meta for download', {
                    tags: {
                        shareId,
                    },
                    extra: {
                        linkIds: linkIds.filter((id) => !meta.links.find((link) => link.linkId === id)),
                        errors: meta.errors,
                    },
                })
            );

            return;
        }

        const relatedLinkIds = meta.links.flatMap((link) => link.activeRevision?.photo?.relatedPhotosLinkIds || []);

        const relatedMeta = await loadLinksMeta(ac.signal, 'photos-related-download', shareId, relatedLinkIds);

        if (relatedMeta.errors.length > 0) {
            sendErrorReport(
                new EnrichedError('Failed to load links meta for download', {
                    tags: {
                        shareId,
                    },
                    extra: {
                        linkIds: linkIds.filter((id) => !relatedMeta.links.find((link) => link.linkId === id)),
                        errors: relatedMeta.errors,
                    },
                })
            );

            return;
        }

        const links: LinkDownload[] = [...meta.links, ...relatedMeta.links].map(
            (link) =>
                ({
                    ...link,
                    shareId: link.rootShareId,
                }) satisfies LinkDownload
        );

        await download(links);
    };

    return {
        shareId,
        linkId,
        photos: photosViewData,
        photoLinkIdToIndexMap,
        photoLinkIds,
        removePhotosFromCache,
        loadPhotoLink,
        requestDownload,
        isLoading,
    };
};

export default usePhotosView;
