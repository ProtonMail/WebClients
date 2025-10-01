import {
    HD_THUMBNAIL_MAX_SIZE,
    SupportedMimeTypes,
    THUMBNAIL_MAX_SIZE,
    THUMBNAIL_QUALITIES,
} from '@proton/shared/lib/drive/constants';
import { isIos, isSafari } from '@proton/shared/lib/helpers/browser';

import { ThumbnailType } from './interface';

// Safari and iOS browsers doesn't support image/webp for canvas.toBlob/convertToBlob type parameter which will fallback to png by default
// We force jpeg to prevent generating really large png.
function getEffectiveMimeType(mimeType: SupportedMimeTypes): SupportedMimeTypes {
    return (isSafari() || isIos()) && mimeType === SupportedMimeTypes.webp ? SupportedMimeTypes.jpg : mimeType;
}

export async function canvasToThumbnail(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    thumbnailType: ThumbnailType = ThumbnailType.PREVIEW,
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg = SupportedMimeTypes.webp
) {
    // We check clear text thumbnail size but the limit on API is for encrypted
    // text. To do the check on proper place would be too difficult for little
    // gain. The increase in size is under 10 percent, so limit it to 90% of
    // real limit is reasonable.
    const maxSize = thumbnailType === ThumbnailType.HD_PREVIEW ? HD_THUMBNAIL_MAX_SIZE * 0.9 : THUMBNAIL_MAX_SIZE * 0.9;

    for (const quality of THUMBNAIL_QUALITIES) {
        const data = await canvasToArrayBuffer(canvas, mimeType, quality);
        if (data.byteLength < maxSize) {
            return data;
        }
    }
    throw new Error('Cannot create small enough thumbnail');
}

function canvasToArrayBuffer(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
    quality: number
): Promise<ArrayBuffer> {
    if (canvas instanceof OffscreenCanvas) {
        return canvasToArrayBufferOffscreen(canvas, mimeType, quality);
    } else {
        return canvasToArrayBufferHTML(canvas, mimeType, quality);
    }
}

function canvasToArrayBufferHTML(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<ArrayBuffer> {
    const effectiveMimeType = getEffectiveMimeType(mimeType as SupportedMimeTypes.webp | SupportedMimeTypes.jpg);
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (d) => {
                if (!d) {
                    reject(new Error('Blob not available'));
                    return;
                }
                const r = new FileReader();
                r.addEventListener('load', () => {
                    resolve(r.result as ArrayBuffer);
                });
                r.addEventListener('error', reject);
                r.readAsArrayBuffer(d);
            },
            effectiveMimeType,
            quality
        )
    );
}

async function canvasToArrayBufferOffscreen(
    canvas: OffscreenCanvas,
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
    quality: number
): Promise<ArrayBuffer> {
    const effectiveMimeType = getEffectiveMimeType(mimeType);
    try {
        const blob = await canvas.convertToBlob({
            type: effectiveMimeType,
            quality: quality,
        });
        return await blob.arrayBuffer();
    } catch (error) {
        throw new Error(`Failed to convert OffscreenCanvas to ArrayBuffer: ${error}`);
    }
}
