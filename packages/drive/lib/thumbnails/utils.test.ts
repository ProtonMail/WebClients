import { ThumbnailType } from '@protontech/drive-sdk';

import {
    HD_THUMBNAIL_MAX_SIDE,
    HD_THUMBNAIL_MAX_SIZE,
    THUMBNAIL_MAX_SIDE,
    THUMBNAIL_MAX_SIZE,
} from '@proton/shared/lib/drive/constants';

import {
    calculateThumbnailSize,
    getLongestEdge,
    getMaxThumbnailSize,
    getThumbnailTypesToGenerate,
    shouldGenerateHDPreview,
} from './utils';

describe('calculateThumbnailSize', () => {
    it('should scale down large images', () => {
        const [width, height] = calculateThumbnailSize({ width: 4000, height: 3000 }, ThumbnailType.Type1);

        expect(width).toBeLessThanOrEqual(THUMBNAIL_MAX_SIDE);
        expect(height).toBeLessThanOrEqual(THUMBNAIL_MAX_SIDE);
        expect(width / height).toBeCloseTo(4000 / 3000, 1);
    });

    it('should not scale up small images', () => {
        const [width, height] = calculateThumbnailSize({ width: 100, height: 100 }, ThumbnailType.Type1);

        expect(width).toBe(100);
        expect(height).toBe(100);
    });

    it('should maintain aspect ratio', () => {
        const original = { width: 1920, height: 1080 };
        const [width, height] = calculateThumbnailSize(original, ThumbnailType.Type1);

        expect(width / height).toBeCloseTo(original.width / original.height, 1);
    });

    it('should handle Type2 differently', () => {
        const [width1] = calculateThumbnailSize({ width: 4000, height: 3000 }, ThumbnailType.Type1);
        const [width2] = calculateThumbnailSize({ width: 4000, height: 3000 }, ThumbnailType.Type2);

        expect(width2).toBeGreaterThan(width1);
    });
});

describe('getLongestEdge', () => {
    it('should return longest edge', () => {
        expect(getLongestEdge(1920, 1080)).toBe(1920);
        expect(getLongestEdge(1080, 1920)).toBe(1920);
        expect(getLongestEdge(1000, 1000)).toBe(1000);
    });
});

describe('shouldGenerateHDPreview', () => {
    it('should return true for large files with high resolution', () => {
        const result = shouldGenerateHDPreview(
            HD_THUMBNAIL_MAX_SIZE * 2,
            HD_THUMBNAIL_MAX_SIDE * 2,
            HD_THUMBNAIL_MAX_SIDE * 2
        );
        expect(result).toBe(true);
    });

    it('should return false for small files', () => {
        const result = shouldGenerateHDPreview(100000, 1000, 1000);
        expect(result).toBe(false);
    });

    it('should return false for low resolution files', () => {
        const result = shouldGenerateHDPreview(HD_THUMBNAIL_MAX_SIZE * 2, 500, 500);
        expect(result).toBe(false);
    });
});

describe('getThumbnailTypesToGenerate', () => {
    it('should return only Type1 for small files', () => {
        const fileSize = 1;
        const types = getThumbnailTypesToGenerate(fileSize, 500, 500);

        expect(types).toEqual([ThumbnailType.Type1]);
    });

    it('should return both types for large HD files', () => {
        const fileSize = HD_THUMBNAIL_MAX_SIZE * 2;
        const types = getThumbnailTypesToGenerate(fileSize, HD_THUMBNAIL_MAX_SIDE * 2, HD_THUMBNAIL_MAX_SIDE * 2);

        expect(types).toContain(ThumbnailType.Type1);
        expect(types).toContain(ThumbnailType.Type2);
    });
});

describe('getMaxThumbnailSize', () => {
    it('should return correct max sizes', () => {
        expect(getMaxThumbnailSize(ThumbnailType.Type1)).toBe(THUMBNAIL_MAX_SIZE * 0.9);
        expect(getMaxThumbnailSize(ThumbnailType.Type2)).toBe(HD_THUMBNAIL_MAX_SIZE * 0.9);
    });
});
