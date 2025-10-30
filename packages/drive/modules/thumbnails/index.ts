/**
 * Thumbnails module providing generator of thumbnails for various file types
 * in the browser.
 *
 * The module might use various 3rd party libraries to generate the thumbnails
 * that runs in the web worker, or it might use the native browser APIs to
 * generate the thumbnails.
 */

export type { ThumbnailError } from './thumbnailError';
export { generateThumbnail } from './thumbnailGenerator';
export type { ThumbnailResult } from './utils';
