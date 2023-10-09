import { SupportedMimeTypes, THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';

import { scaleImageFile } from './image';
import { ThumbnailType } from './interface';

describe('scaleImageFile', () => {
    beforeEach(() => {
        global.URL.createObjectURL = jest.fn(() => 'url');
        // Image under test does not handle events.
        // @ts-ignore
        global.Image = class {
            addEventListener(type: string, listener: (value?: any) => void) {
                if (type === 'load') {
                    listener();
                }
            }
        };
        // @ts-ignore
        global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
            return {
                drawImage: jest.fn(),
                fillRect: jest.fn(),
            };
        });
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['abc']));
        });
    });

    it('returns the scaled image', async () => {
        await expect(scaleImageFile({ file: new Blob(), mimeType: SupportedMimeTypes.jpg })).resolves.toEqual({
            width: undefined,
            height: undefined,
            thumbnails: [
                {
                    thumbnailData: new Uint8Array([97, 98, 99]),
                    thumbnailType: ThumbnailType.PREVIEW,
                },
            ],
        });
    });
    it('returns multiple scaled image', async () => {
        await expect(
            scaleImageFile({
                file: new Blob(),
                mimeType: SupportedMimeTypes.jpg,
                thumbnailTypes: [ThumbnailType.PREVIEW, ThumbnailType.HD_PREVIEW],
            })
        ).resolves.toEqual({
            width: undefined,
            height: undefined,
            thumbnails: [
                {
                    thumbnailData: new Uint8Array([97, 98, 99]),
                    thumbnailType: ThumbnailType.PREVIEW,
                },
                {
                    thumbnailData: new Uint8Array([97, 98, 99]),
                    thumbnailType: ThumbnailType.HD_PREVIEW,
                },
            ],
        });
    });

    it('fails due to problem to load the image', async () => {
        // @ts-ignore
        global.Image = class {
            addEventListener(type: string, listener: (value?: any) => void) {
                if (type === 'error') {
                    listener(new Error('Failed to load image'));
                }
            }
        };
        await expect(scaleImageFile({ file: new Blob(), mimeType: SupportedMimeTypes.jpg })).rejects.toEqual(
            new Error('Image cannot be loaded')
        );
    });

    it('fails due to no small enough thumbnail', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['x'.repeat(THUMBNAIL_MAX_SIZE + 1)]));
        });
        await expect(scaleImageFile({ file: new Blob(), mimeType: SupportedMimeTypes.jpg })).rejects.toEqual(
            new Error('Cannot create small enough thumbnail')
        );
    });

    it('fails due to no blob', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(null);
        });
        await expect(scaleImageFile({ file: new Blob(), mimeType: SupportedMimeTypes.jpg })).rejects.toEqual(
            new Error('Blob not available')
        );
    });
});
