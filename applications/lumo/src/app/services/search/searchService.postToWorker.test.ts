import { SearchService } from './searchService';

type Internals = {
    worker: { postMessage: jest.Mock } | null;
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
    jest.spyOn(service, 'getSearchIndexKey').mockResolvedValue('key');
    jest.spyOn(service, 'ensureWorker').mockImplementation(() => {});
    service.worker = { postMessage: jest.fn() };
    service.workerReady = Promise.resolve();
    return service;
};

describe('SearchService worker requests', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('gives up on a search the worker never answers, and forgets it', async () => {
        const service = silentWorkerService();
        const request = service.postToWorker({ type: 0, id: 'search-1' });
        const settled = expect(request).rejects.toThrow('Search worker timed out');

        await jest.advanceTimersByTimeAsync(5_000);

        await settled;
        expect(service.pending.has('search-1')).toBe(false);
    });

    it('gives writes much longer than searches', async () => {
        const service = silentWorkerService();
        let failed = false;
        service.postToWorker({ type: 2, id: 'write-1' }).catch(() => {
            failed = true;
        });

        await jest.advanceTimersByTimeAsync(60_000);
        expect(failed).toBe(false);

        await jest.advanceTimersByTimeAsync(60_000);
        expect(failed).toBe(true);
    });
});
