import { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { PerformanceTracker } from '../performanceTracker';
import { type ThumbnailInfo, type ThumbnailResult, scaleImage, shouldGenerateHDPreview } from '../utils';
import type { GenericHandler, HandlerOptions, ThumbnailGenerationResult } from './interfaces';

export abstract class BaseHandler implements GenericHandler {
    abstract readonly handlerName: string;

    abstract canHandle(mimeType: string, name: string): boolean;

    protected createPerformanceTracker(debug: boolean): PerformanceTracker {
        return new PerformanceTracker(debug);
    }

    protected async generateThumbnailsFromImage(options: {
        fileSize: number;
        img: HTMLImageElement;
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg;
        thumbnailTypes: ThumbnailType[];
        originalMimeType: string;
        customDimensions?: { width: number; height: number };
        duration?: number;
        perf?: PerformanceTracker;
    }): Promise<ThumbnailResult> {
        const { fileSize, img, mimeType, thumbnailTypes, originalMimeType, customDimensions, duration, perf } = options;

        try {
            const dimensions = customDimensions || { width: img.width, height: img.height };
            const thumbnailTypesToGenerate = thumbnailTypes.filter(
                (thumbnailType) =>
                    thumbnailType !== ThumbnailType.Type2 ||
                    shouldGenerateHDPreview(fileSize, dimensions.width, dimensions.height, originalMimeType)
            );

            const thumbnails: ThumbnailInfo[] = [];

            for (const thumbnailType of thumbnailTypesToGenerate) {
                const additionalThumbnail = await scaleImage(img, thumbnailType, mimeType, { perf });
                thumbnails.push(additionalThumbnail);
            }

            return {
                width: dimensions.width,
                height: dimensions.height,
                duration,
                thumbnails,
            };
        } finally {
            URL.revokeObjectURL(img.src);
        }
    }

    abstract generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        originalMimeType: string,
        debug?: boolean,
        options?: HandlerOptions
    ): Promise<ThumbnailGenerationResult>;
}
