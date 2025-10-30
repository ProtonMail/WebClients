import { ThumbnailType } from '@protontech/drive-sdk';

import {
    CanvasError,
    CorruptedImageError,
    FileLoadError,
    MissingDataError,
    NoHandlerError,
    ThumbnailError,
    ThumbnailSizeError,
    UnsupportedFormatError,
    wrapError,
} from './thumbnailError';

describe('ThumbnailError', () => {
    test('Creates error with message and empty context', () => {
        const error = new ThumbnailError('test error');

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error.message).toBe('test error');
        expect(error.name).toBe('ThumbnailError');
        expect(error.context).toEqual({});
        expect(error.cause).toBeUndefined();
    });

    test('Creates error with context and cause', () => {
        const causeError = new Error('original');
        const error = new ThumbnailError('test error', {
            context: { stage: 'processing' },
            cause: causeError,
        });

        expect(error.context).toEqual({ stage: 'processing' });
        expect(error.cause).toBe(causeError);
    });

    test('Adds context with addContext and withContext', () => {
        const error = new ThumbnailError('test');
        error.addContext('key1', 'value1');
        error.withContext({ key2: 'value2' });

        expect(error.context).toEqual({ key1: 'value1', key2: 'value2' });
    });
});

describe('Specialized error types', () => {
    test('NoHandlerError is instance of ThumbnailError', () => {
        const error = new NoHandlerError('image/unknown');

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(NoHandlerError);
        expect(error.name).toBe('NoHandlerError');
        expect(error.context.mimeType).toBe('image/unknown');
    });

    test('FileLoadError is instance of ThumbnailError', () => {
        const error = new FileLoadError('corrupted');

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(FileLoadError);
        expect(error.name).toBe('FileLoadError');
        expect(error.message).toContain('corrupted');
    });

    test('CanvasError is instance of ThumbnailError', () => {
        const error = new CanvasError('context failed');

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(CanvasError);
        expect(error.name).toBe('CanvasError');
        expect(error.message).toContain('context failed');
    });

    test('ThumbnailSizeError is instance of ThumbnailError', () => {
        const error = new ThumbnailSizeError(500000, 200000, ThumbnailType.Type1);

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(ThumbnailSizeError);
        expect(error.name).toBe('ThumbnailSizeError');
        expect(error.context.actualSize).toBe(500000);
        expect(error.context.maxSize).toBe(200000);
        expect(error.context.thumbnailType).toBe(ThumbnailType.Type1);
    });

    test('CorruptedImageError is instance of ThumbnailError', () => {
        const error = new CorruptedImageError({ context: { file: 'test.jpg' } });

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(CorruptedImageError);
        expect(error.name).toBe('CorruptedImageError');
        expect(error.message).toContain('corrupted');
        expect(error.context.file).toBe('test.jpg');
    });

    test('UnsupportedFormatError is instance of ThumbnailError', () => {
        const error = new UnsupportedFormatError('video codec', { context: { mimeType: 'video/unknown' } });

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(UnsupportedFormatError);
        expect(error.name).toBe('UnsupportedFormatError');
        expect(error.message).toContain('video codec');
        expect(error.context.mimeType).toBe('video/unknown');
    });

    test('MissingDataError is instance of ThumbnailError', () => {
        const error = new MissingDataError('CBZ cover image', { context: { fileName: 'comic.cbz' } });

        expect(error).toBeInstanceOf(ThumbnailError);
        expect(error).toBeInstanceOf(MissingDataError);
        expect(error.name).toBe('MissingDataError');
        expect(error.message).toContain('CBZ cover image');
        expect(error.context.fileName).toBe('comic.cbz');
    });
});

describe('wrapError', () => {
    test('Wraps ThumbnailError with additional context', () => {
        const original = new ThumbnailError('original');
        const wrapped = wrapError(original, { additional: 'context' });

        expect(wrapped).toBe(original);
        expect(wrapped).toBeInstanceOf(ThumbnailError);
        expect(wrapped.context.additional).toBe('context');
    });

    test('Wraps standard Error as ThumbnailError', () => {
        const original = new Error('standard error');
        const wrapped = wrapError(original, { stage: 'processing' });

        expect(wrapped).toBeInstanceOf(ThumbnailError);
        expect(wrapped.message).toBe('standard error');
        expect(wrapped.cause).toBe(original);
        expect(wrapped.context.stage).toBe('processing');
    });

    test('Wraps non-Error values as ThumbnailError', () => {
        const wrapped = wrapError('string error', { stage: 'test' });

        expect(wrapped).toBeInstanceOf(ThumbnailError);
        expect(wrapped.message).toBe('string error');
        expect(wrapped.context.stage).toBe('test');
    });
});
