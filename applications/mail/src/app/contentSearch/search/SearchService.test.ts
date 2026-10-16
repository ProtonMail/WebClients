import type { NormalizedSearchParams } from '@proton/encrypted-search/models';

import { DatabaseLock } from '../db/DatabaseLock';
import { deferred, flushPromises } from '../integration/testFakes';
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
            new DatabaseLock(),
            new LoggerProxy(undefined),
            metricService
        );
        // The worker is only handed to `Search`, which is faked here.
        jest.spyOn(searchService as any, 'getWorker').mockResolvedValue(undefined);
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
