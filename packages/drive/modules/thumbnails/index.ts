import { useShallow } from 'zustand/react/shallow';

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

export const getThumbnail = (revisionUid: string) => {
    return revisionUid ? useThumbnailsStore.getState().getThumbnail(revisionUid) : undefined;
};

export const useThumbnail = (revisionUid: string | undefined) => {
    return useThumbnailsStore(useShallow((state) => (revisionUid ? state.getThumbnail(revisionUid) : undefined)));
};
