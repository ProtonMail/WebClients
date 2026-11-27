import type { ESCallbacks } from '@proton/encrypted-search/models/esCallbacks';
import type { ESSetResultsList } from '@proton/encrypted-search/models/esFunctions';
import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import type { MetricService } from '../metrics/MetricService';
import type { Search, SearchOutcome } from '../search/Search';
import type { SearchService } from '../search/SearchService';
import type { FunctionsV2 } from './useContentSearch';

/**
 * Coalesces rapid calls to at most one per animation frame, always delivering the latest arguments.
 *
 * Content search streams a *full result snapshot* per time bucket, so a large query fires the
 * results callback hundreds of times in a burst. Each snapshot supersedes the previous one, so
 * collapsing them to one call per frame is lossless — while it keeps `setResultsList` (and the Redux
 * dispatch behind it) from flooding React with renders and tripping its max-update-depth guard.
 * This throttling lives here, at the integration boundary, so the search core stays clean.
 */
class FrameCoalescer<T extends any[]> {
    private handle?: number;

    private latest?: T;

    constructor(private readonly fn: (...args: T) => void) {}

    schedule(...args: T) {
        this.latest = args;
        if (this.handle !== undefined) {
            return;
        }
        this.handle = requestAnimationFrame(() => {
            this.handle = undefined;
            if (this.latest) {
                this.fn(...this.latest);
            }
        });
    }

    cancel() {
        if (this.handle !== undefined) {
            cancelAnimationFrame(this.handle);
            this.handle = undefined;
        }
    }
}

/**
 * Rejects if the search errors before producing any results, else resolves with how it ended — or
 * with `undefined` if it was disposed before ending (a superseded query).
 */
function errorBeforeFirstResults(search: Search): Promise<SearchOutcome | undefined> {
    return new Promise((resolve, reject) => {
        let subscriptions: (() => void)[] = [];
        const unsubscribe = () => subscriptions.forEach((s) => s());
        subscriptions = [
            search.onError.subscribe((err) => {
                unsubscribe();
                reject(err);
            }),
            search.onDisposed.subscribe(() => {
                unsubscribe();
                resolve(undefined);
            }),
        ];

        void search.done.then((outcome) => {
            unsubscribe();
            resolve(outcome);
        });
    });
}

/**
 * Adapts the content-search-v2 index to the {@link EncryptedSearchFunctions} surface so it can be
 * swapped in behind the `ContentSearch` feature flag (see `useContentSearch` / `EncryptedSearchProvider`).
 */
export class SearchAdapter implements Pick<FunctionsV2, 'encryptedSearch' | 'isSearchResult'> {
    private readonly searchService: SearchService;
    private readonly metricService: MetricService;
    /** Per-render dependency, refreshed by `useContentSearch` — provides getSearchParams/getKeywords. */
    public esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
    private lastSearch?: Search;
    private coalescedResults?: FrameCoalescer<Parameters<ESSetResultsList<ESBaseMessage, ESMessageContent>>>;

    constructor({
        searchService,
        metricService,
        esCallbacks,
    }: {
        searchService: SearchService;
        metricService: MetricService;
        esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
    }) {
        this.searchService = searchService;
        this.metricService = metricService;
        this.esCallbacks = esCallbacks;
    }

    async encryptedSearch(setResultsList: ESSetResultsList<ESBaseMessage, ESMessageContent>) {
        const { isSearch, esSearchParams } = this.esCallbacks.getSearchParams();
        if (!isSearch || !esSearchParams) {
            return false;
        }
        if (this.lastSearch?.canServe(esSearchParams)) {
            // `useApplyEncryptedSearch` invokes this more than once for the same query (each run first
            // re-dispatches a pending state), so — like the legacy `useEncryptedSearch` — every call must
            // end by handing the current results to `setResultsList`. Otherwise the second call leaves the
            // list showing the pending state with no results ever arriving.
            if (this.lastSearch.results) {
                setResultsList(this.lastSearch.results);
            }
            // The same search can now serve a different list (e.g. toggling the Unread filter, which the
            // element list applies itself), so results streamed or re-emitted from now on go to this call's
            // `setResultsList`, not to the one the search started with.
            this.coalescedResults?.cancel();
            this.coalescedResults = new FrameCoalescer(setResultsList);
        } else {
            this.lastSearch?.dispose();
            this.coalescedResults?.cancel();
            this.lastSearch = this.searchService.search(esSearchParams);
            // Content search streams a full snapshot per bucket; coalesce those to one dispatch per
            // frame so a large query doesn't flood the store with hundreds of synchronous updates.
            this.coalescedResults = new FrameCoalescer(setResultsList);
            this.lastSearch.onResults.subscribe((results) => this.coalescedResults?.schedule(results));
            // waits for an error before the first results.
            // needed because of the awkward error handling model in
            // useApplyEncryptedSearch that mixes a streaming model
            // for results but still awaits for errors.
            // if we change that, we can also get rid of this
            // and the onDisposed event on Search.
            let outcome;
            try {
                outcome = await errorBeforeFirstResults(this.lastSearch);
            } catch (err) {
                this.lastSearch = undefined;
                this.coalescedResults?.cancel();
                throw err;
            }
            if (outcome === 'no-index') {
                // There was no index to query, so nothing was searched and nothing was reported.
                // Hand the query to the server, and keep no search around — otherwise the next
                // identical query would take the `canServe` path above and return its empty state.
                this.lastSearch = undefined;
                this.coalescedResults?.cancel();
                return false;
            }
            if (outcome === 'completed') {
                const resultCount = this.lastSearch.results?.length ?? 0;
                this.metricService.searchCompleted({
                    hasResults: resultCount > 0,
                    status: 'success',
                    resultCount,
                });
            }
        }
        return true;
    }

    isSearchResult(ID: string) {
        const { isSearch } = this.esCallbacks.getSearchParams();
        if (!isSearch) {
            return false;
        }
        return !!this.lastSearch?.containsMessage(ID);
    }

    leaveSearch() {
        this.lastSearch?.dispose();
        this.lastSearch = undefined;
        this.coalescedResults?.cancel();
    }
}
