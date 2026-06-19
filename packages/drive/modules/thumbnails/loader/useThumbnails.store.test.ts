import { getCachedThumbnail, setCachedThumbnail } from '../encryptedThumbnailCache';
import { loadThumbnail } from '../index';
import type { DriveClient } from './types';
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

const makeDrive = (results: { nodeUid: string; ok: boolean; thumbnail?: Uint8Array<ArrayBuffer> }[]) =>
    ({
        iterateThumbnails: jest.fn(async function* () {
            for (const result of results) {
                yield result;
            }
        }),
    }) as unknown as DriveClient;

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

    describe('getThumbnail', () => {
        it('returns undefined for unknown id', () => {
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')).toBeUndefined();
        });
    });

    describe('loadThumbnail', () => {
        it('sets sdStatus to loading immediately, then loaded with url on success', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loading');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdUrl).toBeUndefined();

            await flushBatch();

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdUrl).toBe('blob:mock-url');
        });

        it('loads both SD and HD when thumbnailTypes contains both', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', thumbnailTypes: ['sd', 'hd'] });

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loading');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.hdStatus).toBe('loading');

            await flushBatch();

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdUrl).toBe('blob:mock-url');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.hdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.hdUrl).toBe('blob:mock-url');
        });

        it('tracks sd and hd statuses independently across separate drives', async () => {
            const sdDrive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);
            const hdDrive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([2]) }]);

            loadThumbnail(sdDrive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            loadThumbnail(hdDrive, { nodeUid: 'node-1', revisionUid: 'rev-1', thumbnailTypes: ['hd'] });

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loading');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.hdStatus).toBe('loading');

            await flushBatch();

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.hdStatus).toBe('loaded');
        });

        it('merges sd and hd data without overwriting each other', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);
            useThumbnailsStore.setState({ thumbnails: new Map([['rev-1', { sdUrl: 'blob:sd', sdStatus: 'loaded' }]]) });

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', thumbnailTypes: ['hd'] });
            await flushBatch();

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')).toEqual({
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

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdUrl).toBeUndefined();
        });

        it('does not re-queue after attempted', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: false }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();

            expect(jest.mocked(drive.iterateThumbnails)).toHaveBeenCalledTimes(1);
        });

        it('sets sdStatus to loaded and calls handleSdkError on batch error', async () => {
            const { handleSdkError } = jest.requireMock('../../../legacy/errorHandling');
            async function* throwingGenerator(): AsyncGenerator<never> {
                throw new Error('network error');
            }
            const drive = { iterateThumbnails: jest.fn(throwingGenerator) } as unknown as DriveClient;

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            loadThumbnail(drive, { nodeUid: 'node-2', revisionUid: 'rev-2' });
            await flushBatch();

            expect(handleSdkError).toHaveBeenCalledTimes(1);
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-2')?.sdStatus).toBe('loaded');

            const drive2 = makeDrive([]);
            loadThumbnail(drive2, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            await flushBatch();
            expect(jest.mocked(drive2.iterateThumbnails)).not.toHaveBeenCalled();
        });

        it('skips items where shouldLoad returns false', async () => {
            const drive = makeDrive([
                { nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) },
                { nodeUid: 'node-2', ok: true, thumbnail: new Uint8Array([2]) },
            ]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', shouldLoad: () => false });
            loadThumbnail(drive, { nodeUid: 'node-2', revisionUid: 'rev-2', shouldLoad: () => true });
            await flushBatch();

            expect(useThumbnailsStore.getState().getThumbnail('rev-1')).toBeUndefined();
            expect(useThumbnailsStore.getState().getThumbnail('rev-2')?.sdUrl).toBe('blob:mock-url');
            expect(useThumbnailsStore.getState().getThumbnail('rev-2')?.sdStatus).toBe('loaded');
        });

        describe('store key (revisionUid ?? nodeUid)', () => {
            it('keys by nodeUid when revisionUid is omitted', async () => {
                const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

                loadThumbnail(drive, { nodeUid: 'node-1' });

                // Stored under nodeUid, not under any revision.
                expect(useThumbnailsStore.getState().getThumbnail('node-1')?.sdStatus).toBe('loading');

                await flushBatch();

                expect(useThumbnailsStore.getState().getThumbnail('node-1')?.sdStatus).toBe('loaded');
                expect(useThumbnailsStore.getState().getThumbnail('node-1')?.sdUrl).toBe('blob:mock-url');
                // Still fetched from the SDK by nodeUid.
                expect(jest.mocked(drive.iterateThumbnails).mock.calls[0][0]).toEqual(['node-1']);
            });

            it('prefers revisionUid as the key when provided', async () => {
                const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1]) }]);

                loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
                await flushBatch();

                expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
                expect(useThumbnailsStore.getState().getThumbnail('node-1')).toBeUndefined();
            });

            it('dedupes a nodeUid-keyed item once attempted', async () => {
                const drive = makeDrive([{ nodeUid: 'node-1', ok: false }]);

                loadThumbnail(drive, { nodeUid: 'node-1' });
                await flushBatch();

                loadThumbnail(drive, { nodeUid: 'node-1' });
                await flushBatch();

                expect(useThumbnailsStore.getState().getThumbnail('node-1')?.sdStatus).toBe('loaded');
                expect(jest.mocked(drive.iterateThumbnails)).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('chunked draining', () => {
        it('drains a queue larger than the chunk size across multiple SDK calls', async () => {
            const total = 14; // > PROCESS_CHUNK_SIZE (10)
            const results = Array.from({ length: total }, (_, i) => ({
                nodeUid: `node-${i}`,
                ok: true,
                thumbnail: new Uint8Array([i]) as Uint8Array<ArrayBuffer>,
            }));
            // Yield only the uids the SDK was actually asked for in each chunk.
            const drive = {
                iterateThumbnails: jest.fn(async function* (uids: string[]) {
                    for (const uid of uids) {
                        const match = results.find((r) => r.nodeUid === uid);
                        if (match) {
                            yield match;
                        }
                    }
                }),
            } as unknown as DriveClient;

            results.forEach((r) => loadThumbnail(drive, { nodeUid: r.nodeUid, revisionUid: `rev-${r.nodeUid}` }));
            await flushBatch();

            // 14 items / chunk of 10 => 2 chunks => 2 SDK calls.
            expect(jest.mocked(drive.iterateThumbnails)).toHaveBeenCalledTimes(2);
            results.forEach((r) => {
                expect(useThumbnailsStore.getState().getThumbnail(`rev-${r.nodeUid}`)?.sdStatus).toBe('loaded');
            });
        });

        it('processes items in queue order (top-to-bottom of the view)', async () => {
            const total = 14; // > PROCESS_CHUNK_SIZE (10)
            const results = Array.from({ length: total }, (_, i) => ({
                nodeUid: `node-${i}`,
                ok: true,
                thumbnail: new Uint8Array([i]) as Uint8Array<ArrayBuffer>,
            }));
            const drive = {
                iterateThumbnails: jest.fn(async function* (uids: string[]) {
                    for (const uid of uids) {
                        const match = results.find((r) => r.nodeUid === uid);
                        if (match) {
                            yield match;
                        }
                    }
                }),
            } as unknown as DriveClient;

            results.forEach((r) => loadThumbnail(drive, { nodeUid: r.nodeUid, revisionUid: `rev-${r.nodeUid}` }));
            await flushBatch();

            const firstChunkUids = jest.mocked(drive.iterateThumbnails).mock.calls[0][0];
            // Queue order: the first 10 queued (node-0 .. node-9) are fetched before the rest.
            expect(firstChunkUids).toEqual([
                'node-0',
                'node-1',
                'node-2',
                'node-3',
                'node-4',
                'node-5',
                'node-6',
                'node-7',
                'node-8',
                'node-9',
            ]);
        });

        it('fetches items by ascending viewport distance, queue order breaking ties', async () => {
            const total = 14; // > PROCESS_CHUNK_SIZE (10)
            const results = Array.from({ length: total }, (_, i) => ({
                nodeUid: `node-${i}`,
                ok: true,
                thumbnail: new Uint8Array([i]) as Uint8Array<ArrayBuffer>,
            }));
            const drive = {
                iterateThumbnails: jest.fn(async function* (uids: string[]) {
                    for (const uid of uids) {
                        const match = results.find((r) => r.nodeUid === uid);
                        if (match) {
                            yield match;
                        }
                    }
                }),
            } as unknown as DriveClient;

            // Distance per node (by queue index): nearer the viewport => fetched sooner.
            const distances = [3, 1, 0, 0, 2, 0, 1, 0, 2, 1, 0, 3, 0, 1];
            results.forEach((r, i) =>
                loadThumbnail(drive, {
                    nodeUid: r.nodeUid,
                    revisionUid: `rev-${r.nodeUid}`,
                    viewportDistance: () => distances[i],
                })
            );
            await flushBatch();

            const firstChunkUids = jest.mocked(drive.iterateThumbnails).mock.calls[0][0];
            // distance 0 (queue order): node-2, node-3, node-5, node-7, node-10, node-12;
            // then distance 1: node-1, node-6, node-9, node-13 - filling the chunk of 10.
            expect(firstChunkUids).toEqual([
                'node-2',
                'node-3',
                'node-5',
                'node-7',
                'node-10',
                'node-12',
                'node-1',
                'node-6',
                'node-9',
                'node-13',
            ]);
            const secondChunkUids = jest.mocked(drive.iterateThumbnails).mock.calls[1][0];
            // distance 2 (node-4, node-8) then distance 3 (node-0, node-11).
            expect(secondChunkUids).toEqual(['node-4', 'node-8', 'node-0', 'node-11']);
        });
    });

    describe('persistent cache (usePersistentCache)', () => {
        it('serves a cache hit without calling the SDK', async () => {
            mockGetCachedThumbnail.mockResolvedValueOnce(new Uint8Array([7, 7, 7]) as Uint8Array<ArrayBuffer>);
            const drive = makeDrive([]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true });
            await flushBatch();

            expect(mockGetCachedThumbnail).toHaveBeenCalledWith('rev-1', 'sd');
            expect(jest.mocked(drive.iterateThumbnails)).not.toHaveBeenCalled();
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdStatus).toBe('loaded');
            expect(useThumbnailsStore.getState().getThumbnail('rev-1')?.sdUrl).toBe('blob:mock-url');
        });

        it('fetches a miss from the SDK and writes it to the cache', async () => {
            const drive = makeDrive([{ nodeUid: 'node-1', ok: true, thumbnail: new Uint8Array([1, 2, 3]) }]);

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1', usePersistentCache: true });
            await flushBatch();

            expect(jest.mocked(drive.iterateThumbnails)).toHaveBeenCalledTimes(1);
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
});
