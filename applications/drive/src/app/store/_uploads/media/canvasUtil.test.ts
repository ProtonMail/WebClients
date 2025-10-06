import { HD_THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';

import { canvasToThumbnail } from './canvasUtil';
import { ThumbnailType } from './interface';

const mockIsSafari = jest.fn(() => false);
const mockIsIos = jest.fn(() => false);

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isSafari: () => mockIsSafari(),
    isIos: () => mockIsIos(),
    isMobile: jest.fn(() => false),
}));

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
            callback(new Blob(['x'.repeat(THUMBNAIL_MAX_SIZE)]));
        });

        await expect(canvasToThumbnail(canvas)).rejects.toThrow('Cannot create small enough thumbnail');
    });
});
