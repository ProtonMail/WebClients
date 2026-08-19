import type { MutableRefObject } from 'react';

import { defaultESContext, defaultESStatus } from '@proton/encrypted-search/constants';
import { highlightJSX, insertMarks } from '@proton/encrypted-search/esHelpers';
import type {
    ESCallbacks,
    ESEvent,
    ESSetResultsList,
    ESTimepoint,
    EncryptedSearchFunctions,
    NormalizedSearchParams,
} from '@proton/encrypted-search/models';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';

import type { IndexService } from '../indexation/IndexService';
import type { Search } from '../search/Search';
import type { SearchService } from '../search/SearchService';

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

function errorBeforeFirstResults(search: Search): Promise<void> {
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
                resolve();
            }),
        ];

        void search.done.finally(() => {
            unsubscribe();
            resolve();
        });
    });
}

type Functions = EncryptedSearchFunctions<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;

/**
 * Adapts the content-search-v2 index to the {@link EncryptedSearchFunctions} surface so it can be
 * swapped in behind the `ContentSearch` feature flag (see `useContentSearch` / `EncryptedSearchProvider`).
 */
export class ESAdapter implements Functions {
    private lastSearch?: Search;
    private coalescedResults?: FrameCoalescer<Parameters<ESSetResultsList<ESBaseMessage, ESMessageContent>>>;

    progressRecorderRef: MutableRefObject<ESTimepoint> = { current: [0, 0] };

    esIndexingProgressState = defaultESContext.esIndexingProgressState;

    // Report the index as present and enabled so search is actually attempted; the v2 index
    // lifecycle is managed elsewhere, not by this adapter.
    esStatus: Functions['esStatus'] = {
        ...defaultESStatus,
        dbExists: true,
        esEnabled: true,
        contentIndexingDone: true,
    };

    constructor(
        private readonly searchService: SearchService,
        private readonly indexService: IndexService,
        /** Per-render dependency, refreshed by `useContentSearch` — provides getSearchParams/getKeywords. */
        public esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>,
        /** Per-render dependency, refreshed by `useContentSearch` — the legacy `useEncryptedSearch` instance. */
        public esLibraryFunctionsV1: Functions
    ) {}

    async cacheIndexedDB() {
        // `cacheIndexedDB` is the legacy ES warmup hook; the search UI already calls it when the user
        // opens the search box (see `MailSearch.handleOpen`). We repurpose it to spin up the v2 worker
        // ahead of time, so the cold start overlaps with the user typing their query instead of being
        // paid on the first search.

        // we can't have concurrent access to the index,
        // so we need to stop indexing before we can search.
        this.indexService.currentImport?.stop();
        await this.searchService.warmUp();
    }

    async encryptedSearch(setResultsList: ESSetResultsList<ESBaseMessage, ESMessageContent>) {
        const { isSearch, esSearchParams } = this.esCallbacks.getSearchParams();
        if (!isSearch || !esSearchParams) {
            return false;
        }
        if (this.lastSearch?.update(esSearchParams)) {
            // `useApplyEncryptedSearch` invokes this more than once for the same query (each run first
            // re-dispatches a pending state), so — like the legacy `useEncryptedSearch` — every call must
            // end by handing the current results to `setResultsList`. Otherwise the second call leaves the
            // list showing the pending state with no results ever arriving.
            if (this.lastSearch.results) {
                setResultsList(this.lastSearch.results);
            }
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
            await errorBeforeFirstResults(this.lastSearch);
        }
        return true;
    }

    // Highlighting is purely keyword-driven (no index access), so it is ported verbatim from
    // `useEncryptedSearch`: pull the keywords from the current search params and delegate to the
    // shared `insertMarks` / `highlightJSX` helpers.
    shouldHighlight() {
        const { isSearch, esSearchParams } = this.esCallbacks.getSearchParams();
        if (!isSearch || !esSearchParams) {
            return false;
        }

        const keywords = this.esCallbacks.getKeywords(esSearchParams);

        return typeof keywords !== 'undefined' && !!keywords.length;
    }

    highlightString(content: string, setAutoScroll: boolean) {
        const { esSearchParams } = this.esCallbacks.getSearchParams();
        if (!esSearchParams) {
            return content;
        }

        const keywords = this.esCallbacks.getKeywords(esSearchParams);
        if (!keywords) {
            return content;
        }

        return insertMarks(content, keywords, setAutoScroll);
    }

    highlightMetadata(metadata: string, isBold?: boolean, trim?: boolean) {
        const noData = {
            numOccurrences: 0,
            resultJSX: <span>{metadata}</span>,
        };

        const { esSearchParams } = this.esCallbacks.getSearchParams();
        if (!esSearchParams) {
            return noData;
        }

        const keywords = this.esCallbacks.getKeywords(esSearchParams);
        if (!keywords) {
            return noData;
        }

        return highlightJSX(metadata, keywords, isBold, trim);
    }

    async handleEvent(event: ESEvent<ESBaseMessage> | undefined) {
        await this.esLibraryFunctionsV1.handleEvent(event);
        if (event) {
            await this.indexService.handleEvent(event);
        }
    }

    enableEncryptedSearch(options?: {
        isRefreshed?: boolean;
        isBackgroundIndexing?: boolean;
        showErrorNotification?: boolean;
        notify?: boolean;
    }) {
        return this.esLibraryFunctionsV1.enableEncryptedSearch(options);
    }

    enableContentSearch(options?: { isRefreshed?: boolean; isBackgroundIndexing?: boolean; notify?: boolean }) {
        return this.esLibraryFunctionsV1.enableContentSearch(options);
    }

    isSearchResult(ID: string) {
        const { isSearch } = this.esCallbacks.getSearchParams();
        if (!isSearch) {
            return false;
        }
        return !!this.lastSearch?.containsMessage(ID);
    }

    async esDelete() {
        await this.esLibraryFunctionsV1.esDelete();
    }

    initializeES() {
        return this.esLibraryFunctionsV1.initializeES();
    }

    pauseContentIndexing() {
        return this.esLibraryFunctionsV1.pauseContentIndexing();
    }

    pauseMetadataIndexing() {
        return this.esLibraryFunctionsV1.pauseMetadataIndexing();
    }

    correctDecryptionErrors() {
        return this.esLibraryFunctionsV1.correctDecryptionErrors();
    }

    toggleEncryptedSearch() {
        return this.esLibraryFunctionsV1.toggleEncryptedSearch();
    }

    getCache() {
        return new Map();
    }

    leaveSearch() {
        this.lastSearch?.dispose();
        this.lastSearch = undefined;
        this.coalescedResults?.cancel();
    }

    resetCache() {}
}
