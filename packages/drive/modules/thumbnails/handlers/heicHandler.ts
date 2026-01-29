import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isHEIC } from '@proton/shared/lib/helpers/mimetype';

import { UnsupportedFormatError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromFile } from './utils/getImageFromFile';

async function heicToBlob(heicFile: File | Blob): Promise<Blob> {
    const { heicTo } = await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "heic-to-js" */
        'heic-to/csp'
    );

    const image = await heicTo({
        blob: heicFile,
        type: 'image/jpeg',
        quality: 1,
    });
    return image;
}

export class HeicHandler extends BaseHandler {
    readonly handlerName = 'HeicHandler';

    canHandle(mimeType: string): boolean {
        return isHEIC(mimeType);
    }

    async generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        originalMimeType: string,
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        const perf = this.createPerformanceTracker(debug);

        try {
            perf.start('heicConversion');
            const blob = await heicToBlob(content);
            perf.end('heicConversion');

            perf.start('imageDecoding');
            const img = await getImageFromFile(blob);
            perf.end('imageDecoding');

            const thumbnails = await this.generateThumbnailsFromImage({
                fileSize,
                img,
                mimeType,
                thumbnailTypes,
                originalMimeType,
                perf,
            });

            return {
                thumbnails,
                performance: perf.getResults(),
            };
        } catch (error) {
            // HEIC conversion can fail for corrupted files or unsupported HEIC variants
            throw new UnsupportedFormatError('HEIC format', {
                context: {
                    stage: 'HEIC conversion',
                    fileSize: fileSize,
                },
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
}
