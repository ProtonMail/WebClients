import type { ThumbnailType } from '@protontech/drive-sdk';

import type { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { CbzHandler } from './handlers/cbzHandler';
import { HeicHandler } from './handlers/heicHandler';
import { ImageHandler } from './handlers/imageHandler';
import type { GenericHandler } from './handlers/interfaces';
import { RawImageHandler } from './handlers/rawImageHandler';
import { SVGHandler } from './handlers/svgHandler';
import { VideoHandler } from './handlers/videoHandler';
import { mimeTypeFromFile } from './mimeTypeParser/mimeTypeParser';
import { NoHandlerError, wrapError } from './thumbnailError';
import type { ThumbnailResult } from './utils';

export class HandlerRegistry {
    private handlers: GenericHandler[] = [];

    constructor() {
        this.registerDefaultHandlers();
    }

    private registerDefaultHandlers(): void {
        this.handlers.push(
            new VideoHandler(),
            new SVGHandler(),
            new HeicHandler(),
            new RawImageHandler(),
            new CbzHandler(),
            new ImageHandler()
        );
    }

    registerHandler(handler: GenericHandler): void {
        this.handlers.push(handler);
    }

    async findHandler(fileName: string, blobType: string, detectedMimeType?: string): Promise<GenericHandler | null> {
        try {
            const mimeType = detectedMimeType || (await mimeTypeFromFile({ name: fileName, type: blobType }));

            for (const handler of this.handlers) {
                if (handler.canHandle(mimeType, fileName)) {
                    return handler;
                }
            }

            return null;
        } catch (error) {
            throw wrapError(error, {
                context: {
                    stage: 'find file handler',
                },
            });
        }
    }

    getHandlers(): readonly GenericHandler[] {
        return this.handlers;
    }
}

export class ThumbnailProcessor {
    private registry: HandlerRegistry;

    constructor(registry?: HandlerRegistry) {
        this.registry = registry || new HandlerRegistry();
    }

    async process(
        content: Blob,
        fileName: string,
        fileSize: number,
        thumbnailMimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        debug: boolean = false,
        detectedMimeType: string
    ): Promise<{
        thumbnails: ThumbnailResult;
        generationInfo: { detectedMimeType: string; handler: string };
        performance?: Record<string, string>;
    }> {
        const handler = await this.registry.findHandler(fileName, content.type, detectedMimeType);

        if (!handler) {
            throw new NoHandlerError(detectedMimeType).withContext({
                fileSize,
                thumbnailMimeType,
                thumbnailTypes,
            });
        }

        try {
            const thumbnailResult = await handler.generate(
                content,
                fileName,
                fileSize,
                thumbnailMimeType,
                thumbnailTypes,
                debug
            );

            return {
                thumbnails: thumbnailResult.thumbnails,
                generationInfo: {
                    detectedMimeType,
                    handler: handler.handlerName,
                },
                ...(debug &&
                    thumbnailResult.performance && {
                        performance: thumbnailResult.performance,
                    }),
            };
        } catch (error) {
            throw wrapError(error, {
                handler: handler.handlerName,
                inputMimeType: detectedMimeType,
                fileSize,
                thumbnailMimeType,
                thumbnailTypes,
            });
        }
    }

    getRegistry(): HandlerRegistry {
        return this.registry;
    }
}
