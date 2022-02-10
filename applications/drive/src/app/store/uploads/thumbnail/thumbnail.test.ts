import { makeThumbnail } from './thumbnail';

describe('makeThumbnail', () => {
    it('does nothing when mime type is not supported', async () => {
        await expect(makeThumbnail('png', new Blob())).resolves.toEqual(undefined);
        await expect(makeThumbnail('image/jpeeg', new Blob())).resolves.toEqual(undefined);
    });
});
