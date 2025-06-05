import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import { getImageSize } from './senderImage';

jest.mock('@proton/shared/lib/helpers/dom');
const mockedRootFontSize = rootFontSize as jest.Mock;

describe('getImageSize', () => {
    it('should return the correct image size', () => {
        expect(getImageSize()).toBe(32);
    });

    it('should return the correct image size when image size is 36', () => {
        expect(getImageSize(36)).toBe(36);
    });

    it('should return the correct image size when devicePixelRatio is 4', () => {
        const originalDevicePixelRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', {
            value: 4,
            configurable: true,
        });
        expect(getImageSize()).toBe(128);

        Object.defineProperty(window, 'devicePixelRatio', {
            value: originalDevicePixelRatio,
            configurable: true,
        });
    });

    it('should return the correct image size when devicePixelRatio is 2', () => {
        const originalDevicePixelRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', {
            value: 2,
            configurable: true,
        });
        expect(getImageSize()).toBe(64);

        Object.defineProperty(window, 'devicePixelRatio', {
            value: originalDevicePixelRatio,
            configurable: true,
        });
    });

    it('should return the correct image size when devicePixelRatio is 2 and image size is 36', () => {
        const originalDevicePixelRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', {
            value: 2,
            configurable: true,
        });
        expect(getImageSize(36)).toBe(72);
        Object.defineProperty(window, 'devicePixelRatio', {
            value: originalDevicePixelRatio,
            configurable: true,
        });
    });

    it('should return the correct image size when rootFontSize is 18', () => {
        mockedRootFontSize.mockReturnValue(18);
        expect(getImageSize()).toBe(64);
    });

    it('should return the correct image size when rootFontSize is 16', () => {
        mockedRootFontSize.mockReturnValue(16);
        expect(getImageSize()).toBe(32);
    });
});
