import { ThumbnailType } from '@protontech/drive-sdk';

import { getCachedThumbnail, setCachedThumbnail } from '../encryptedThumbnailCache';
import { getThumbnail, getThumbnailBytes, loadThumbnail } from '../index';
import { type MockDrive, type ThumbnailResult, makeDrive } from './testUtils';
import { useThumbnailsStore } from './useThumbnails.store';

jest.mock('../../../legacy/errorHandling', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../encryptedThumbnailCache', () => ({
    getCachedThumbnail: jest.fn(async () => undefined),
    setCachedThumbnail: jest.fn(async () => undefined),
}));

const mockGetCachedThumbnail = jest.mocked(getCachedThumbnail);
const mockSetCachedThumbnail = jest.mocked(setCachedThumbnail);

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

const makeNodes = (count: number): ThumbnailResult[] =>
    Array.from({ length: count }, (_, i) => ({
        nodeUid: `node-${i}`,
        ok: true,
        thumbnail: new Uint8Array([i]) as Uint8Array<ArrayBuffer>,
    }));

const cached = (key: string) => useThumbnailsStore.getState().getThumbnailFromCache(key);

const flushBatch = async () => {
    await jest.runAllTimersAsync();
};

describe('useThumbnailsStore', () => {
    beforeEach(() => {
        useThumbnailsStore.setState({ thumbnails: new Map(), attempted: new Set(), batches: new Map() });
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getThumbnailFromCache', () => {
        it('returns undefined for unknown id', () => {
            expect(cached('rev-1')).toBeUndefined();
        });
    });

    describe('loadThumbnail', () => {
        it('sets sdStatus to loading immediately, then loaded with url on success', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            expect(cached('rev-1')).toEqual({ sdStatus: 'loading' });

            await flushBatch();

            expect(cached('rev-1')).toEqual({ sdStatus: 'loaded', sdUrl: 'blob:mock-url' });
        });

        it('loads both SD and HD when thumbnailTypes contains both', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', thumbnailTypes: ['sd', 'hd'] });

            expect(cached('rev-1')).toEqual({ sdStatus: 'loading', hdStatus: 'loading' });

            await flushBatch();

            expect(cached('rev-1')).toEqual({
                sdStatus: 'loaded',
                sdUrl: 'blob:mock-url',
                hdStatus: 'loaded',
                hdUrl: 'blob:mock-url',
            });
        });

        it('tracks sd and hd statuses independently across separate drives', async () => {
            const sdDrive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);
            const hdDrive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([2]) }]);

            loadThumbnail(sdDrive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            loadThumbnail(hdDrive, { nodeUid: 'node-1', revisionUid: 'rev-1', thumbnailTypes: ['hd'] });

            expect(cached('rev-1')).toEqual({ sdStatus: 'loading', hdStatus: 'loading' });

            await flushBatch();

            expect(cached('rev-1')).toEqual({
                sdStatus: 'loaded',
                sdUrl: 'blob:mock-url',
                hdStatus: 'loaded',
                hdUrl: 'blob:mock-url',
            });
        });

        it('merges sd and hd data without overwriting each other', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);
            useThumbnailsStore.setState({ thumbnails: new Map([['rev-1', { sdUrl: 'blob:sd', sdStatus: 'loaded' }]]) });

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', thumbnailTypes: ['hd'] });
            await flushBatch();

            expect(cached('rev-1')).toEqual({
                sdUrl: 'blob:sd',
                sdStatus: 'loaded',
                hdUrl: 'blob:mock-url',
                hdStatus: 'loaded',
            });
        });

        it('sets sdStatus to loaded with no url when ok is false', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: false }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();

            expect(cached('rev-1')).toEqual({ sdStatus: 'loaded' });
        });

        it('does not re-queue after attempted', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: false }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();

            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
        });

        it('sets sdStatus to loaded and calls handleSdkError on batch error', async () => {
            const { handleSdkError } = jest.requireMock('../../../legacy/errorHandling');
            async function* throwingGenerator(): AsyncGenerator<never> {
                throw new Error('network error');
            }
            const drive = { iterateThumbnails: jest.fn(throwingGenerator) } as unknown as MockDrive;

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            loadThumbnail(drive, { nodeUid: 'node-2', revisionUid: 'rev-2' });
            await flushBatch();

            expect(handleSdkError).toHaveBeenCalledTimes(1);
            expect([cached('rev-1'), cached('rev-2')]).toEqual([{ sdStatus: 'loaded' }, { sdStatus: 'loaded' }]);

            const drive2 = makeDrive([]);
            loadThumbnail(drive2, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();
            expect(drive2.iterateThumbnails).not.toHaveBeenCalled();
        });

        it('skips items where shouldLoad returns false', async () => {
            const drive = makeDrive(makeNodes(2));

            loadThumbnail(drive, { nodeUid: 'node-0', revisionUid: 'rev-0', shouldLoad: () => false });
            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', shouldLoad: () => true });
            await flushBatch();

            expect(cached('rev-0')).toBeUndefined();
            expect(cached('rev-1')).toEqual({ sdStatus: 'loaded', sdUrl: 'blob:mock-url' });
        });

        describe('store key (revisionUid ?? nodeUid)', () => {
            it('keys by nodeUid when revisionUid is omitted', async () => {
                const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

                loadThumbnail(drive, { nodeUid: 'node-1' });

                // Stored under nodeUid, not under any revision.
                expect(cached('node-1')).toEqual({ sdStatus: 'loading' });

                await flushBatch();

                expect(cached('node-1')).toEqual({ sdStatus: 'loaded', sdUrl: 'blob:mock-url' });
                // Still fetched from the SDK by nodeUid.
                expect(drive.iterateThumbnails.mock.calls[0][0]).toEqual(['node-1']);
            });

            it('prefers revisionUid as the key when provided', async () => {
                const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

                loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
                await flushBatch();

                expect(cached('rev-1')).toEqual({ sdStatus: 'loaded', sdUrl: 'blob:mock-url' });
                expect(cached('node-1')).toBeUndefined();
            });

            it('dedupes a nodeUid-keyed item once attempted', async () => {
                const drive = makeDrive([{ nodeUid: 'node-1', ok: false }]);

                loadThumbnail(drive, { nodeUid: 'node-1' });
                await flushBatch();

                loadThumbnail(drive, { nodeUid: 'node-1' });
                await flushBatch();

                expect(cached('node-1')).toEqual({ sdStatus: 'loaded' });
                expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('chunked draining', () => {
        const TOTAL = 14; // > PROCESS_CHUNK_SIZE (10)

        it('drains a queue larger than the chunk size, in queue order', async () => {
            const nodes = makeNodes(TOTAL);
            const drive = makeDrive(nodes);

            nodes.forEach((node) =>
                loadThumbnail(drive, { nodeUid: node.nodeUid, revisionUid: `rev-${node.nodeUid}` })
            );
            await flushBatch();

            // 14 items / chunk of 10 => 2 chunks => 2 SDK calls, the first 10 queued going first.
            expect(drive.iterateThumbnails.mock.calls.map(([uids]) => uids)).toEqual([
                nodes.slice(0, 10).map((node) => node.nodeUid),
                nodes.slice(10).map((node) => node.nodeUid),
            ]);
            expect(nodes.map((node) => cached(`rev-${node.nodeUid}`)?.sdStatus)).toEqual(Array(TOTAL).fill('loaded'));
        });

        it('fetches items by ascending viewport distance, queue order breaking ties', async () => {
            const nodes = makeNodes(TOTAL);
            const drive = makeDrive(nodes);

            // Distance per node (by queue index): nearer the viewport => fetched sooner.
            const distances = [3, 1, 0, 0, 2, 0, 1, 0, 2, 1, 0, 3, 0, 1];
            nodes.forEach((node, i) =>
                loadThumbnail(drive, {
                    nodeUid: node.nodeUid,
                    revisionUid: `rev-${node.nodeUid}`,
                    viewportDistance: () => distances[i],
                })
            );
            await flushBatch();

            expect(drive.iterateThumbnails.mock.calls.map(([uids]) => uids)).toEqual([
                // distance 0 (queue order), then distance 1 - filling the chunk of 10.
                ['node-2', 'node-3', 'node-5', 'node-7', 'node-10', 'node-12', 'node-1', 'node-6', 'node-9', 'node-13'],
                // distance 2 then distance 3.
                ['node-4', 'node-8', 'node-0', 'node-11'],
            ]);
        });
    });

    describe('persistent cache (usePersistentCache)', () => {
        it('serves a cache hit without calling the SDK', async () => {
            mockGetCachedThumbnail.mockResolvedValueOnce(new Uint8Array([7, 7, 7]) as Uint8Array<ArrayBuffer>);
            const drive = makeDrive([]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true });
            await flushBatch();

            expect(mockGetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'sd');
            expect(drive.iterateThumbnails).not.toHaveBeenCalled();
            expect(cached('rev-1')).toEqual({ sdStatus: 'loaded', sdUrl: 'blob:mock-url' });
        });

        it('fetches a miss from the SDK and writes it to the cache', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true });
            await flushBatch();

            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
            expect(mockSetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'sd', new Uint8Array([1, 2, 3]));
        });

        it('caches HD too (type follows the batch)', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([4]) }]);

            loadThumbnail(drive, {
                nodeUid: 'node-1',
                revisionUid: 'rev-1',
                thumbnailTypes: ['hd'],
                usePersistentCache: true,
            });
            await flushBatch();

            expect(mockGetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'hd');
            expect(mockSetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'hd', new Uint8Array([4]));
        });

        it('does not touch the cache when usePersistentCache is not set', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();

            expect(mockGetCachedThumbnail).not.toHaveBeenCalled();
            expect(mockSetCachedThumbnail).not.toHaveBeenCalled();
        });
    });

    describe('getThumbnail (cache-or-fetch)', () => {
        it('fetches directly without joining the batch queue, and stores the result', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);

            const data = await getThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            expect(data).toEqual({ sdStatus: 'loaded', sdUrl: 'blob:mock-url' });
            expect(cached('rev-1')).toEqual(data);
        });

        it('resolves both sd and hd when both are requested', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

            const data = await getThumbnail(drive, {
                nodeUid: 'node-1',
                revisionUid: 'rev-1',
                thumbnailTypes: ['sd', 'hd'],
            });

            expect(data).toEqual({
                sdStatus: 'loaded',
                sdUrl: 'blob:mock-url',
                hdStatus: 'loaded',
                hdUrl: 'blob:mock-url',
            });
            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(2);
        });

        it('returns already-loaded data without calling the SDK again', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

            await getThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await getThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
        });

        it('settles to loaded instead of hanging when fetchThumbnails rejects before yielding anything', async () => {
            const { handleSdkError } = jest.requireMock('../../../legacy/errorHandling');
            mockGetCachedThumbnail.mockRejectedValueOnce(new Error('idb error'));
            const drive = makeDrive([]);

            const data = await getThumbnail(drive, {
                nodeUid: 'node-1',
                revisionUid: 'rev-1',
                usePersistentCache: true,
            });

            expect(data).toEqual({ sdStatus: 'loaded' });
            expect(handleSdkError).toHaveBeenCalledTimes(1);

            // Marked attempted despite the failure, same as a batch fetch error - a later caller
            // reads back the settled state instead of retrying or hanging on waitUntilSettled.
            const drive2 = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);
            const data2 = await getThumbnail(drive2, {
                nodeUid: 'node-1',
                revisionUid: 'rev-1',
                usePersistentCache: true,
            });

            expect(data2).toEqual({ sdStatus: 'loaded' });
            expect(drive2.iterateThumbnails).not.toHaveBeenCalled();
        });
    });

    describe('getThumbnailBytes (cache-or-request bytes)', () => {
        it('hands back freshly-fetched bytes directly, without reading any blob url', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);
            const fetchSpy = jest.spyOn(global, 'fetch');

            const bytes = await getThumbnailBytes(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
            expect(fetchSpy).not.toHaveBeenCalled();
            fetchSpy.mockRestore();
        });

        it('falls back to the next requested type when the first is unavailable', async () => {
            const drive = {
                iterateThumbnails: jest.fn(async function* (_uids: string[], type: ThumbnailType) {
                    if (type === ThumbnailType.Type2) {
                        yield { nodeUid: 'node-1', ok: false };
                    } else {
                        yield { nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([9]) };
                    }
                }),
            } as unknown as MockDrive;

            const bytes = await getThumbnailBytes(drive, {
                nodeUid: 'node-1',
                revisionUid: 'rev-1',
                thumbnailTypes: ['hd', 'sd'],
            });

            expect(bytes).toEqual(new Uint8Array([9]));
        });

        it('waits for a batch fetch already in flight instead of double-fetching', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([5]) }]);
            global.fetch = jest.fn(async () => ({ arrayBuffer: async () => new Uint8Array([5]).buffer }) as Response);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            const bytesPromise = getThumbnailBytes(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            await flushBatch();

            expect(await bytesPromise).toEqual(new Uint8Array([5]));
            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
        });

        it('waits for a concurrent getThumbnailBytes call instead of double-fetching', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([7]) }]);
            global.fetch = jest.fn(async () => ({ arrayBuffer: async () => new Uint8Array([7]).buffer }) as Response);

            const results = await Promise.all([
                getThumbnailBytes(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' }),
                getThumbnailBytes(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' }),
            ]);

            expect(results).toEqual([new Uint8Array([7]), new Uint8Array([7])]);
            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
        });

        it('does not double-fetch when loadThumbnail is called while a direct fetch is already in flight', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

            const bytesPromise = getThumbnailBytes(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            // Claimed synchronously, before the SDK call resolves and before `attempted` is set.
            expect(cached('rev-1')).toEqual({ sdStatus: 'loading' });

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();
            await bytesPromise;

            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
        });

        it('fetches it itself when the batch drops a pending item for shouldProcess', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);
            let visible = true;

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', shouldLoad: () => visible });
            expect(cached('rev-1')).toEqual({ sdStatus: 'loading' });

            // Scrolled out of view before the batch gets to drain it.
            visible = false;
            const bytesPromise = getThumbnailBytes(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            await flushBatch();

            expect(await bytesPromise).toEqual(new Uint8Array([1]));
            expect(drive.iterateThumbnails).toHaveBeenCalledTimes(1);
        });
    });
});
