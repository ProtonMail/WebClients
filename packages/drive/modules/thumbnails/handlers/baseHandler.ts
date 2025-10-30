import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { PerformanceTracker } from '../performanceTracker';
import { type ThumbnailInfo, type ThumbnailResult, getThumbnailTypesToGenerate, scaleImage } from '../utils';
import type { GenericHandler, HandlerOptions, ThumbnailGenerationResult } from './interfaces';

export abstract class BaseHandler implements GenericHandler {
    abstract readonly handlerName: string;

    abstract canHandle(mimeType: string, name: string): boolean;

    protected createPerformanceTracker(debug: boolean): PerformanceTracker {
        return new PerformanceTracker(debug);
    }

    protected async generateThumbnailsFromImage(
        fileSize: number,
        img: HTMLImageElement,
        options: {
            mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg;
            thumbnailTypes: ThumbnailType[];
            customDimensions?: { width: number; height: number };
            duration?: number;
            perf?: PerformanceTracker;
        }
    ): Promise<ThumbnailResult> {
        const { mimeType, thumbnailTypes, customDimensions, duration, perf } = options;

        try {
            const dimensions = customDimensions || { width: img.width, height: img.height };
            const allThumbnailTypes = getThumbnailTypesToGenerate(fileSize, dimensions.width, dimensions.height);
            const thumbnailTypesToGenerate = thumbnailTypes
                ? allThumbnailTypes.filter((type) => thumbnailTypes.includes(type))
                : allThumbnailTypes;

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
        debug?: boolean,
        options?: HandlerOptions
    ): Promise<ThumbnailGenerationResult>;
}
