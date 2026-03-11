import { loadThumbnail } from '../index';
import type { DriveClient } from './types';
import { useThumbnailsStore } from './useThumbnails.store';

jest.mock('../../../internal/handleDriveError', () => ({
    handleDriveError: jest.fn(),
}));

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

        it('sets sdStatus to loaded and calls handleDriveError on batch error', async () => {
            const { handleDriveError } = jest.requireMock('../../../internal/handleDriveError');
            async function* throwingGenerator(): AsyncGenerator<never> {
                throw new Error('network error');
            }
            const drive = { iterateThumbnails: jest.fn(throwingGenerator) } as unknown as DriveClient;

            loadThumbnail(drive, { nodeUid: 'node-1', revisionUid: 'rev-1' });
            loadThumbnail(drive, { nodeUid: 'node-2', revisionUid: 'rev-2' });
            await flushBatch();

            expect(handleDriveError).toHaveBeenCalledTimes(1);
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
    });
});
