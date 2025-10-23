import type { ThumbnailType } from '@protontech/drive-sdk';

import { type RawProcessorWorkerInterface, createWorker } from '@proton/raw-images/src';
import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import {
    getFileExtension,
    isRAWExtension,
    isRAWPhoto,
    isRAWThumbnailExtractionSupported,
} from '@proton/shared/lib/helpers/mimetype';

import { MissingDataError, ThumbnailError, UnsupportedFormatError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromFile } from './utils/getImageFromFile';

export class RawImageHandler extends BaseHandler {
    readonly handlerName = 'RawImageHandler';

    canHandle(mimeType: string, name: string): boolean {
        const extension = getFileExtension(name);
        return (
            (isRAWPhoto(mimeType) || isRAWExtension(extension)) &&
            isRAWThumbnailExtractionSupported(mimeType, extension)
        );
    }

    async generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        const perf = this.createPerformanceTracker(debug);
        let processor: RawProcessorWorkerInterface | undefined;

        try {
            perf.start('fileLoading');
            const buffer = await content.arrayBuffer();
            const data = new Uint8Array(buffer);
            perf.end('fileLoading');

            perf.start('workerInitialization');
            processor = await createWorker(data, fileName);
            await processor.initialize();
            perf.end('workerInitialization');

            perf.start('thumbnailExtraction');
            const result = await processor.extractThumbnail(data, fileName);
            perf.end('thumbnailExtraction');

            if (!result) {
                // Some RAW files don't have embedded thumbnails
                throw new MissingDataError('RAW embedded thumbnail', {
                    context: {
                        stage: 'RAW thumbnail extraction',
                    },
                });
            }

            perf.start('imageDecoding');
            const blob = new Blob([result], { type: 'image/jpeg' });
            const img = await getImageFromFile(blob);
            perf.end('imageDecoding');

            const thumbnails = await this.generateThumbnailsFromImage(fileSize, img, {
                mimeType,
                thumbnailTypes,
                perf,
            });

            return {
                thumbnails,
                performance: perf.getResults(),
            };
        } catch (error) {
            if (error instanceof ThumbnailError) {
                throw error;
            }

            // RAW processing can fail for unsupported RAW variants or corrupted files
            throw new UnsupportedFormatError('RAW image format', {
                context: {
                    stage: 'RAW image processing',
                },
                cause: error instanceof Error ? error : undefined,
            });
        } finally {
            if (processor) {
                processor.terminate();
            }
        }
    }
}
