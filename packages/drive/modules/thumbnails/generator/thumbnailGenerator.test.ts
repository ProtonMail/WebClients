import { ThumbnailType } from '@protontech/drive-sdk';
import type { MockInstance } from 'vitest';

import metrics from '@proton/metrics/metricsInstance';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { ThumbnailProcessor } from './handlerRegistry';
import {
    CanvasError,
    FileTooLargeError,
    NoHandlerError,
    ThumbnailSizeError,
    UnsupportedFormatError,
    wrapError,
} from './thumbnailError';
import { generateThumbnail } from './thumbnailGenerator';

vi.mock('./handlerRegistry');
vi.mock('@proton/metrics/metricsInstance', () => ({
    default: {
        drive_thumbnail_errors_total: { increment: vi.fn() },
        drive_thumbnail_no_handler_total: { increment: vi.fn() },
        drive_thumbnail_success_rate_total: { increment: vi.fn() },
    },
}));
vi.mock('@proton/shared/lib/helpers/sentry', () => ({ traceError: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isIos: vi.fn().mockReturnValue(false),
    isWebKit: vi.fn().mockReturnValue(false),
    isMobile: vi.fn().mockReturnValue(false),
}));

const mockProcess = vi.fn();
vi.mocked(ThumbnailProcessor).mockImplementation(function () {
    return { process: mockProcess } as any;
});

const mockMetrics = metrics as any;
const mockErrorsIncrement = mockMetrics.drive_thumbnail_errors_total.increment;
const mockNoHandlerIncrement = mockMetrics.drive_thumbnail_no_handler_total.increment;
const mockSuccessRateIncrement = mockMetrics.drive_thumbnail_success_rate_total.increment;
const mockTraceError = vi.mocked(traceError);

describe('generateThumbnail', () => {
    let consoleDebugSpy: MockInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
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
        expect((context as { tags: Record<string, unknown> }).tags).not.toHaveProperty('mimeType');
    });

    it('should count NoHandlerError in the metric without reporting it to Sentry', async () => {
        mockProcess.mockRejectedValue(new NoHandlerError('image/unknown'));

        const blob = new Blob(['test'], { type: 'image/unknown' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.unknown', blob.size);
        await thumbnailsPromise;

        expect(mockNoHandlerIncrement).toHaveBeenCalledWith({});
        expect(mockTraceError).not.toHaveBeenCalled();
    });

    it('should not report UnsupportedFormatError to Sentry for a known mimeType, but still count it', async () => {
        mockProcess.mockRejectedValue(
            new UnsupportedFormatError('video format not supported by browser', {
                context: { handler: 'VideoHandler', inputMimeType: 'video/avi' },
            })
        );

        const blob = new Blob(['test'], { type: 'video/avi' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.avi', blob.size);
        await thumbnailsPromise;

        expect(mockErrorsIncrement).toHaveBeenCalledWith({ handler: 'video', errorType: 'unsupported_format' });
        expect(mockTraceError).not.toHaveBeenCalled();
    });

    it('should report UnsupportedFormatError to Sentry for a mimeType not seen yet', async () => {
        mockProcess.mockRejectedValue(
            new UnsupportedFormatError('HEVC codec not supported for thumbnail generation', {
                context: { handler: 'VideoHandler', inputMimeType: 'video/mp4' },
            })
        );

        const blob = new Blob(['test'], { type: 'video/mp4' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.mp4', blob.size);
        await thumbnailsPromise;

        expect(mockTraceError).toHaveBeenCalledTimes(1);
    });

    it('should neither report FileTooLargeError to Sentry nor count it in any metric', async () => {
        mockProcess.mockRejectedValue(
            new FileTooLargeError('large image', {
                context: { handler: 'ImageHandler', inputMimeType: 'image/png', fileSize: 200 * 1024 * 1024 },
            })
        );

        const blob = new Blob(['test'], { type: 'image/png' });
        const { thumbnailsPromise } = generateThumbnail(blob, 'test.png', blob.size);
        const result = await thumbnailsPromise;

        expect(result.ok).toBe(false);
        expect(mockTraceError).not.toHaveBeenCalled();
        expect(mockErrorsIncrement).not.toHaveBeenCalled();
        expect(mockSuccessRateIncrement).not.toHaveBeenCalled();
        expect(mockNoHandlerIncrement).not.toHaveBeenCalled();
    });
});
