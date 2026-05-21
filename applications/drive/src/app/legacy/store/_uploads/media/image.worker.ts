import * as Comlink from 'comlink';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { canvasToThumbnail } from './canvasUtil';
import type { ThumbnailInfo, ThumbnailType } from './interface';
import { calculateThumbnailSize } from './util';

export interface WorkerThumbnailRequest {
    imageBitmap: ImageBitmap;
    width: number;
    height: number;
    thumbnailTypes: ThumbnailType[];
    mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg;
}

export class ThumbnailWorker {
    async processThumbnails(request: WorkerThumbnailRequest): Promise<ThumbnailInfo[]> {
        const { imageBitmap, width, height, thumbnailTypes, mimeType } = request;
        const results: ThumbnailInfo[] = [];

        try {
            for (const thumbnailType of thumbnailTypes) {
                const thumbnail = await this.createThumbnail(imageBitmap, width, height, thumbnailType, mimeType);
                results.push(thumbnail);
            }

            return results;
        } catch (error) {
            throw error;
        } finally {
            imageBitmap.close();
        }
    }

    private async createThumbnail(
        imageBitmap: ImageBitmap,
        originalWidth: number,
        originalHeight: number,
        thumbnailType: ThumbnailType,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg
    ): Promise<ThumbnailInfo> {
        if (typeof OffscreenCanvas === 'undefined') {
            throw new Error('OffscreenCanvas is not available in this worker environment');
        }

        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Context is not available');
        }

        const [width, height] = calculateThumbnailSize({ width: originalWidth, height: originalHeight }, thumbnailType);

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        try {
            ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

            let arrayBuffer: ArrayBuffer;
            try {
                arrayBuffer = await canvasToThumbnail(canvas, thumbnailType, mimeType);
            } catch (error) {
                // Retry with reduced thumbnail dimensions (70% of what it should be) one last time
                // In case we still have a chance to have a smaller thumbnail
                // It's better than no thumbnails at all
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = width * 0.7;
                canvas.height = height * 0.7;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
                arrayBuffer = await canvasToThumbnail(canvas, thumbnailType, mimeType);
            }
            return {
                thumbnailType,
                thumbnailData: new Uint8Array(arrayBuffer),
            };
        } finally {
            // OffscreenCanvas doesn't need explicit cleanup like regular canvas
            // imageBitmap cleanup is handled in processThumbnails
        }
    }
}

const thumbnailWorker = new ThumbnailWorker();
Comlink.expose(thumbnailWorker);
