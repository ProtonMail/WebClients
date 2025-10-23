import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { NoHandlerError } from './thumbnailError';

jest.mock('./handlerRegistry');
jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: jest.fn(),
}));
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isIos: jest.fn().mockReturnValue(false),
    isSafari: jest.fn().mockReturnValue(false),
    isMobile: jest.fn().mockReturnValue(false),
}));

describe('generateThumbnail', () => {
    let mockProcess: jest.Mock;
    let consoleDebugSpy: jest.SpyInstance;
    let generateThumbnail: any;
    let ThumbnailProcessor: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.resetModules();

        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

        ThumbnailProcessor = (await import('./handlerRegistry')).ThumbnailProcessor;
        mockProcess = jest.fn();
        (ThumbnailProcessor as jest.MockedClass<any>).mockImplementation(() => {
            return {
                process: mockProcess,
            } as any;
        });

        // Import generateThumbnail after mocks are configured
        const generatorModule = await import('./thumbnailGenerator');
        generateThumbnail = generatorModule.generateThumbnail;
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
        const { resultPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        const result = await resultPromise;

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

    it('should fallback to blob.type when no mime type explicitly provided', async () => {
        mockProcess.mockResolvedValue({
            thumbnails: { thumbnails: [] },
            generationInfo: { detectedMimeType: 'image/jpeg', handler: 'ImageHandler' },
        });

        const blob = new Blob(['test'], { type: 'image/jpeg' });
        const { resultPromise } = generateThumbnail(blob, 'test.jpg', blob.size);
        const result = await resultPromise;

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
        const { resultPromise } = generateThumbnail(blob, 'test.jpg', blob.size, {
            debug: true,
        });
        await resultPromise;

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
        const { resultPromise } = generateThumbnail(blob, 'test.unknown', blob.size);
        const result = await resultPromise;

        expect(result.ok).toBe(false);
        // @ts-ignore
        expect(result.error).toBeInstanceOf(NoHandlerError);
    });
});
