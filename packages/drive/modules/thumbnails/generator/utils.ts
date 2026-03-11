import { ThumbnailType } from '@protontech/drive-sdk';

import {
    HD_THUMBNAIL_MAX_SIDE,
    HD_THUMBNAIL_MAX_SIZE,
    SupportedMimeTypes,
    THUMBNAIL_MAX_SIDE,
    THUMBNAIL_MAX_SIZE,
    THUMBNAIL_QUALITIES,
} from '@proton/shared/lib/drive/constants';

import type { PerformanceTracker } from './performanceTracker';
import { CanvasError, EncodingError, ThumbnailSizeError, wrapError } from './thumbnailError';

export interface ThumbnailInfo {
    thumbnail: Uint8Array<ArrayBuffer>;
    type: ThumbnailType;
}

export type ThumbnailResult =
    | {
          width?: number;
          height?: number;
          duration?: number;
          thumbnails?: ThumbnailInfo[];
      }
    | undefined;

export function calculateThumbnailSize(
    img: { width: number; height: number },
    thumbnailType: ThumbnailType = ThumbnailType.Type1
): [width: number, height: number] {
    const ratio = Math.min(
        1,
        thumbnailType === ThumbnailType.Type2
            ? HD_THUMBNAIL_MAX_SIDE / Math.max(img.width, img.height)
            : THUMBNAIL_MAX_SIDE / Math.max(img.width, img.height)
    );
    return [Math.ceil(ratio * img.width), Math.ceil(ratio * img.height)];
}

export const getLongestEdge = (width: number, height: number) => (width > height ? width : height);

export function shouldGenerateHDPreview(
    size: number,
    width: number,
    height: number,
    originalMimeType: string
): boolean {
    const edge = getLongestEdge(width, height);
    const isLargeImage = edge > HD_THUMBNAIL_MAX_SIDE;
    // Always force Type2 (HD) thumbnail generation in case it's not jpg/webp
    // https://drive.gitlab-pages.protontech.ch/documentation/specifications/data/thumbnails/#type-2-hd-photo
    const isJpegOrWebp = originalMimeType === SupportedMimeTypes.jpg || originalMimeType === SupportedMimeTypes.webp;

    return isLargeImage || !isJpegOrWebp;
}

export function getMaxThumbnailSize(thumbnailType: ThumbnailType): number {
    return thumbnailType === ThumbnailType.Type2 ? HD_THUMBNAIL_MAX_SIZE * 0.9 : THUMBNAIL_MAX_SIZE * 0.9;
}

export async function optimizeCanvasForThumbnail(
    canvas: HTMLCanvasElement,
    thumbnailType: ThumbnailType = ThumbnailType.Type1,
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg = SupportedMimeTypes.webp
): Promise<ArrayBuffer> {
    const maxSize = getMaxThumbnailSize(thumbnailType);
    let lastSize = 0;

    for (const quality of THUMBNAIL_QUALITIES) {
        try {
            const data = await canvasToArrayBuffer(canvas, mimeType, quality);
            lastSize = data.byteLength;
            if (data.byteLength < maxSize) {
                return data;
            }
        } catch (error) {
            throw wrapError(error, {
                stage: 'optimizeCanvas',
                thumbnailType,
                thumbnailMimeType: mimeType,
                quality,
                maxSize,
            });
        }
    }

    throw new ThumbnailSizeError(lastSize, maxSize, thumbnailType, {
        canvasSize: { width: canvas.width, height: canvas.height },
        thumbnailMimeType: mimeType,
        qualitiesAttempted: THUMBNAIL_QUALITIES.length,
    });
}

function canvasToArrayBuffer(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (d) => {
                if (!d) {
                    reject(
                        new EncodingError('Canvas toBlob returned null', {
                            context: {
                                thumbnailMimeType: mimeType,
                                quality,
                                canvasSize: { width: canvas.width, height: canvas.height },
                            },
                        })
                    );
                    return;
                }
                const r = new FileReader();
                r.addEventListener('load', () => {
                    resolve(r.result as ArrayBuffer);
                });
                r.addEventListener('error', (error) => {
                    reject(
                        new EncodingError('FileReader failed', {
                            context: {
                                thumbnailMimeType: mimeType,
                                quality,
                                error: error.toString(),
                            },
                        })
                    );
                });
                r.readAsArrayBuffer(d);
            },
            mimeType,
            quality
        );
    });
}

export async function scaleImage(
    img: HTMLImageElement,
    thumbnailType: ThumbnailType,
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
    options?: { perf?: PerformanceTracker }
): Promise<ThumbnailInfo> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
        throw new CanvasError('Canvas 2D context is not available', {
            context: {
                thumbnailType,
                mimeType,
                imageSize: { width: img.width, height: img.height },
            },
        });
    }

    return generateThumbnailFromCanvas({
        canvas,
        ctx,
        img: { width: img.width, height: img.height },
        thumbnailType,
        mimeType,
        drawImage: () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height),
        perf: options?.perf,
    });
}

export async function generateThumbnailFromCanvas(options: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    img: { width: number; height: number };
    thumbnailType: ThumbnailType;
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg;
    drawImage: () => void;
    perf?: PerformanceTracker;
}): Promise<ThumbnailInfo> {
    const { canvas, ctx, img, thumbnailType, mimeType, drawImage, perf } = options;
    const [width, height] = calculateThumbnailSize(img, thumbnailType);

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    try {
        try {
            perf?.start('canvasDraw');
            drawImage();
            perf?.end('canvasDraw');
        } catch (error) {
            throw new CanvasError('Failed to draw image on canvas', {
                context: {
                    thumbnailType,
                    thumbnailMimeType: mimeType,
                    canvasSize: { width, height },
                    imageSize: img,
                },
                cause: error instanceof Error ? error : undefined,
            });
        }

        let arrayBuffer: ArrayBuffer;
        try {
            perf?.start('canvasEncode');
            arrayBuffer = await optimizeCanvasForThumbnail(canvas, thumbnailType, mimeType);
            perf?.end('canvasEncode');
        } catch (error) {
            // Retry with reduced dimensions (70% of original)
            const retryWidth = Math.floor(width * 0.7);
            const retryHeight = Math.floor(height * 0.7);

            try {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = retryWidth;
                canvas.height = retryHeight;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawImage();
                perf?.start('canvasEncode');
                arrayBuffer = await optimizeCanvasForThumbnail(canvas, thumbnailType, mimeType);
                perf?.end('canvasEncode');
            } catch (retryError) {
                throw wrapError(retryError, {
                    stage: 'thumbnail generation with retry',
                    originalSize: { width, height },
                    retrySize: { width: retryWidth, height: retryHeight },
                    firstAttemptError: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return {
            type: thumbnailType,
            thumbnail: new Uint8Array<ArrayBuffer>(arrayBuffer),
        };
    } finally {
        canvas.width = 0;
        canvas.height = 0;
    }
}
