import { isSafari, hasPDFSupport } from '@proton/shared/lib/helpers/browser';

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
        !isSafari() && 'image/webp',
    ]
        .filter(Boolean)
        .includes(mimeType);

export const isSupportedText = (mimeType: string) =>
    mimeType.startsWith('text/') || ['application/javascript', 'application/typescript'].includes(mimeType);
export const isVideo = (mimeType: string) => mimeType.startsWith('video/');
export const isICS = (mimeType: string) => mimeType.startsWith('text/calendar');
export const isPDF = (mimeType: string) => mimeType === 'application/pdf' || mimeType === 'x-pdf';

// Will include more rules in the future
export const isPreviewAvailable = (mimeType: string) =>
    isSupportedImage(mimeType) || isSupportedText(mimeType) || (hasPDFSupport() && isPDF(mimeType));
