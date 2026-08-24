import { ThumbnailType } from '@protontech/drive-sdk';

import { handleSdkError } from '../../../legacy/errorHandling';
import { getCachedThumbnail, setCachedThumbnail } from '../encryptedThumbnailCache';
import { type MockDrive, makeDrive } from './testUtils';
import { fetchThumbnails, storeKeyOf } from './thumbnailFetcher';

jest.mock('../../../legacy/errorHandling', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../encryptedThumbnailCache', () => ({
    getCachedThumbnail: jest.fn(async () => undefined),
    setCachedThumbnail: jest.fn(async () => undefined),
}));

const mockGetCachedThumbnail = jest.mocked(getCachedThumbnail);
const mockSetCachedThumbnail = jest.mocked(setCachedThumbnail);
const mockHandleSdkError = jest.mocked(handleSdkError);

/** Makes the persistent cache hit for `key` only, missing for everything else. */
const cacheHitOn = (key: string, bytes: Uint8Array<ArrayBuffer>) =>
    mockGetCachedThumbnail.mockImplementation(async (lookupKey) => (lookupKey === key ? bytes : undefined));

it('storeKeyOf prefers revisionUid, falls back to nodeUid', () => {
    expect(storeKeyOf({ nodeUid: 'node-1', revisionUid: 'rev-1' })).toBe('rev-1');
    expect(storeKeyOf({ nodeUid: 'node-1' })).toBe('node-1');
});

describe('fetchThumbnails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns empty for empty input, touching neither cache nor SDK', async () => {
        const drive = makeDrive([]);

        expect(await fetchThumbnails(drive, [], ThumbnailType.Type1)).toEqual([]);
        expect(mockGetCachedThumbnail).not.toHaveBeenCalled();
        expect(drive.iterateThumbnails).not.toHaveBeenCalled();
    });

    it('serves a persistent-cache hit without calling the SDK', async () => {
        mockGetCachedThumbnail.mockResolvedValueOnce(new Uint8Array([7]) as Uint8Array<ArrayBuffer>);
        const item = { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true };

        const drive = makeDrive([]);
        const results = await fetchThumbnails(drive, [item], ThumbnailType.Type1);

        expect(mockGetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'sd');
        expect(drive.iterateThumbnails).not.toHaveBeenCalled();
        expect(results).toEqual([{ item, ok: true, bytes: new Uint8Array([7]), fromCache: true }]);
    });

    it('fetches a cache miss from the SDK and writes the hit back to the cache', async () => {
        const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);
        const item = { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true };

        const results = await fetchThumbnails(drive, [item], ThumbnailType.Type1);

        expect(mockSetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'sd', new Uint8Array([1, 2, 3]));
        expect(results).toEqual([{ item, ok: true, bytes: new Uint8Array([1, 2, 3]) }]);
    });

    it('leaves the cache untouched when usePersistentCache is not set', async () => {
        const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

        await fetchThumbnails(drive, [{ nodeUid: 'node-1', revisionUid: 'rev-1' }], ThumbnailType.Type1);

        expect(mockGetCachedThumbnail).not.toHaveBeenCalled();
        expect(mockSetCachedThumbnail).not.toHaveBeenCalled();
    });

    it('marks ok: false when the SDK reports a failed result, without caching it', async () => {
        const drive = makeDrive([{ nodeUid: 'node-1', ok: false }]);
        const item = { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true };

        const results = await fetchThumbnails(drive, [item], ThumbnailType.Type1);

        expect(results).toEqual([{ item, ok: false }]);
        expect(mockSetCachedThumbnail).not.toHaveBeenCalled();
    });

    it('batches multiple misses into one SDK call, mixed with a cache hit', async () => {
        cacheHitOn('rev-1', new Uint8Array([9]) as Uint8Array<ArrayBuffer>);
        const drive = makeDrive([{ nodeUid: 'node-2', ok: true, thumbnail: new Uint8Array([2]) }]);
        const items = [
            { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true },
            { nodeUid: 'node-2', revisionUid: 'rev-2', usePersistentCache: true },
        ];

        const results = await fetchThumbnails(drive, items, ThumbnailType.Type1);

        // Only the miss is asked for, in a single call.
        expect(drive.iterateThumbnails.mock.calls).toEqual([[['node-2'], ThumbnailType.Type1]]);
        expect(results).toEqual([
            { item: items[0], ok: true, bytes: new Uint8Array([9]), fromCache: true },
            { item: items[1], ok: true, bytes: new Uint8Array([2]) },
        ]);
    });

    it('keeps cache hits and reports handleSdkError when the SDK call throws', async () => {
        cacheHitOn('rev-1', new Uint8Array([9]) as Uint8Array<ArrayBuffer>);
        const drive = {
            iterateThumbnails: jest.fn(async function* (): AsyncGenerator<never> {
                throw new Error('network error');
            }),
        } as unknown as MockDrive;
        const items = [
            { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true },
            { nodeUid: 'node-2', revisionUid: 'rev-2', usePersistentCache: true },
        ];

        const results = await fetchThumbnails(drive, items, ThumbnailType.Type1);

        expect(mockHandleSdkError).toHaveBeenCalledTimes(1);
        // The cache hit survives the SDK call throwing for the other item.
        expect(results).toEqual([
            { item: items[0], ok: true, bytes: new Uint8Array([9]), fromCache: true },
            { item: items[1], ok: false },
        ]);
    });
});
