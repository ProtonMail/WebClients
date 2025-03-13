import { HD_THUMBNAIL_MAX_SIDE, HD_THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';

import { canvasToThumbnail } from './canvasUtil';
import type { ThumbnailInfo } from './interface';
import { ThumbnailType } from './interface';
import { calculateThumbnailSize } from './util';

export const imageCannotBeLoadedError = new Error('Image cannot be loaded');

interface ReturnProps {
    width?: number;
    height?: number;
    thumbnails?: ThumbnailInfo[];
}

const getLongestEdge = (width: number, height: number) => (width > height ? width : height);

export const shouldGenerateHDPreview = (size: number, width: number, height: number): boolean => {
    const edge = getLongestEdge(width, height);
    return edge > HD_THUMBNAIL_MAX_SIDE && size > HD_THUMBNAIL_MAX_SIZE;
};

export function scaleImageFile(
    {
        file,
    }: {
        file: Blob;
    },
    thumbnailFormatMimeType: 'image/webp' | 'image/jpeg' = 'image/webp'
): Promise<ReturnProps> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', async () => {
            const thumbnailTypesToGenerate: ThumbnailType[] = [ThumbnailType.PREVIEW];

            if (thumbnailTypesToGenerate.length && shouldGenerateHDPreview(file.size, img.width, img.height)) {
                thumbnailTypesToGenerate.push(ThumbnailType.HD_PREVIEW);
            }

            Promise.all(
                thumbnailTypesToGenerate.map((thumbnailType) => scaleImage(img, thumbnailType, thumbnailFormatMimeType))
            )
                .then((thumbnails) => {
                    resolve({ width: img.width, height: img.height, thumbnails });
                })
                .catch(reject);
        });
        // If image fails to be loaded, it doesn't provide any error.
        // We need to provide custom to state clearly what is happening.
        img.addEventListener('error', () => {
            reject(imageCannotBeLoadedError);
        });
        img.src = URL.createObjectURL(file);
    });
}

async function scaleImage(
    img: HTMLImageElement,
    thumbnailType: ThumbnailType = ThumbnailType.PREVIEW,
    mimeType: 'image/webp' | 'image/jpeg' = 'image/webp'
): Promise<ThumbnailInfo> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Null is returned only when using wrong context type.
    if (ctx === null) {
        throw new Error('Context is not available');
    }

    const [width, height] = calculateThumbnailSize(img, thumbnailType);
    canvas.width = width;
    canvas.height = height;

    // Make white background default for transparent images.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return {
        thumbnailType,
        thumbnailData: new Uint8Array(await canvasToThumbnail(canvas, thumbnailType, mimeType)),
    };
}
