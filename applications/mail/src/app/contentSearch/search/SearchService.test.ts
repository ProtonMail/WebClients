import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import { TabLocalDatabaseLock } from '../coordination/TabLocalDatabaseLock';
import { deferred, flushPromises } from '../integration/import/testFakes';
import type { MetricService } from '../metrics/MetricService';
import { LoggerProxy } from '../utils/logger';
import type { SearchOutcome } from './Search';
import { SearchService } from './SearchService';

/** Each `new Search(...)` gets an outcome the test resolves. */
const searches: { end: (outcome: SearchOutcome) => void; instance: { results: unknown[] | undefined } }[] = [];

jest.mock('./Search', () => ({
    Search: jest.fn().mockImplementation(() => {
        const done = deferred<SearchOutcome>();
        const instance = { done: done.promise, start: jest.fn(), results: undefined as unknown[] | undefined };
        searches.push({ end: done.resolve, instance });
        return instance;
    }),
}));

const fakeMetricService = () =>
    ({
        startSearchSession: jest.fn(),
        searchStarted: jest.fn(),
        searchCompleted: jest.fn(),
        searchCancelled: jest.fn(),
    }) as unknown as jest.Mocked<MetricService>;

const params = {} as NormalizedSearchParams;

describe('SearchService metrics', () => {
    let metricService: jest.Mocked<MetricService>;
    let searchService: SearchService;

    beforeEach(() => {
        searches.length = 0;
        metricService = fakeMetricService();
        searchService = new SearchService(
            'user',
            async () => [],
            new TabLocalDatabaseLock(),
            new LoggerProxy(undefined),
            metricService,
            true,
            async () => {}
        );
        // The worker is only handed to `Search`, which is faked here.
        jest.spyOn(searchService as any, 'getWorkerAndMessageCacheDeps').mockResolvedValue(undefined);
    });

    it('starts a session and a search for each new search', () => {
        searchService.search(params);

        expect(metricService.startSearchSession).toHaveBeenCalledTimes(1);
        expect(metricService.searchStarted).toHaveBeenCalledTimes(1);
    });

    it('reports a completed search with its result count', async () => {
        searchService.search(params);
        searches[0].instance.results = [{}, {}];
        searches[0].end('completed');
        await flushPromises();

        expect(metricService.searchCompleted).toHaveBeenCalledWith({
            hasResults: true,
            status: 'success',
            resultCount: 2,
        });
    });

    it('reports a failed search as an error', async () => {
        searchService.search(params);
        searches[0].end('failed');
        await flushPromises();

        expect(metricService.searchCompleted).toHaveBeenCalledWith({
            hasResults: false,
            status: 'error',
            resultCount: 0,
        });
    });

    it('cancels a search that found no index', async () => {
        searchService.search(params);
        searches[0].end('no-index');
        await flushPromises();

        expect(metricService.searchCancelled).toHaveBeenCalledTimes(1);
        expect(metricService.searchCompleted).not.toHaveBeenCalled();
    });

    it('ignores the outcome of a superseded search', async () => {
        searchService.search(params);
        searchService.search(params);
        searches[0].end('completed');
        await flushPromises();

        expect(metricService.searchCompleted).not.toHaveBeenCalled();

        searches[1].end('completed');
        await flushPromises();

        expect(metricService.searchCompleted).toHaveBeenCalledTimes(1);
    });
});

describe('SearchService worker connection', () => {
    let searchService: SearchService;
    let createWorker: jest.SpyInstance;
    let rawWorkers: { terminate: jest.Mock }[];

    beforeEach(() => {
        searches.length = 0;
        rawWorkers = [];
        searchService = new SearchService(
            'user',
            async () => [],
            new TabLocalDatabaseLock(),
            new LoggerProxy(undefined),
            fakeMetricService(),
            true,
            async () => {}
        );
        createWorker = jest
            .spyOn(searchService as any, 'createAndInitNewWorkerInstance')
            .mockImplementation(async () => {
                const rawWorker = { terminate: jest.fn() };
                rawWorkers.push(rawWorker);
                return { worker: {}, indexKey: {}, rawWorker };
            });
    });

    const closeConnection = (rawWorker: { terminate: jest.Mock }) => {
        (searchService as any).onWorkerConnectionClosed(rawWorker);
    };

    it('starts a new worker for the next warm-up once the connection is closed', async () => {
        await searchService.warmUp();
        closeConnection(rawWorkers[0]);
        await flushPromises();

        await searchService.warmUp();

        expect(rawWorkers[0].terminate).toHaveBeenCalledTimes(1);
        expect(createWorker).toHaveBeenCalledTimes(2);
    });

    it('terminates the worker only once the running search settles', async () => {
        searchService.search(params);
        await flushPromises();
        closeConnection(rawWorkers[0]);
        await flushPromises();
        expect(rawWorkers[0].terminate).not.toHaveBeenCalled();

        searches[0].end('failed');
        await flushPromises();

        expect(rawWorkers[0].terminate).toHaveBeenCalledTimes(1);
    });

    it('keeps the current worker when an older one reports its connection closed', async () => {
        await searchService.warmUp();
        closeConnection(rawWorkers[0]);
        await searchService.warmUp();

        closeConnection(rawWorkers[0]);
        await searchService.warmUp();

        expect(createWorker).toHaveBeenCalledTimes(2);
    });
});
