import * as Comlink from 'comlink';

import { HD_THUMBNAIL_MAX_SIDE, HD_THUMBNAIL_MAX_SIZE, SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { sendErrorReport } from '../../../utils/errorHandling';
import { canvasToThumbnail } from './canvasUtil';
import type { ThumbnailWorker, WorkerThumbnailRequest } from './image.worker';
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

const isOffscreenCanvasSupported = (): boolean => {
    return typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined';
};

async function createOptimizedImageBitmap(img: HTMLImageElement): Promise<ImageBitmap> {
    if (getLongestEdge(img.width, img.height) <= HD_THUMBNAIL_MAX_SIDE) {
        return createImageBitmap(img);
    }
    // For iamge larger than > HD_THUMBNAIL_MAX_SIDE, create a pre-scaled version
    // Scale down to maximum HD_THUMBNAIL_MAX_SIZE x HD_THUMBNAIL_MAX_SIZE while maintaining aspect ratio
    // It's better performance than painting the canvas and then afterwards resizing
    const aspectRatio = img.width / img.height;

    let scaledWidth: number;
    let scaledHeight: number;

    if (img.width > img.height) {
        scaledWidth = Math.min(img.width, HD_THUMBNAIL_MAX_SIDE);
        scaledHeight = scaledWidth / aspectRatio;
    } else {
        scaledHeight = Math.min(img.height, HD_THUMBNAIL_MAX_SIDE);
        scaledWidth = scaledHeight * aspectRatio;
    }

    return createImageBitmap(img, {
        resizeWidth: Math.floor(scaledWidth),
        resizeHeight: Math.floor(scaledHeight),
        resizeQuality: 'medium',
    });
}

async function processWithWebWorker(
    img: HTMLImageElement,
    thumbnailTypes: ThumbnailType[],
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg
): Promise<ThumbnailInfo[]> {
    const worker = new Worker(
        /* webpackChunkName: "drive-image-worker" */
        new URL('./image.worker', import.meta.url)
    );
    try {
        const workerApi = Comlink.wrap<ThumbnailWorker>(worker);

        const imageBitmap = await createOptimizedImageBitmap(img);

        const actualWidth = imageBitmap.width;
        const actualHeight = imageBitmap.height;

        const request: WorkerThumbnailRequest = {
            imageBitmap,
            width: actualWidth,
            height: actualHeight,
            thumbnailTypes,
            mimeType,
        };

        const thumbnails = await workerApi.processThumbnails(Comlink.transfer(request, [imageBitmap]));
        return thumbnails;
    } catch (error) {
        sendErrorReport(error);
        // Fallback to main thread processing
        return await Promise.all(thumbnailTypes.map((thumbnailType) => scaleImage(img, thumbnailType, mimeType)));
    } finally {
        worker.terminate();
    }
}

export function scaleImageFile(
    {
        file,
    }: {
        file: Blob;
    },
    thumbnailFormatMimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg = SupportedMimeTypes.webp
): Promise<ReturnProps> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.addEventListener('load', async () => {
            const thumbnailTypesToGenerate: ThumbnailType[] = [ThumbnailType.PREVIEW];

            if (thumbnailTypesToGenerate.length && shouldGenerateHDPreview(file.size, img.width, img.height)) {
                thumbnailTypesToGenerate.push(ThumbnailType.HD_PREVIEW);
            }

            try {
                let thumbnails: ThumbnailInfo[];

                if (isOffscreenCanvasSupported()) {
                    thumbnails = await processWithWebWorker(img, thumbnailTypesToGenerate, thumbnailFormatMimeType);
                } else {
                    // Fallback to main thread processing
                    thumbnails = await Promise.all(
                        thumbnailTypesToGenerate.map((thumbnailType) =>
                            scaleImage(img, thumbnailType, thumbnailFormatMimeType)
                        )
                    );
                }

                resolve({ width: img.width, height: img.height, thumbnails });
            } catch (error) {
                reject(error);
            }
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
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg = SupportedMimeTypes.webp
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

    let arrayBuffer: ArrayBuffer;
    try {
        arrayBuffer = await canvasToThumbnail(canvas, thumbnailType, mimeType);
    } catch {
        // Retry with a reduce thumbnail dimensions (70% of what it should be) one last time
        // In case we still have a chance to have a smaller thumbnail
        // It's better than no thumbnails at all
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = width * 0.7;
        canvas.height = height * 0.7;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        arrayBuffer = await canvasToThumbnail(canvas, thumbnailType, mimeType);
    } finally {
        // Cleanup
        canvas.width = canvas.height = 0;
        if ('remove' in canvas && canvas.parentNode) {
            canvas.remove();
        }
    }

    return {
        thumbnailType,
        thumbnailData: new Uint8Array(arrayBuffer),
    };
}
