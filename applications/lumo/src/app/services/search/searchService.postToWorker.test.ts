import type { Mock } from 'vitest';

import { SearchService } from './searchService';

type Internals = {
    worker: { postMessage: Mock } | null;
    workerReady: Promise<void> | null;
    pending: Map<string, unknown>;
    ensureWorker: () => void;
    getSearchIndexKey: () => Promise<string>;
    postToWorker: (message: { type: number; id?: string }) => Promise<unknown>;
};

let userCount = 0;

/** A service whose worker takes requests and never answers them. */
const silentWorkerService = () => {
    userCount += 1;
    const service = SearchService.get(`post-user-${userCount}`) as unknown as Internals;
    vi.spyOn(service, 'getSearchIndexKey').mockResolvedValue('key');
    vi.spyOn(service, 'ensureWorker').mockImplementation(() => {});
    service.worker = { postMessage: vi.fn() };
    service.workerReady = Promise.resolve();
    return service;
};

describe('SearchService worker requests', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('gives up on a search the worker never answers, and forgets it', async () => {
        const service = silentWorkerService();
        const request = service.postToWorker({ type: 0, id: 'search-1' });
        const settled = expect(request).rejects.toThrow('Search worker timed out');

        await vi.advanceTimersByTimeAsync(5_000);

        await settled;
        expect(service.pending.has('search-1')).toBe(false);
    });

    it('gives writes much longer than searches', async () => {
        const service = silentWorkerService();
        let failed = false;
        service.postToWorker({ type: 2, id: 'write-1' }).catch(() => {
            failed = true;
        });

        await vi.advanceTimersByTimeAsync(60_000);
        expect(failed).toBe(false);

        await vi.advanceTimersByTimeAsync(60_000);
        expect(failed).toBe(true);
    });
});
