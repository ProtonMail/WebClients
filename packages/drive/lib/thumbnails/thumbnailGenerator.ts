import { ThumbnailType } from '@protontech/drive-sdk';
import type { Context } from '@sentry/types';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isIos, isSafari } from '@proton/shared/lib/helpers/browser';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { ThumbnailProcessor } from './handlerRegistry';
import { mimeTypeFromFile } from './mimeTypeParser/mimeTypeParser';
import {
    CorruptedImageError,
    MissingDataError,
    NoHandlerError,
    ThumbnailError,
    ThumbnailSizeError,
    UnsupportedFormatError,
} from './thumbnailError';
import type { ThumbnailResult } from './utils';

const isIosDevice: boolean = isIos();
const isSafariDevice: boolean = isSafari();

let processorInstance: ThumbnailProcessor | null = null;

function getProcessor(): ThumbnailProcessor {
    if (!processorInstance) {
        processorInstance = new ThumbnailProcessor();
    }
    return processorInstance;
}

function reportThumbnailError(thumbnailError: ThumbnailError): void {
    const context: Context = {
        tags: {
            component: 'drive-thumbnail-generator',
            errorType: thumbnailError.name,
        },
        extra: thumbnailError.context,
        level:
            thumbnailError instanceof NoHandlerError ||
            thumbnailError instanceof CorruptedImageError ||
            thumbnailError instanceof ThumbnailSizeError ||
            thumbnailError instanceof UnsupportedFormatError ||
            thumbnailError instanceof MissingDataError
                ? 'info'
                : 'error',
    };

    traceError(thumbnailError, context);
}

async function processThumbnail(
    content: Blob,
    fileName: string,
    fileSize: number,
    thumbnailMimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
    thumbnailTypes: ThumbnailType[],
    debug: boolean,
    mimeTypePromise: Promise<string>
): Promise<{ ok: true; result: ThumbnailResult } | { ok: false; error: unknown }> {
    const startTime = debug ? performance.now() : 0;
    const processor = getProcessor();

    try {
        const detectedMimeType = await mimeTypePromise;

        const result = await processor.process(
            content,
            fileName,
            fileSize,
            thumbnailMimeType,
            thumbnailTypes,
            debug,
            detectedMimeType
        );

        if (debug) {
            const totalTime = performance.now() - startTime;
            // eslint-disable-next-line no-console
            console.debug('[ThumbnailGenerator] Generated thumbnail', {
                fileName,
                fileSize,
                detectedMimeType: result.generationInfo.detectedMimeType,
                handler: result.generationInfo.handler,
                thumbnailMimeType,
                thumbnailTypes,
                thumbnailCount: result.thumbnails?.thumbnails?.length || 0,
                performance: {
                    totalTime: `${totalTime.toFixed(2)}ms`,
                    ...result.performance,
                },
            });
        }

        return { ok: true, result: result.thumbnails };
    } catch (error) {
        if (debug) {
            // eslint-disable-next-line no-console
            console.debug('[ThumbnailGenerator] Failed to generate thumbnail', {
                fileName,
                fileSize,
                error,
            });
        }

        if (error instanceof ThumbnailError) {
            reportThumbnailError(error);
        } else {
            traceError(error, { tags: { component: 'drive-thumbnail-generator' } });
        }
        return { ok: false, error };
    }
}

export function generateThumbnail(
    content: Blob,
    fileName: string,
    fileSize: number,
    options: {
        debug?: boolean;
    } = {}
): {
    mimeTypePromise: Promise<string>;
    resultPromise: Promise<{ ok: true; result: ThumbnailResult } | { ok: false; error: unknown }>;
} {
    const thumbnailMimeType = isIosDevice || isSafariDevice ? SupportedMimeTypes.jpg : SupportedMimeTypes.webp;
    const thumbnailTypes = [ThumbnailType.Type1, ThumbnailType.Type2];

    const mimeTypePromise = mimeTypeFromFile({ type: content.type, name: fileName });

    const resultPromise = processThumbnail(
        content,
        fileName,
        fileSize,
        thumbnailMimeType,
        thumbnailTypes,
        options.debug || false,
        mimeTypePromise
    );

    return { mimeTypePromise, resultPromise };
}
