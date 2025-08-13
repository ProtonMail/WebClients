import { HD_THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';

import { scaleImageFile, shouldGenerateHDPreview } from './image';
import { ThumbnailType } from './interface';

let mockImageSize = 500;
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

            width = mockImageSize;

            height = mockImageSize;
        };
        // @ts-ignore
        global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
            return {
                drawImage: jest.fn(),
                fillRect: jest.fn(),
                clearRect: jest.fn(),
            };
        });
    });

    it('returns the scaled image', async () => {
        await expect(scaleImageFile({ file: new Blob() })).resolves.toEqual({
            width: mockImageSize,
            height: mockImageSize,
            thumbnails: [
                {
                    thumbnailData: new Uint8Array([97, 98, 99]),
                    thumbnailType: ThumbnailType.PREVIEW,
                },
            ],
        });
    });
    it('returns multiple scaled image', async () => {
        mockImageSize = 5000;

        await expect(
            scaleImageFile({
                file: new Blob(['x'.repeat(HD_THUMBNAIL_MAX_SIZE + 1)]),
            })
        ).resolves.toEqual({
            width: mockImageSize,
            height: mockImageSize,
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
        await expect(scaleImageFile({ file: new Blob() })).rejects.toEqual(new Error('Image cannot be loaded'));
    });

    it('fails due to no small enough thumbnail', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['x'.repeat(THUMBNAIL_MAX_SIZE + 1)]));
        });
        await expect(scaleImageFile({ file: new Blob() })).rejects.toEqual(
            new Error('Cannot create small enough thumbnail')
        );
    });

    it('fails due to no blob', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(null);
        });
        await expect(scaleImageFile({ file: new Blob() })).rejects.toEqual(new Error('Blob not available'));
    });
});

describe('shouldGenerateHDPreview', () => {
    test('should return true when both conditions are met', () => {
        const size = 1.5 * 1024 * 1024; // 1.5MB
        const width = 2000;
        const height = 1500;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(true);
    });

    test('should return false when only edge condition is met', () => {
        const size = 0.5 * 1024 * 1024; // 0.5MB
        const width = 2000;
        const height = 1500;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(false);
    });

    test('should return false when only size condition is met', () => {
        const size = 1.5 * 1024 * 1024; // 1.5MB
        const width = 1500;
        const height = 1200;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(false);
    });

    test('should return false when neither condition is met', () => {
        const size = 0.5 * 1024 * 1024; // 0.5MB
        const width = 1500;
        const height = 1200;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(false);
    });

    test('should return false when edge is exactly at threshold', () => {
        const size = 1.5 * 1024 * 1024; // 1.5MB
        const width = 1920;
        const height = 1080;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(false);
    });

    test('should return false when size is exactly at threshold', () => {
        const size = 1024 * 1024; // 1MB
        const width = 2000;
        const height = 1500;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(false);
    });

    test('should handle portrait orientation correctly', () => {
        const size = 1.5 * 1024 * 1024; // 1.5MB
        const width = 1080;
        const height = 2000;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(true);
    });

    test('should handle square images correctly', () => {
        const size = 1.5 * 1024 * 1024; // 1.5MB
        const width = 2000;
        const height = 2000;

        expect(shouldGenerateHDPreview(size, width, height)).toBe(true);
    });

    test('should handle extreme values correctly', () => {
        expect(shouldGenerateHDPreview(10 * 1024 * 1024, 8000, 6000)).toBe(true);
        expect(shouldGenerateHDPreview(10, 100, 100)).toBe(false);
    });
});
