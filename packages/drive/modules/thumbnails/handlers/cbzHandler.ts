import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isCompatibleCBZ } from '@proton/shared/lib/helpers/mimetype';

import { MAX_MEDIA_SIZE_FOR_THUMBNAIL_IOS, isIosDevice } from '../constants';
import { MissingDataError, ThumbnailError, UnsupportedFormatError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromFile } from './utils/getImageFromFile';

export class CbzHandler extends BaseHandler {
    readonly handlerName = 'CbzHandler';

    canHandle(mimeType: string, name: string): boolean {
        return isCompatibleCBZ(mimeType, name);
    }

    async generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        if (isIosDevice && fileSize > MAX_MEDIA_SIZE_FOR_THUMBNAIL_IOS) {
            throw new UnsupportedFormatError('large CBZ on iOS Safari', {
                context: {
                    stage: 'CBZ size check',
                    fileSize: fileSize,
                    mimeType: content.type,
                },
            });
        }

        const perf = this.createPerformanceTracker(debug);

        try {
            perf.start('cbzCoverExtraction');
            const { getCBZCover } = await import('@proton/components/containers/filePreview/ComicBookPreview');
            // getCBZCover expects a File, so create a File from the Blob
            const file = new File([content], fileName, { type: content.type });
            const { cover, file: coverFile } = await getCBZCover(file);
            perf.end('cbzCoverExtraction');

            if (!cover || !coverFile) {
                // Some CBZ files don't have cover images
                throw new MissingDataError('CBZ cover image', {
                    context: {
                        stage: 'CBZ cover extraction',
                    },
                });
            }

            perf.start('imageDecoding');
            const img = await getImageFromFile(coverFile);
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
            // CBZ processing can fail if archive is corrupted or format is unsupported
            throw new UnsupportedFormatError('CBZ archive', {
                context: {
                    stage: 'CBZ processing',
                },
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
}
