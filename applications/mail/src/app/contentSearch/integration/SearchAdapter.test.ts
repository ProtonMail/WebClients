import createListeners from '@proton/shared/lib/helpers/listeners';

import type { MetricService } from '../metrics/MetricService';
import type { Search } from '../search/Search';
import type { SearchService } from '../search/SearchService';
import { SearchAdapter } from './SearchAdapter';

const fakeSearch = () => {
    const search = {
        onResults: createListeners<[any[]]>(),
        onError: createListeners<[Error]>(),
        onDisposed: createListeners<[]>(),
        done: new Promise(() => {}),
        results: undefined as any[] | undefined,
        canServe: vi.fn(() => true),
        dispose: vi.fn(),
    };
    return search;
};

describe('SearchAdapter', () => {
    beforeEach(() => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0);
            return 0;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('hands results streamed after reusing the search to the latest results callback', () => {
        const search = fakeSearch();
        const adapter = new SearchAdapter({
            searchService: { search: () => search as unknown as Search } as unknown as SearchService,
            metricService: {} as MetricService,
            esCallbacks: {
                getSearchParams: () => ({ isSearch: true, esSearchParams: {} }),
            } as any,
        });
        const first = vi.fn();
        const second = vi.fn();

        void adapter.encryptedSearch(first);
        search.results = [{ ID: 'a' }];
        void adapter.encryptedSearch(second);
        first.mockClear();
        second.mockClear();

        search.onResults.notify([{ ID: 'a' }, { ID: 'b' }]);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith([{ ID: 'a' }, { ID: 'b' }]);
    });
});
