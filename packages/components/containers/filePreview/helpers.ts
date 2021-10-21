import { hasPDFSupport, getBrowser } from '@proton/shared/lib/helpers/browser';

const isWebpSupported = () => {
    const { name, version } = getBrowser();

    if (name === 'Safari') {
        /*
         * The support for WebP image format became available in Safari 14.
         * It is not possible to support webp images in older Safari versions.
         * https://developer.apple.com/documentation/safari-release-notes/safari-14-release-notes
         */
        return Number(version?.split('.')[0]) >= 14;
    }

    return true;
};

export const isImage = (mimeType: string) => mimeType.startsWith('image/');

export const isExcel = (mimeType: string) => mimeType.startsWith('application/vnd.ms-excel');

export const isFont = (MimeType: string) => MimeType.startsWith('font/');

export const isSupportedImage = (mimeType: string) =>
    [
        'image/apng',
        'image/bmp',
        'image/gif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        isWebpSupported() && 'image/webp',
    ]
        .filter(Boolean)
        .includes(mimeType);

export const isSVG = (mimeType: string) => mimeType === 'image/svg+xml';

export const isSupportedText = (mimeType: string) =>
    mimeType.startsWith('text/') || ['application/javascript', 'application/typescript'].includes(mimeType);
export const isVideo = (mimeType: string) => mimeType.startsWith('video/');
export const isICS = (mimeType: string) => mimeType.startsWith('text/calendar');
export const isPDF = (mimeType: string) => mimeType === 'application/pdf' || mimeType === 'x-pdf';

/**
 * isSupportedVideo returns true for any video smaller than 100 MB.
 * The reason is currently we don't support streaming and thus the whole
 * video content has to be buffered and fit memory.
 */
export const isSupportedVideo = (mimeType: string, fileSize?: number) =>
    isVideo(mimeType) && fileSize && fileSize < 1024 * 1024 * 100;

// Will include more rules in the future
export const isPreviewAvailable = (mimeType: string, fileSize?: number) =>
    isSupportedImage(mimeType) ||
    isSupportedVideo(mimeType, fileSize) ||
    isSupportedText(mimeType) ||
    (hasPDFSupport() && isPDF(mimeType));
