import { HD_THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';

import { canvasToThumbnail } from './canvasUtil';
import { ThumbnailType } from './interface';

describe('canvasToThumbnail', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
        }
    });

    it('should return thumbnail data when size is within limit', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['x'.repeat(THUMBNAIL_MAX_SIZE * 0.8)]));
        });
        const result = await canvasToThumbnail(canvas);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBeLessThan(THUMBNAIL_MAX_SIZE * 0.9);
    });

    it('should return HD thumbnail data when HD_PREVIEW type is specified', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['x'.repeat(THUMBNAIL_MAX_SIZE * 0.8)]));
        });
        const result = await canvasToThumbnail(canvas, ThumbnailType.HD_PREVIEW);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBeLessThan(HD_THUMBNAIL_MAX_SIZE * 0.9);
    });

    it('should throw an error if unable to create small enough thumbnail', async () => {
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['x'.repeat(HD_THUMBNAIL_MAX_SIZE)]));
        });

        // Create a large canvas that will exceed the size limit
        const largeCanvas = document.createElement('canvas');
        largeCanvas.width = 5000;
        largeCanvas.height = 5000;
        const ctx = largeCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 5000, 5000);
        }

        await expect(canvasToThumbnail(largeCanvas)).rejects.toThrow('Cannot create small enough thumbnail');
    });
});
