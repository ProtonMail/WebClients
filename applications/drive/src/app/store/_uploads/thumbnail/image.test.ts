import { THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';
import { scaleImageFile, calculateThumbnailSize } from './image';

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
            };
        });
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['abc']));
        });
    });

    it('returns the scaled image', async () => {
        await expect(scaleImageFile(new Blob())).resolves.toEqual(new Uint8Array([97, 98, 99]));
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
        await expect(scaleImageFile(new Blob())).rejects.toEqual(new Error('Failed to load image'));
    });

    it('fails due to no small enough thumbnail', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['x'.repeat(THUMBNAIL_MAX_SIZE + 1)]));
        });
        await expect(scaleImageFile(new Blob())).rejects.toEqual(new Error('Cannot create small enough thumbnail'));
    });

    it('fails due to no blob', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(null);
        });
        await expect(scaleImageFile(new Blob())).rejects.toEqual(new Error('Blob not available'));
    });
});

describe('calculateThumbnailSize', () => {
    it('keeps smaller images as is', () => {
        expect(calculateThumbnailSize({ width: 200, height: 200 })).toEqual([200, 200]);
    });

    it('resize bigger images', () => {
        expect(calculateThumbnailSize({ width: 5120, height: 20 })).toEqual([512, 2]);
        expect(calculateThumbnailSize({ width: 5120, height: 200 })).toEqual([512, 20]);
        expect(calculateThumbnailSize({ width: 5120, height: 2000 })).toEqual([512, 200]);

        expect(calculateThumbnailSize({ width: 20, height: 5120 })).toEqual([2, 512]);
        expect(calculateThumbnailSize({ width: 200, height: 5120 })).toEqual([20, 512]);
        expect(calculateThumbnailSize({ width: 2000, height: 5120 })).toEqual([200, 512]);

        expect(calculateThumbnailSize({ width: 5120, height: 5120 })).toEqual([512, 512]);
    });

    it('always returns integer', () => {
        expect(calculateThumbnailSize({ width: 2000, height: 123 })).toEqual([512, 31]);
        expect(calculateThumbnailSize({ width: 123, height: 2000 })).toEqual([31, 512]);
    });

    it('never returns zero even for extreme aspect ratio', () => {
        expect(calculateThumbnailSize({ width: 5120, height: 1 })).toEqual([512, 1]);
        expect(calculateThumbnailSize({ width: 1, height: 5120 })).toEqual([1, 512]);
    });
});
