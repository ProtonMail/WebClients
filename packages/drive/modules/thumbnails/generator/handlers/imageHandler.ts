import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isNativeSupportedImage } from '@proton/shared/lib/helpers/mimetype';

import { MAX_IMAGE_SIZE_FOR_THUMBNAIL } from '../constants';
import { FileLoadError, FileTooLargeError, ThumbnailError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromFile } from './utils/getImageFromFile';

export class ImageHandler extends BaseHandler {
    readonly handlerName = 'ImageHandler';

    canHandle(mimeType: string): boolean {
        return isNativeSupportedImage(mimeType);
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
        if (fileSize > MAX_IMAGE_SIZE_FOR_THUMBNAIL) {
            throw new FileTooLargeError('large image', {
                context: {
                    stage: 'image size check',
                    mimeType: content.type,
                },
            });
        }

        const perf = this.createPerformanceTracker(debug);

        try {
            perf.start('imageDecoding');
            const img = await getImageFromFile(content);
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
            if (error instanceof ThumbnailError) {
                throw error;
            }
            throw new FileLoadError('Failed to process image file', {
                context: {
                    stage: 'image processing',
                },
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
}
