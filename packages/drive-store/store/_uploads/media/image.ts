import { HD_THUMBNAIL_MAX_SIDE, SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { canvasToThumbnail } from './canvasUtil';
import { ThumbnailInfo, ThumbnailType } from './interface';
import { calculateThumbnailSize } from './util';

export const imageCannotBeLoadedError = new Error('Image cannot be loaded');

interface ReturnProps {
    width?: number;
    height?: number;
    thumbnails?: ThumbnailInfo[];
}

const shouldGenerateHDPreview = ({ width, mimeType }: { width: number; mimeType: string }) =>
    mimeType == SupportedMimeTypes.jpg && width && width <= HD_THUMBNAIL_MAX_SIDE;

export function scaleImageFile({
    file,
    mimeType,
    thumbnailTypes = [ThumbnailType.PREVIEW],
}: {
    file: Blob;
    mimeType: string;
    thumbnailTypes?: ThumbnailType[];
}): Promise<ReturnProps> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', async () => {
            const thumbnailTypesToGenerate = shouldGenerateHDPreview({ width: img.width, mimeType })
                ? [ThumbnailType.PREVIEW]
                : thumbnailTypes;

            Promise.all(thumbnailTypesToGenerate.map((thumbnailType) => scaleImage(img, thumbnailType)))
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
    thumbnailType: ThumbnailType = ThumbnailType.PREVIEW
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
        thumbnailData: new Uint8Array(await canvasToThumbnail(canvas, thumbnailType)),
    };
}
