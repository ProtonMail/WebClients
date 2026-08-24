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
export { useInitEncryptedThumbnailCache } from './encryptedThumbnailCache';

export const loadThumbnail = (drive: DriveClient, params: ThumbnailRequest) => {
    return useThumbnailsStore.getState().loadThumbnail(drive, params);
};

export const useThumbnail = (thumbnailKey: string | undefined) => {
    return useThumbnailsStore((state) => (thumbnailKey ? state.getThumbnailFromCache(thumbnailKey) : undefined));
};

// Cache-or-fetch: waits for the thumbnail to be loaded (successfully or not) instead of
// returning a snapshot.
export const getThumbnail = (drive: DriveClient, params: ThumbnailRequest) => {
    return useThumbnailsStore.getState().getThumbnail(drive, params);
};

/**
 * Gets the raw bytes of a node's thumbnail, checking the cache first and fetching if needed.
 *
 * How it works:
 * 1. Tries each type in `params.thumbnailTypes` in order (e.g. `['hd', 'sd']`) to find the best available look.
 * 2. Returns a single `Uint8Array` on success (a thumbnail is always one blob).
 * 3. Resolves to `undefined` only if none of the requested types are available.
 */
export const getThumbnailBytes = (drive: DriveClient, params: ThumbnailRequest) => {
    return useThumbnailsStore.getState().getThumbnailBytes(drive, params);
};
