import { isSafari } from '@proton/shared/lib/helpers/browser';

interface HeicToBlobOptions {
    format?: 'image/jpeg' | 'image/webp';
}

/**
 * Converts a HEIC file to an image Blob
 * @param heicFile - The HEIC File
 * @param options - Optional parameters
 * @returns Promise resolving to an image blob in the requested format
 */
export async function heicToBlob(heicFile: File | Blob, options: HeicToBlobOptions = {}): Promise<Blob> {
    const format = options.format || 'image/webp';
    const { heicTo } = await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "heic-to-js" */
        'heic-to/csp'
    );

    const image = await heicTo({
        blob: heicFile,
        type: isSafari() ? 'image/jpeg' : format,
        quality: 1,
    });
    return image;
}
