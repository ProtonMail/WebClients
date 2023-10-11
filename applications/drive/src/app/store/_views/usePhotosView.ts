import { useEffect, useMemo } from 'react';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { DriveEvents, useDriveEventManager } from '../_events';
import { useLink, useLinksListing } from '../_links';
import { sortWithCategories, usePhotos } from '../_photos';
import type { PhotoLink } from '../_photos';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from './utils';

/**
 * For Photos, we listen for delete and move events
 * to update our internal state which is not linked to the global state.
 */
export function updateByEvents(
    { events }: DriveEvents,
    shareId: string,
    removePhotosFromCache: (linkIds: string[]) => void
) {
    const linksToRemove = events
        .filter(
            (event) =>
                event.eventType === EVENT_TYPES.DELETE ||
                (event.originShareId === shareId && event.encryptedLink.rootShareId !== event.originShareId)
        )
        .map((event) => event.encryptedLink.linkId);

    removePhotosFromCache(linksToRemove);
}

export const usePhotosView = () => {
    const events = useDriveEventManager();
    const { getCachedChildren } = useLinksListing();
    const { getLink } = useLink();
    const { shareId, linkId, isLoading, volumeId, photos, loadPhotos, removePhotosFromCache } = usePhotos();

    const abortSignal = useAbortSignal([volumeId]);
    const cache = shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);

    // This will be flattened to contain categories and links
    const { photosViewData, photoLinkIdToIndexMap, photoLinkIds } = useMemo(() => {
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
            if (!link.activeRevision?.photo) {
                return;
            }

            // We have issue with typing but we check activeRevision before
            result[link.linkId] = link as PhotoLink;
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
            if (typeof item !== 'string') {
                photoLinkIdToIndexMap[item.linkId] = index;
                photoLinkIds.push(item.linkId);
            }
        });

        return {
            photosViewData,
            photoLinkIdToIndexMap,
            photoLinkIds,
        };
    }, [photos, cachedLinks]);

    useEffect(() => {
        if (!volumeId || !shareId) {
            return;
        }

        loadPhotos(abortSignal, volumeId);

        const callbackId = events.eventHandlers.register((eventVolumeId, events) => {
            if (eventVolumeId === volumeId) {
                updateByEvents(events, shareId, removePhotosFromCache);
            }
        });

        return () => {
            events.eventHandlers.unregister(callbackId);
        };
    }, [volumeId, shareId]);

    const loadPhotoLink = (abortSignal: AbortSignal, linkId: string) => {
        if (!shareId) {
            return;
        }
        return getLink(abortSignal, shareId, linkId);
    };

    return {
        shareId,
        linkId,
        photos: photosViewData,
        photoLinkIdToIndexMap,
        photoLinkIds,
        removePhotosFromCache,
        loadPhotoLink,
        isLoading,
        isLoadingMore: isLoading && !!photos.length,
    };
};
