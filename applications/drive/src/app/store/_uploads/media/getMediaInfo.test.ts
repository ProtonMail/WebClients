import { getMediaInfo } from './getMediaInfo';

describe('makeThumbnail', () => {
    it('does nothing when mime type is not supported', async () => {
        await expect(getMediaInfo(new Promise((resolve) => resolve('png')), new Blob(), true)).resolves.toEqual(
            undefined
        );
        await expect(
            getMediaInfo(new Promise((resolve) => resolve('image/jpeeg')), new Blob(), false)
        ).resolves.toEqual(undefined);
    });
});
