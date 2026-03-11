import type { ThumbnailType } from '@protontech/drive-sdk';

export interface ThumbnailErrorOptions {
    context?: Record<string, unknown>;
    cause?: Error;
}

/**
 * Base error class for thumbnail generation errors
 * Carries context information through the thumbnail generation pipeline
 */
export class ThumbnailError extends Error {
    public readonly context: Record<string, unknown>;

    constructor(message: string, options: ThumbnailErrorOptions = {}) {
        super(message, { cause: options.cause });
        this.name = 'ThumbnailError';
        this.context = options.context || {};

        Object.setPrototypeOf(this, ThumbnailError.prototype);
    }

    addContext(key: string, value: unknown): this {
        this.context[key] = value;
        return this;
    }

    withContext(additionalContext: Record<string, unknown>): this {
        Object.assign(this.context, additionalContext);
        return this;
    }
}

/**
 * Error thrown when no handler is available for a file type
 * This is expected and should be logged as info
 */
export class NoHandlerError extends ThumbnailError {
    constructor(mimeType: string) {
        super(`No handler found for file type`, {
            context: { mimeType },
        });
        this.name = 'NoHandlerError';
        Object.setPrototypeOf(this, NoHandlerError.prototype);
    }
}

/**
 * Error thrown when file loading/parsing fails
 */
export class FileLoadError extends ThumbnailError {
    constructor(message: string, options: ThumbnailErrorOptions = {}) {
        super(`Failed to load file: ${message}`, options);
        this.name = 'FileLoadError';
        Object.setPrototypeOf(this, FileLoadError.prototype);
    }
}

/**
 * Error thrown when canvas operations fail
 */
export class CanvasError extends ThumbnailError {
    constructor(message: string, options: ThumbnailErrorOptions = {}) {
        super(`Canvas operation failed: ${message}`, options);
        this.name = 'CanvasError';
        Object.setPrototypeOf(this, CanvasError.prototype);
    }
}

/**
 * Error thrown when thumbnail encoding fails
 */
export class EncodingError extends ThumbnailError {
    constructor(message: string, options: ThumbnailErrorOptions = {}) {
        super(`Thumbnail encoding failed: ${message}`, options);
        this.name = 'EncodingError';
        Object.setPrototypeOf(this, EncodingError.prototype);
    }
}

/**
 * Error thrown when thumbnail is too large
 * This can be expected for certain files
 */
export class ThumbnailSizeError extends ThumbnailError {
    constructor(
        actualSize: number,
        maxSize: number,
        thumbnailType: ThumbnailType,
        context: Record<string, unknown> = {}
    ) {
        super(`Thumbnail exceeds maximum size`, {
            context: {
                actualSize,
                maxSize,
                thumbnailType,
                ...context,
            },
        });
        this.name = 'ThumbnailSizeError';
        Object.setPrototypeOf(this, ThumbnailSizeError.prototype);
    }
}

/**


/**
 * Error thrown when image is corrupted or cannot be decoded
 * This is somewhat expected and should be logged as info
 */
export class CorruptedImageError extends ThumbnailError {
    constructor(options: ThumbnailErrorOptions = {}) {
        super(`Image file is corrupted or cannot be decoded`, options);
        this.name = 'CorruptedImageError';
        Object.setPrototypeOf(this, CorruptedImageError.prototype);
    }
}

/**
 * Error thrown when the browser doesn't support the file format
 * This is expected for certain formats and should be logged as info
 */
export class UnsupportedFormatError extends ThumbnailError {
    constructor(format: string, options: ThumbnailErrorOptions = {}) {
        super(`Format not supported by browser: ${format}`, options);
        this.name = 'UnsupportedFormatError';
        Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
    }
}

/**
 * Error thrown when a file is missing expected data
 * This is expected for certain file types and should be logged as info
 */
export class MissingDataError extends ThumbnailError {
    constructor(description: string, options: ThumbnailErrorOptions = {}) {
        super(`Missing data: ${description}`, options);
        this.name = 'MissingDataError';
        Object.setPrototypeOf(this, MissingDataError.prototype);
    }
}

/**
 * Wraps an unknown error with thumbnail context
 * Preserves the original error as cause for stack trace debugging
 */
export function wrapError(error: unknown, context: Record<string, unknown> = {}): ThumbnailError {
    if (error instanceof ThumbnailError) {
        return error.withContext(context);
    }

    if (error instanceof Error) {
        return new ThumbnailError(error.message, {
            context,
            cause: error,
        });
    }

    return new ThumbnailError(String(error), { context });
}
