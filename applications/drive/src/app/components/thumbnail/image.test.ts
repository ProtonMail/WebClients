import { THUMBNAIL_MAX_SIZE } from '../../constants';
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
        expect(calculateThumbnailSize({ width: 3200, height: 20 })).toEqual([320, 2]);
        expect(calculateThumbnailSize({ width: 3200, height: 200 })).toEqual([320, 20]);
        expect(calculateThumbnailSize({ width: 3200, height: 2000 })).toEqual([320, 200]);
        expect(calculateThumbnailSize({ width: 20, height: 3200 })).toEqual([2, 320]);
        expect(calculateThumbnailSize({ width: 200, height: 3200 })).toEqual([20, 320]);
        expect(calculateThumbnailSize({ width: 2000, height: 3200 })).toEqual([200, 320]);
        expect(calculateThumbnailSize({ width: 3200, height: 3200 })).toEqual([320, 320]);
    });

    it('always returns integer', () => {
        expect(calculateThumbnailSize({ width: 1000, height: 123 })).toEqual([320, 39]);
        expect(calculateThumbnailSize({ width: 123, height: 1000 })).toEqual([39, 320]);
    });

    it('never returns zero even for extreme aspect ratio', () => {
        expect(calculateThumbnailSize({ width: 3200, height: 1 })).toEqual([320, 1]);
        expect(calculateThumbnailSize({ width: 1, height: 3200 })).toEqual([1, 320]);
    });
});
