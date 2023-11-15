import React, { useEffect, useMemo } from 'react';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { LinkDownload, useDownloadProvider } from '../_downloads';
import { DriveEvents, useDriveEventManager } from '../_events';
import { useLinksListing, useLinksQueue } from '../_links';
import { isPhotoGroup, sortWithCategories, usePhotos } from '../_photos';
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
    const { getCachedChildren, loadLinksMeta } = useLinksListing();
    const { shareId, linkId, isLoading, volumeId, photos, loadPhotos, removePhotosFromCache } = usePhotos();
    const { addToQueue } = useLinksQueue({ loadThumbnails: true });
    const { download } = useDownloadProvider();

    const abortSignal = useAbortSignal([volumeId, shareId]);
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
            // If this link is not a photo, ignore it
            if (!link.activeRevision?.photo) {
                return;
            }

            // Related photos are not supported by the web client for now
            if (link.activeRevision.photo.mainPhotoLinkId) {
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
            console.error(new Error('Failed to load links meta for download'), {
                shareId,
                linkIds: linkIds.filter((id) => !meta.links.find((link) => link.linkId === id)),
                errors: meta.errors,
            });

            return;
        }

        const links: LinkDownload[] = meta.links.map(
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
        isLoadingMore: isLoading && !!photos.length,
    };
};

export default usePhotosView;
