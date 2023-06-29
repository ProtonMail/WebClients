import { THUMBNAIL_MAX_SIZE } from '@proton/shared/lib/drive/constants';

import { scaleImageFile } from './image';

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
        await expect(scaleImageFile(new Blob())).resolves.toEqual({
            originalWidth: undefined,
            originalHeight: undefined,
            thumbnailData: new Uint8Array([97, 98, 99]),
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
        await expect(scaleImageFile(new Blob())).rejects.toEqual(new Error('Image cannot be loaded'));
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
