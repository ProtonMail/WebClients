import { highlightJSX, insertMarks } from '@proton/encrypted-search/esHelpers';
import type {
    ESCallbacks,
    ESEvent,
    ESIndexingState,
    ESSetResultsList,
    ESStatus,
    ESTimepoint,
    NormalizedSearchParams,
} from '@proton/encrypted-search/models';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';

import type { IndexService } from '../indexation/IndexService';
import type { Search } from '../search/Search';
import type { SearchService } from '../search/SearchService';
import type { FunctionsV1, FunctionsV2 } from './useContentSearch';

export type ESStatusConcrete = ESStatus<ESBaseMessage, ESMessageContent, NormalizedSearchParams>;

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

/**
 * Adapts the content-search-v2 index to the {@link EncryptedSearchFunctions} surface so it can be
 * swapped in behind the `ContentSearch` feature flag (see `useContentSearch` / `EncryptedSearchProvider`).
 */
export class ESAdapter implements FunctionsV2 {
    private readonly searchService: SearchService;
    private readonly indexService: IndexService;
    /** Per-render dependency, refreshed by `useContentSearch` — provides getSearchParams/getKeywords. */
    public esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
    /** Per-render dependency, refreshed by `useContentSearch` — the legacy `useEncryptedSearch` instance. */
    public esLibraryFunctionsV1: FunctionsV1;

    private lastSearch?: Search;
    private coalescedResults?: FrameCoalescer<Parameters<ESSetResultsList<ESBaseMessage, ESMessageContent>>>;
    private isV1ContentIndexingDone = false;
    /** Pushes a new status to the hook, triggering a re-render. Called on V1 updates and, later, on self-driven ones. */
    private updateESStatus: (status: ESStatusConcrete) => void;
    /** Pushes a new progress snapshot to the hook (raw counter + derived state), triggering a re-render. */
    private updateESProgress: (timepoint: ESTimepoint, progressState: ESIndexingState) => void;

    constructor({
        searchService,
        indexService,
        esCallbacks,
        esLibraryFunctionsV1,
        updateESStatus,
        updateESProgress,
    }: {
        searchService: SearchService;
        indexService: IndexService;
        /** Per-render dependency, refreshed by `useContentSearch` — provides getSearchParams/getKeywords. */
        esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
        /** Per-render dependency, refreshed by `useContentSearch` — the legacy `useEncryptedSearch` instance. */
        esLibraryFunctionsV1: FunctionsV1;
        updateESStatus: (status: ESStatusConcrete) => void;
        updateESProgress: (timepoint: ESTimepoint, progressState: ESIndexingState) => void;
    }) {
        this.searchService = searchService;
        this.indexService = indexService;
        this.esCallbacks = esCallbacks;
        this.esLibraryFunctionsV1 = esLibraryFunctionsV1;
        this.updateESStatus = updateESStatus;
        this.updateESProgress = updateESProgress;
    }

    waitForSyncing?: (() => Promise<void>) | undefined;

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

    private get canTriggerImport(): boolean {
        return this.isV1ContentIndexingDone;
    }

    /**
     * Forward a V1 status update. Kept as an entry point (rather than reading V1 directly) so the
     * adapter can also drive status itself once it emits its own from indexService/searchService.
     */
    onV1StatusUpdate(v1Status: FunctionsV1['esStatus']) {
        const wasContentIndexingDone = this.isV1ContentIndexingDone;
        this.isV1ContentIndexingDone = v1Status?.contentIndexingDone ?? false;
        this.updateESStatus(v1Status);

        // Trigger the one-time import only on the false→true transition, not on every status update
        // once indexing is done.
        if (!wasContentIndexingDone && this.isV1ContentIndexingDone) {
            this.indexService.importFromEncryptedSearch().catch((error) => console.error(error));
        }
    }

    /** Forward a V1 progress update. Same rationale as {@link onV1StatusUpdate}. */
    onV1ProgressUpdate(timepoint: ESTimepoint, progressState: ESIndexingState) {
        this.updateESProgress(timepoint, progressState);
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
            // Record which messages the event touched so the import knows what to refresh.
            await this.indexService.handleEvent(event);
            // `handleEvent` only enqueues the ES-DB write, it doesn't await it. Wait for the syncing
            // queue to drain so the ES database actually contains this event before we pull the
            // affected messages into the v2 index — otherwise we'd import from a stale ES database.
            await this.esLibraryFunctionsV1.waitForSyncing?.();
            if (this.canTriggerImport) {
                await this.indexService.importFromEncryptedSearch().catch((err) => console.error(err));
            } else {
            }
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
