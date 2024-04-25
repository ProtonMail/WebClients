import { getBrowser, getOS, isAndroid, isDesktop, isIos, isMobile } from '@proton/shared/lib/helpers/browser';

import { MIME_TYPES } from '../constants';
import { SupportedMimeTypes } from '../drive/constants';
import { Version } from './version';

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

const isAVIFSupported = () => {
    /*
     * The support for AVIF image format did reach baseline in early 2024.
     * Since it's still early and customers might not be on latest browser versions yet,
     * we're taking a safe approach allowing browsers and version for some time before removing this support check.
     * There is no clean way to detect AVIF support (eg: https://avif.io/blog/tutorials/css/#avifsupportdetectionscript) so we're using user-agent detection.
     * https://caniuse.com/?search=AVIF
     */
    let isSupported = false;
    const { name, version } = getBrowser();

    if (version) {
        const currentVersion = new Version(version);

        if (
            isDesktop() &&
            ((name === 'Chrome' && currentVersion.isGreaterThanOrEqual('85')) ||
                (name === 'Edge' && currentVersion.isGreaterThanOrEqual('121')) ||
                (name === 'Safari' && currentVersion.isGreaterThanOrEqual('16.4')) ||
                (name === 'Firefox' && currentVersion.isGreaterThanOrEqual('16.4')) ||
                (name === 'Opera' && currentVersion.isGreaterThanOrEqual('71')))
        ) {
            isSupported = true;
        }

        if (
            isMobile() &&
            ((isAndroid() &&
                (name === 'Chrome' || name === 'Chromium') &&
                currentVersion.isGreaterThanOrEqual('123')) ||
                (isIos() && name === 'Safari' && currentVersion.isGreaterThanOrEqual('16.4')))
        ) {
            isSupported = true;
        }
    }

    return isSupported;
};

const isHEICSupported = () => {
    const os = getOS();
    const { name, version } = getBrowser();
    return (
        ['mac os', 'ios'].includes(os.name.toLowerCase()) &&
        ['Safari', 'Mobile Safari'].includes(name || '') &&
        version &&
        new Version(version).isGreaterThanOrEqual('17')
    );
};

const isJXLSupported = () => {
    const os = getOS();
    const { name, version } = getBrowser();
    return (
        ['mac os', 'ios'].includes(os.name.toLowerCase()) &&
        ['Safari', 'Mobile Safari'].includes(name || '') &&
        version &&
        new Version(version).isGreaterThanOrEqual('17')
    );
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
        isAVIFSupported() && SupportedMimeTypes.avif,
        isHEICSupported() && SupportedMimeTypes.heic,
        isJXLSupported() && SupportedMimeTypes.jxl,
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
