// Will include more rules in the future
import { hasPDFSupport } from './browser';
import { isAudio, isPDF, isSupportedImage, isSupportedText, isVideo } from './mimetype';

// The reason to limit preview is because the file needs to be loaded
// in memory. At this moment we don't even have any progress bar so
// it is better to have reasonable lower limit.
// It could be dropped once we support video streaming or dynamic
// text loading and other tricks to avoid the need to load it all.
export const MAX_PREVIEW_FILE_SIZE = 1024 * 1024 * 100;

export const isPreviewAvailable = (mimeType: string, fileSize?: number) =>
    (!fileSize || fileSize < MAX_PREVIEW_FILE_SIZE) &&
    (isSupportedImage(mimeType) ||
        isVideo(mimeType) ||
        isAudio(mimeType) ||
        isSupportedText(mimeType) ||
        (hasPDFSupport() && isPDF(mimeType)));
