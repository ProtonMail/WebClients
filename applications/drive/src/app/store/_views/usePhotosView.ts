import { useEffect, useMemo } from 'react';

import { useLink, useLinksListing } from '../_links';
import { flattenWithCategories, usePhotos } from '../_photos';
import type { PhotoLink } from '../_photos/interface';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from './utils';

export const usePhotosView = () => {
    const { getCachedChildren } = useLinksListing();
    const { getLink } = useLink();
    const { shareId, linkId, isLoading, volumeId, photos, loadPhotos } = usePhotos();

    const abortSignal = useAbortSignal([volumeId]);
    const cache = shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);

    // This will be flattened to contain categories and links
    const photosViewData = useMemo(() => {
        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        photos.forEach((photo) => {
            result[photo.linkId] = {
                linkId: photo.linkId,
                activeRevision: {
                    photo,
                },
            };
        });

        // Add data from cache
        cachedLinks.forEach((link) => {
            result[link.linkId] = link;
        });

        // Sort values by captureTime
        const values = Object.values(result);
        values.sort(
            (a, b) =>
                (b.activeRevision?.photo?.captureTime || Date.now()) -
                (a.activeRevision?.photo?.captureTime || Date.now())
        );

        return flattenWithCategories(values);
    }, [photos, cachedLinks]);

    useEffect(() => {
        if (!volumeId) {
            return;
        }
        loadPhotos(abortSignal, volumeId);
    }, [volumeId]);

    const getPhotoLink = (abortSignal: AbortSignal, linkId: string) => {
        if (!shareId) {
            return;
        }
        return getLink(abortSignal, shareId, linkId);
    };

    return {
        shareId,
        linkId,
        photos: photosViewData,
        getPhotoLink,
        isLoading,
        isLoadingMore: isLoading && !!photos.length,
    };
};
