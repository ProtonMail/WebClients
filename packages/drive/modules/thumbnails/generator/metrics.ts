import metrics from '@proton/metrics';
import type { HttpsProtonMeDriveThumbnailErrorsTotalV1SchemaJson } from '@proton/metrics/types/drive_thumbnail_errors_total_v1.schema';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { NoHandlerError, ThumbnailError, wrapError } from './thumbnailError';

type ThumbnailErrorMetricLabels = HttpsProtonMeDriveThumbnailErrorsTotalV1SchemaJson['Labels'];
type ThumbnailHandler = ThumbnailErrorMetricLabels['handler'];

const ERROR_NAME_TO_METRIC_TYPE: Record<string, ThumbnailErrorMetricLabels['errorType']> = {
    UnsupportedFormatError: 'unsupported_format',
    CorruptedImageError: 'corrupted',
    MissingDataError: 'missing_data',
    ThumbnailSizeError: 'thumbnail_size',
    ThumbnailTimeoutError: 'timeout',
    CanvasError: 'canvas',
    EncodingError: 'encoding',
    FileLoadError: 'file_load',
};

const HANDLER_NAME_TO_LABEL: Record<string, ThumbnailHandler> = {
    ImageHandler: 'image',
    HeicHandler: 'heic',
    RawImageHandler: 'raw',
    SVGHandler: 'svg',
    VideoHandler: 'video',
    CbzHandler: 'cbz',
};

export function reportThumbnailSuccess(handlerName: string): void {
    const handler = HANDLER_NAME_TO_LABEL[handlerName];
    if (handler) {
        metrics.drive_thumbnail_success_rate_total.increment({ handler, status: 'success' });
    }
}

// Not an error: the file's format is simply one we don't attempt thumbnails for.
function reportNoHandler(noHandlerError: NoHandlerError): void {
    metrics.drive_thumbnail_no_handler_total.increment({});

    const mimeType = noHandlerError.context.mimeType;
    traceError(noHandlerError, {
        level: 'debug',
        tags: {
            component: 'drive-thumbnail-generator',
            ...(typeof mimeType === 'string' && { mimeType }),
        },
        extra: noHandlerError.context,
    });
}

function reportGenerationError(thumbnailError: ThumbnailError): void {
    const errorType = ERROR_NAME_TO_METRIC_TYPE[thumbnailError.name] || 'other';

    // The handler is only missing here if an error happened before one could be
    // selected (e.g. MIME type detection failing), which is unexpected and always
    // classified as "other" above.
    const contextHandler = thumbnailError.context.handler;
    const handler = typeof contextHandler === 'string' ? HANDLER_NAME_TO_LABEL[contextHandler] : undefined;

    if (handler) {
        metrics.drive_thumbnail_errors_total.increment({ handler, errorType });
        metrics.drive_thumbnail_success_rate_total.increment({ handler, status: 'failed' });
    }

    const mimeType = thumbnailError.context.inputMimeType;

    // The metric only carries the coarse handler/errorType buckets; Sentry keeps the
    // per-file detail (exact MIME type, message) needed to spot trends, e.g. which
    // unsupported formats are most common or why HEIC failures stay high. handler/errorType/
    // mimeType are tagged (not just put in extra) so they're filterable/groupable in Sentry's
    // search and exportable from there. Reported at "debug" level so it doesn't page anyone,
    // since the metric already covers alerting.
    traceError(thumbnailError, {
        level: 'debug',
        tags: {
            component: 'drive-thumbnail-generator',
            handler: handler || 'unknown',
            errorType,
            ...(typeof mimeType === 'string' && { mimeType }),
        },
        extra: thumbnailError.context,
    });
}

export function reportThumbnailError(error: unknown): void {
    const thumbnailError = error instanceof ThumbnailError ? error : wrapError(error);
    if (thumbnailError instanceof NoHandlerError) {
        reportNoHandler(thumbnailError);
    } else {
        reportGenerationError(thumbnailError);
    }
}
