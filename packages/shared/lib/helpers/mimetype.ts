import { getBrowser } from '@proton/shared/lib/helpers/browser';

import { MIME_TYPES } from '../constants';
import { SupportedMimeTypes } from '../drive/constants';

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

export const isWordDocument = (mimeType: string) => mimeType === SupportedMimeTypes.docx;

export const isFont = (mimeType: string) => mimeType.startsWith('font/');

export const isSupportedImage = (mimeType: string) =>
    [
        SupportedMimeTypes.apng,
        SupportedMimeTypes.bmp,
        SupportedMimeTypes.gif,
        SupportedMimeTypes.ico,
        SupportedMimeTypes.vdnMicrosoftIcon,
        SupportedMimeTypes.jpg,
        SupportedMimeTypes.png,
        SupportedMimeTypes.svg,
        isWebpSupported() && SupportedMimeTypes.webp,
    ]
        .filter(Boolean)
        .includes(mimeType as SupportedMimeTypes);

export const isSVG = (mimeType: string) => mimeType === SupportedMimeTypes.svg;

export const isICS = (mimeType: string) =>
    mimeType.startsWith(MIME_TYPES.ICS) || mimeType.includes(MIME_TYPES.APPLICATION_ICS);

export const isSupportedText = (mimeType: string) =>
    mimeType.startsWith('text/') ||
    [
        'application/json',
        'application/javascript',
        'application/typescript',
        'application/x-tex',
        'application/x-csh',
        'application/x-sh',
        'application/x-httpd-php',
        'application/xhtml+xml',
    ].includes(mimeType);
export const isVideo = (mimeType: string) => mimeType.startsWith('video/');
export const isAudio = (mimeType: string) => mimeType.startsWith('audio/');
export const isPDF = (mimeType: string) => mimeType === 'application/pdf' || mimeType === 'x-pdf';
