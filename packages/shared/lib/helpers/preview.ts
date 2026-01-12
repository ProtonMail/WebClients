// Will include more rules in the future
import { hasPDFSupport } from './browser';
import {
    isAudio,
    isComicBook,
    isHEIC,
    isPDF,
    isSTLFile,
    isSupportedImage,
    isSupportedText,
    isVideo,
    isWordDocument,
} from './mimetype';

// The reason to limit preview is because the file needs to be loaded
// in memory. At this moment we don't even have any progress bar so
// it is better to have reasonable lower limit.
// It could be dropped once we support video streaming or dynamic
// text loading and other tricks to avoid the need to load it all.
export const MAX_PREVIEW_FILE_SIZE = 1024 * 1024 * 100;

// Adding a lot of text to DOM crashes or slows down the browser.
// Even just 2 MB is enough to hang the browser for a short amount of time.
// Someday we'll do text windowing, but for now this will do.
export const MAX_PREVIEW_TEXT_SIZE = 1024 * 1024 * 2;

export const isPreviewTooLarge = (mimeType?: string, fileSize?: number) => {
    if (!mimeType || !fileSize) {
        return false;
    }

    const maxSize = isSupportedText(mimeType) ? MAX_PREVIEW_TEXT_SIZE : MAX_PREVIEW_FILE_SIZE;
    return fileSize >= maxSize;
};

export const isPreviewAvailable = (mimeType: string, fileSize?: number) => {
    return (
        ((!fileSize || !isPreviewTooLarge(mimeType, fileSize)) &&
            (isSupportedImage(mimeType) ||
                isHEIC(mimeType) || // For this one the preview might or might be not available depending on the thumbnail
                isVideo(mimeType) ||
                isAudio(mimeType) ||
                isSupportedText(mimeType) ||
                (hasPDFSupport() && isPDF(mimeType)) ||
                isWordDocument(mimeType))) ||
        isComicBook(mimeType) ||
        isSTLFile(mimeType)
    );
};
