import type { DriveClient, ThumbnailRequest } from './loader/types';
import { useThumbnailsStore } from './loader/useThumbnails.store';

/**
 * Thumbnails module
 * Two modules available:
 * 1. Generator: providing generator of thumbnails for various file types
 *    in the browser.
 * 2. Loader: providing interface to load thumbnails by batch and stored in cache.
 */

export type { ThumbnailError } from './generator/thumbnailError';
export { generateThumbnail } from './generator/thumbnailGenerator';
export type { ThumbnailResult } from './generator/utils';
export { canHtmlVideoPlay } from './generator/handlers/videoHandler';

export const loadThumbnail = (drive: DriveClient, params: ThumbnailRequest) => {
    return useThumbnailsStore.getState().loadThumbnail(drive, params);
};

// `thumbnailKey` is the key the thumbnail is stored under: the revisionUid for
// generic multi-revision nodes, or the nodeUid for single-revision ones (photos).
export const getThumbnail = (thumbnailKey: string) => {
    return thumbnailKey ? useThumbnailsStore.getState().getThumbnail(thumbnailKey) : undefined;
};

export const useThumbnail = (thumbnailKey: string | undefined) => {
    return useThumbnailsStore((state) => (thumbnailKey ? state.getThumbnail(thumbnailKey) : undefined));
};
