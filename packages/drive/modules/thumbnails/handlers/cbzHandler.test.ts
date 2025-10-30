import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { MissingDataError, UnsupportedFormatError } from '../thumbnailError';
import { CbzHandler } from './cbzHandler';

jest.mock('@proton/components/containers/filePreview/ComicBookPreview', () => ({
    getCBZCover: jest.fn(),
}));

describe('CbzHandler', () => {
    let handler: CbzHandler;

    beforeEach(() => {
        handler = new CbzHandler();
        jest.clearAllMocks();
    });

    describe('canHandle', () => {
        test('Returns true for CBZ files', () => {
            expect(handler.canHandle('application/x-cbz', 'comic.cbz')).toBe(true);
            expect(handler.canHandle('application/vnd.comicbook+zip', 'comic.cbz')).toBe(true);
        });

        test('Returns true for zip files with .cbz extension', () => {
            expect(handler.canHandle('application/zip', 'comic.cbz')).toBe(true);
        });

        test('Returns false for non-CBZ files', () => {
            expect(handler.canHandle('application/zip', 'archive.zip')).toBe(false);
            expect(handler.canHandle('image/jpeg', 'photo.jpg')).toBe(false);
            expect(handler.canHandle('application/pdf', 'document.pdf')).toBe(false);
        });
    });

    describe('generate', () => {
        test('Throws MissingDataError when CBZ has no cover', async () => {
            const { getCBZCover } = await import('@proton/components/containers/filePreview/ComicBookPreview');
            jest.mocked(getCBZCover).mockResolvedValue({ cover: undefined, file: undefined });

            const blob = new Blob(['cbz content'], { type: 'application/x-cbz' });

            await expect(
                handler.generate(blob, 'comic.cbz', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1])
            ).rejects.toThrow(MissingDataError);
        });

        test('MissingDataError includes proper context', async () => {
            const { getCBZCover } = await import('@proton/components/containers/filePreview/ComicBookPreview');
            jest.mocked(getCBZCover).mockResolvedValue({ cover: undefined, file: undefined });

            const blob = new Blob(['cbz content'], { type: 'application/x-cbz' });

            try {
                await handler.generate(blob, 'comic.cbz', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1]);
                fail('Should have thrown MissingDataError');
            } catch (error) {
                expect(error).toBeInstanceOf(MissingDataError);
                if (error instanceof MissingDataError) {
                    expect(error.message).toContain('CBZ cover image');
                    expect(error.context.stage).toBe('CBZ cover extraction');
                }
            }
        });

        test('Throws UnsupportedFormatError when archive extraction fails', async () => {
            const { getCBZCover } = await import('@proton/components/containers/filePreview/ComicBookPreview');
            jest.mocked(getCBZCover).mockRejectedValue(new Error('Corrupted archive'));

            const blob = new Blob(['corrupted cbz'], { type: 'application/x-cbz' });

            await expect(
                handler.generate(blob, 'corrupted.cbz', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1])
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('UnsupportedFormatError includes proper context', async () => {
            const { getCBZCover } = await import('@proton/components/containers/filePreview/ComicBookPreview');
            jest.mocked(getCBZCover).mockRejectedValue(new Error('Corrupted archive'));

            const blob = new Blob(['corrupted cbz'], { type: 'application/x-cbz' });

            try {
                await handler.generate(blob, 'corrupted.cbz', blob.size, SupportedMimeTypes.webp, [
                    ThumbnailType.Type1,
                ]);
                fail('Should have thrown UnsupportedFormatError');
            } catch (error) {
                expect(error).toBeInstanceOf(UnsupportedFormatError);
                if (error instanceof UnsupportedFormatError) {
                    expect(error.message).toContain('CBZ archive');
                    expect(error.context.stage).toBe('CBZ processing');
                }
            }
        });

        test('Handler name is CbzHandler', () => {
            expect(handler.handlerName).toBe('CbzHandler');
        });
    });
});
