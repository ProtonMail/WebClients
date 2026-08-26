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
import { IndexingJob, type JobMode } from './IndexingJob';
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
    /** Set when an import failed and left the v2 index partial; searches fall back to v1 from then on. */
    private isV2IndexIncomplete = false;
    /** The current v1+v2 indexing job, if one is ongoing (a fresh index or a post-event refresh). */
    private job?: IndexingJob;
    /** Latest v1 status, kept so a job can be seeded with it (e.g. a refresh started from an event). */
    private lastV1Status?: ESStatusConcrete;
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

    /**
     * Whether the v2 index can answer searches. It can't while a fresh index is being built — it is
     * incomplete by definition until the import finishes — nor after an import failed and left it
     * partial. Searches degrade to the server in both cases, never to v1's index, so results always
     * come from either the v2 index or the API and never a mix of engines. While a job runs, the job's
     * status already keeps queries away (it reports content search as off); this guard is what covers
     * a failed import, where the status is v1's and says content search is on.
     */
    private get isV2IndexUsable(): boolean {
        return !this.isV2IndexIncomplete && this.job?.mode !== 'index';
    }

    async cacheIndexedDB() {
        // `cacheIndexedDB` is the legacy ES warmup hook; the search UI already calls it when the user
        // opens the search box (see `MailSearch.handleOpen`). We repurpose it to spin up the v2 worker
        // ahead of time, so the cold start overlaps with the user typing their query instead of being
        // paid on the first search.
        await this.searchService.warmUp();
    }

    async encryptedSearch(setResultsList: ESSetResultsList<ESBaseMessage, ESMessageContent>) {
        // Nothing to search yet — reporting failure hands the query to the server, which is the only
        // fallback: an incomplete v2 index would silently return too few results.
        if (!this.isV2IndexUsable) {
            return false;
        }
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

    private startJob(mode: JobMode) {
        if (mode === 'index') {
            // A fresh index is a new attempt at a complete v2 index, so a previous failure no longer
            // describes it — its own outcome will.
            this.isV2IndexIncomplete = false;
        }
        this.job = new IndexingJob(
            {
                indexService: this.indexService,
                initialV1Status: this.lastV1Status!,
                updateESStatus: this.updateESStatus,
                updateESProgress: this.updateESProgress,
                // Read the current v1 instance at call time — its identity changes per render.
                waitForV1Sync: () => this.esLibraryFunctionsV1.waitForSyncing?.() ?? Promise.resolve(),
                onFinished: (outcome) => {
                    this.job = undefined;
                    // A fresh index whose import failed leaves the v2 index incomplete, with nothing
                    // scheduled to complete it. Keep searches on the server for the rest of the session
                    // rather than answering from a partial index; the next startup re-drives the import
                    // and can clear this. A failed *refresh* is not disqualifying: the index is whole
                    // except for the messages one event touched, and the next event retries.
                    if (mode === 'index' && outcome === 'failed') {
                        this.isV2IndexIncomplete = true;
                    }
                },
            },
            mode
        );
    }

    /**
     * Observe a V1 status update. While an indexing job is live the job owns status (it synthesizes a
     * coherent one spanning v1 + the v2 import); otherwise we forward V1 verbatim and, at the start of
     * a fresh index, spin up the job that takes over from here.
     */
    onV1StatusUpdate(v1Status: FunctionsV1['esStatus']) {
        this.lastV1Status = v1Status;
        const wasContentIndexingDone = this.isV1ContentIndexingDone;
        this.isV1ContentIndexingDone = v1Status?.contentIndexingDone ?? false;

        // v1 wipes its own index when it hits an error it can't recover from (`dbCorruptError` ->
        // `esDelete`), which resets its status to the default: no DB, nothing indexed, i.e. "search is
        // off, enable it again". A live job would paper over that with the synthesized status it holds
        // during the v1 -> import handoff — either an "enabling" state that never completes (v1 will
        // never report `contentIndexingDone` now) or, if the import happens to end, a "done" state on
        // top of a wiped v1. So tear the job down and forward v1 verbatim, like we do when idle.
        if (this.job && !v1Status?.dbExists) {
            this.job.dispose();
            this.job = undefined;
            this.updateESStatus(v1Status);
            return;
        }

        if (this.job) {
            this.job.onV1Status(v1Status);
            return;
        }

        // Start the initial job when v1 begins content indexing, or — for an import-only session where
        // v1 was already indexed in a previous run — on the content-done false→true transition. The job
        // then drives the v1→import handoff itself.
        if (v1Status?.isEnablingContentSearch || (!wasContentIndexingDone && this.isV1ContentIndexingDone)) {
            this.startJob('index');
            this.job!.onV1Status(v1Status);
        } else {
            this.updateESStatus(v1Status);
        }
    }

    /** Observe a V1 progress update. Routed to the job while one is live, else forwarded verbatim. */
    onV1ProgressUpdate(timepoint: ESTimepoint, progressState: ESIndexingState) {
        if (this.job) {
            this.job.onV1Progress(timepoint, progressState);
        } else {
            this.updateESProgress(timepoint, progressState);
        }
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
            // Import the affected messages into the v2 index. Presented as v1's "refreshing" UI (no
            // counted bar). The job waits for v1's syncing queue to drain before importing (see
            // `waitForV1Sync`). Skip if content indexing hasn't finished yet, or if a job is already
            // live (the initial index will pick these up when it imports).
            if (this.canTriggerImport && !this.job) {
                this.startJob('refresh');
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
        // Doubles as Resume. If we paused the import ourselves, resuming it is all that's left to do —
        // v1 finished its own phase long before.
        if (this.job?.resumeImport()) {
            return Promise.resolve();
        }
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
        this.job?.dispose();
        this.job = undefined;
        await this.esLibraryFunctionsV1.esDelete();
    }

    initializeES() {
        return this.esLibraryFunctionsV1.initializeES();
    }

    pauseContentIndexing() {
        // Pausing means "stop downloading and indexing", and past the handoff the import is what's
        // doing that — v1 is done. Let the job stop it, and don't forward: v1's `pauseContentIndexing`
        // would overwrite the `ACTIVE` progress row it just wrote with `PAUSED`.
        if (this.job?.pauseImport()) {
            return Promise.resolve();
        }
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
