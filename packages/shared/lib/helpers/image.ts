import { REGEX_IMAGE_EXTENSION } from '../constants';
import { toBase64 } from './file';

/**
 * Convert url to Image
 */
export const toImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        if (!url) {
            return reject(new Error('url required'));
        }
        const image = new Image();
        image.onload = () => {
            resolve(image);
        };
        image.onerror = reject;

        /**
         * allow external images to be used in a canvas as if they were loaded
         * from the current origin without sending any user credentials.
         * (otherwise canvas.toDataURL in resizeImage will throw complaining that the canvas is tainted)
         * An error will be thrown if the requested resource hasn't specified an appropriate CORS policy
         * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
         */
        image.crossOrigin = 'anonymous';
        image.referrerPolicy = 'no-referrer';
        image.src = url;
    });
};

interface ResizeImageProps {
    /**
     * Base64 representation of image to be resized.
     */
    original: string;
    /**
     * Maximum amount of pixels for the width of the resized image.
     */
    maxWidth?: number;
    /**
     * Maximum amount of pixels for the height of the resized image.
     */
    maxHeight?: number;
    /**
     * Mime type of the resulting resized image.
     */
    finalMimeType?: string;
    /**
     * A Number between 0 and 1 indicating image quality if the requested type is image/jpeg or image/webp.
     */
    encoderOptions?: number;
    /**
     * If both maxHeight and maxWidth are specified, pick the smaller resize factor.
     */
    bigResize?: boolean;
}

/**
 * Resizes a picture to a maximum height/width (preserving height/width ratio). When both dimensions are specified,
 * two resizes are possible: we pick the one with the bigger resize factor (so that both max dimensions are respected in the resized image)
 * @dev If maxWidth or maxHeight are equal to zero, the corresponding dimension is ignored
 */
export const resizeImage = async ({
    original,
    maxWidth = 0,
    maxHeight = 0,
    finalMimeType = 'image/jpeg',
    encoderOptions = 1,
    bigResize = false,
}: ResizeImageProps) => {
    const image = await toImage(original);
    // Resize the image
    let { width, height } = image;

    const canvas = document.createElement('canvas');
    const [widthRatio, heightRatio] = [maxWidth && width / maxWidth, maxHeight && height / maxHeight].map(Number);

    if (widthRatio <= 1 && heightRatio <= 1) {
        return image.src;
    }

    const invert = maxWidth && maxHeight && bigResize;

    if (widthRatio >= heightRatio === !invert) {
        height /= widthRatio;
        width = maxWidth;
    } else {
        width /= heightRatio;
        height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    // eslint-disable-next-line no-unused-expressions
    canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL(finalMimeType, encoderOptions);
};

/**
 * Extract the mime and base64 str from a base64 image.
 */
const extractBase64Image = (str = '') => {
    const [mimeInfo = '', base64 = ''] = (str || '').split(',');
    const [, mime = ''] = mimeInfo.match(/:(.*?);/) || [];
    return { mime, base64 };
};

/**
 * Convert a base 64 str to an uint8 array.
 */
const toUint8Array = (base64str: string) => {
    const bstr = atob(base64str);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return u8arr;
};

/**
 * Convert a data URL to a Blob Object
 */
export const toFile = (base64str: string, filename = 'file') => {
    const { base64, mime } = extractBase64Image(base64str);
    return new File([toUint8Array(base64)], filename, { type: mime });
};

/**
 * Convert a data URL to a Blob Object
 */
export const toBlob = (base64str: string) => {
    const { base64, mime } = extractBase64Image(base64str);
    return new Blob([toUint8Array(base64)], { type: mime });
};

/**
 * Down size image to reach the max size limit
 */
export const downSize = async (base64str: string, maxSize: number, mimeType = 'image/jpeg', encoderOptions = 1) => {
    const process = async (source: string, maxWidth: number, maxHeight: number): Promise<string> => {
        const resized = await resizeImage({
            original: source,
            maxWidth,
            maxHeight,
            finalMimeType: mimeType,
            encoderOptions,
        });
        const { size } = new Blob([resized]);

        if (size <= maxSize) {
            return resized;
        }

        return process(resized, Math.round(maxWidth * 0.9), Math.round(maxHeight * 0.9));
    };

    const { height, width } = await toImage(base64str);
    return process(base64str, width, height);
};

/**
 * Returns true if the URL is an inline embedded image.
 */
export const isInlineEmbedded = (src = '') => src.startsWith('data:');

/**
 * Returns true if the URL is an embedded image.
 */
export const isEmbedded = (src = '') => src.startsWith('cid:');

/**
 * Resize image file
 */
export const resize = async (fileImage: File, maxSize: number) => {
    const base64str = await toBase64(fileImage);
    return downSize(base64str, maxSize, fileImage.type);
};

/**
 * Prepare image source to be display
 */
export const formatImage = (value = '') => {
    if (!value) {
        return value;
    }

    if (REGEX_IMAGE_EXTENSION.test(value)) {
        return value;
    }

    if (value.startsWith('data:')) {
        return value;
    }

    return `data:image/png;base64,${value}`;
};
