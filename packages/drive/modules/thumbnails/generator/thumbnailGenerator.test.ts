import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { CanvasError, NoHandlerError, ThumbnailSizeError, wrapError } from './thumbnailError';
import { generateThumbnail } from './thumbnailGenerator';

jest.mock('./handlerRegistry');
jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        drive_thumbnail_errors_total: { increment: jest.fn() },
        drive_thumbnail_no_handler_total: { increment: jest.fn() },
        drive_thumbnail_success_rate_total: { increment: jest.fn() },
    },
}));
jest.mock('@proton/shared/lib/helpers/sentry', () => ({ traceError: jest.fn() }));
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isIos: jest.fn().mockReturnValue(false),
    isSafari: jest.fn().mockReturnValue(false),
    isMobile: jest.fn().mockReturnValue(false),
}));

const mockProcess = jest.fn();
jest.requireMock('./handlerRegistry').ThumbnailProcessor.mockImplementation(() => ({ process: mockProcess }));

const mockMetrics = jest.requireMock('@proton/metrics').default;
const mockErrorsIncrement = mockMetrics.drive_thumbnail_errors_total.increment;
const mockNoHandlerIncrement = mockMetrics.drive_thumbnail_no_handler_total.increment;
const mockSuccessRateIncrement = mockMetrics.drive_thumbnail_success_rate_total.increment;
const mockTraceError = jest.requireMock('@proton/shared/lib/helpers/sentry').traceError;

describe('generateThumbnail', () => {
    let consoleDebugSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    });

    afterEach(() => {
        consoleDebugSpy.mockRestore();
    });

    it('should generate thumbnail with default options', async () => {
        mockProcess.mockResolvedValue({
            thumbnails: { thumbnails: [] },
            generationInfo: { detectedMimeType: 'image/jpeg', handler: 'ImageHandler' },
        });

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        const result = await thumbnailsPromise;

        expect(result.ok).toBe(true);
        expect(mockProcess).toHaveBeenCalledWith(
            blob,
            'test.jpg',
            blob.size,
            SupportedMimeTypes.webp,
            [ThumbnailType.Type1, ThumbnailType.Type2],
            false,
            'image/jpeg'
        );
        expect(mockSuccessRateIncrement).toHaveBeenCalledWith({ handler: 'image', status: 'success' });
    });

    it('should fallback to blob.type when no mime type explicitly provided', async () => {
        mockProcess.mockResolvedValue({
            thumbnails: { thumbnails: [] },
            generationInfo: { detectedMimeType: 'image/jpeg', handler: 'ImageHandler' },
        });

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        const result = await thumbnailsPromise;

        expect(result.ok).toBe(true);
        expect(mockProcess).toHaveBeenCalledWith(
            blob,
            'test.jpg',
            blob.size,
            SupportedMimeTypes.webp,
            [ThumbnailType.Type1, ThumbnailType.Type2],
            false,
            'image/jpeg'
        );
    });

    it('should handle custom options', async () => {
        mockProcess.mockResolvedValue({
            thumbnails: { thumbnails: [] },
            generationInfo: { detectedMimeType: 'image/jpeg', handler: 'ImageHandler' },
        });

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size, {
            debug: true,
        });
        await thumbnailsPromise;

        expect(mockProcess).toHaveBeenCalledWith(
            blob,
            'test.jpg',
            blob.size,
            SupportedMimeTypes.webp,
            [ThumbnailType.Type1, ThumbnailType.Type2],
            true,
            'image/jpeg'
        );
    });

    it('should handle errors', async () => {
        mockProcess.mockRejectedValue(new NoHandlerError('image/unknown'));

        const blob = new Blob(['test'], { type: 'image/unknown' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.unknown', blob.size);
        const result = await thumbnailsPromise;

        expect(result.ok).toBe(false);
        // @ts-ignore
        expect(result.error).toBeInstanceOf(NoHandlerError);
    });

    it('should report a metric with handler and errorType when generation fails', async () => {
        mockProcess.mockRejectedValue(
            new ThumbnailSizeError(100_000, 60_000, ThumbnailType.Type1, { handler: 'ImageHandler' })
        );

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        await thumbnailsPromise;

        expect(mockErrorsIncrement).toHaveBeenCalledWith({ handler: 'image', errorType: 'thumbnail_size' });
        expect(mockSuccessRateIncrement).toHaveBeenCalledWith({ handler: 'image', status: 'failed' });
    });

    it('should report to the no-handler metric, not the errors or success-rate metrics, when no handler was involved', async () => {
        mockProcess.mockRejectedValue(new NoHandlerError('image/unknown'));

        const blob = new Blob(['test'], { type: 'image/unknown' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.unknown', blob.size);
        await thumbnailsPromise;

        expect(mockNoHandlerIncrement).toHaveBeenCalledWith({});
        expect(mockErrorsIncrement).not.toHaveBeenCalled();
        expect(mockSuccessRateIncrement).not.toHaveBeenCalled();
    });

    it('should report a known error category to Sentry at debug level, tagged with handler/errorType/mimeType', async () => {
        mockProcess.mockRejectedValue(
            new ThumbnailSizeError(100_000, 60_000, ThumbnailType.Type1, {
                handler: 'ImageHandler',
                inputMimeType: 'image/jpeg',
            })
        );

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        await thumbnailsPromise;

        expect(mockTraceError).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                level: 'debug',
                tags: expect.objectContaining({
                    handler: 'image',
                    errorType: 'thumbnail_size',
                    mimeType: 'image/jpeg',
                }),
            })
        );
    });

    it('should report a handler bug to Sentry at debug level, alongside the metric', async () => {
        mockProcess.mockRejectedValue(
            new CanvasError('Failed to draw image on canvas', {
                context: { handler: 'ImageHandler', inputMimeType: 'image/webp' },
            })
        );

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        await thumbnailsPromise;

        expect(mockErrorsIncrement).toHaveBeenCalledWith({ handler: 'image', errorType: 'canvas' });
        expect(mockTraceError).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                level: 'debug',
                tags: expect.objectContaining({ handler: 'image', errorType: 'canvas', mimeType: 'image/webp' }),
            })
        );
    });

    it('should report to Sentry with the "other" errorType for an unclassified error', async () => {
        mockProcess.mockRejectedValue(wrapError(new Error('boom'), { handler: 'ImageHandler' }));

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        await thumbnailsPromise;

        expect(mockErrorsIncrement).toHaveBeenCalledWith({ handler: 'image', errorType: 'other' });
        expect(mockTraceError).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                level: 'debug',
                tags: expect.objectContaining({ handler: 'image', errorType: 'other' }),
            })
        );
    });

    it('should omit the mimeType tag when the input MIME type is unknown', async () => {
        mockProcess.mockRejectedValue(
            new CanvasError('Failed to draw image on canvas', { context: { handler: 'ImageHandler' } })
        );

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        await thumbnailsPromise;

        const [, context] = mockTraceError.mock.calls[0];
        expect(context.tags).not.toHaveProperty('mimeType');
    });

    it('should report NoHandlerError to Sentry tagged with mimeType, not handler/errorType', async () => {
        mockProcess.mockRejectedValue(new NoHandlerError('image/unknown'));

        const blob = new Blob(['test'], { type: 'image/unknown' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.unknown', blob.size);
        await thumbnailsPromise;

        expect(mockTraceError).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                level: 'debug',
                tags: { component: 'drive-thumbnail-generator', mimeType: 'image/unknown' },
            })
        );
    });
});
