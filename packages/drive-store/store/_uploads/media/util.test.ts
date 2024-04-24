import { THUMBNAIL_MAX_SIDE } from '@proton/shared/lib/drive/constants';

import { calculateThumbnailSize } from './util';

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
        expect(calculateThumbnailSize({ width: 2000, height: 123 })).toEqual([512, 32]);
        expect(calculateThumbnailSize({ width: 123, height: 2000 })).toEqual([32, 512]);
    });

    it('never go over max side length', () => {
        const tooLong = THUMBNAIL_MAX_SIDE + 1.6;
        expect(
            calculateThumbnailSize({
                width: tooLong,
                height: tooLong,
            })
        ).toEqual([THUMBNAIL_MAX_SIDE, THUMBNAIL_MAX_SIDE]);
        const notThatLong = THUMBNAIL_MAX_SIDE - 1.6;
        expect(
            calculateThumbnailSize({
                width: notThatLong,
                height: notThatLong,
            })
        ).toEqual([THUMBNAIL_MAX_SIDE - 1, THUMBNAIL_MAX_SIDE - 1]);
    });

    it('never returns zero even for extreme aspect ratio', () => {
        expect(calculateThumbnailSize({ width: 5120, height: 1 })).toEqual([512, 1]);
        expect(calculateThumbnailSize({ width: 1, height: 5120 })).toEqual([1, 512]);
    });
});
