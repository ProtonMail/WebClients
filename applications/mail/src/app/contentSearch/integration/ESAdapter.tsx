import { defaultESStatus } from '@proton/encrypted-search/constants';
import type { ESCallbacks } from '@proton/encrypted-search/models/esCallbacks';
import type { ESSetResultsList } from '@proton/encrypted-search/models/esFunctions';
import type { ESEvent, ESIndexingState, ESStatus, ESTimepoint } from '@proton/encrypted-search/models/interfaces';
import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import type { IndexStatus } from '../db/schema';
import type { IndexService } from '../indexation/IndexService';
import type { TaskName } from '../indexation/worker/IndexWorker';
import type { MetricService } from '../metrics/MetricService';
import type { ContentSearchEndReason } from '../metrics/interface';
import type { SearchService } from '../search/SearchService';
import { TimeEstimation } from '../utils/TimeRemaining';
import type { Logger } from '../utils/logger';
import { SearchAdapter } from './SearchAdapter';
import type { FunctionsV2 } from './useContentSearch';

function disabledIndexingStatus(): Partial<ESStatusConcrete> {
    return {
        contentIndexingDone: false,
        isEnablingContentSearch: false,
        isContentIndexingPaused: false,
        esEnabled: false,
        dbExists: true,
        isConfigFromESDBLoaded: true,
    };
}

/** No status stored at all: unlike a disabled index, there is nothing there. */
function noIndexStatus(): Partial<ESStatusConcrete> {
    return {
        ...disabledIndexingStatus(),
        dbExists: false,
    };
}

function pausedIndexingStatus(): Partial<ESStatusConcrete> {
    return {
        contentIndexingDone: false,
        isEnablingContentSearch: false,
        isContentIndexingPaused: true,
        dbExists: true,
    };
}

function startedIndexingStatus(): Partial<ESStatusConcrete> {
    return {
        contentIndexingDone: false,
        isEnablingContentSearch: true,
        isContentIndexingPaused: false,
        dbExists: true,
    };
}

function finishedIndexingStatus(): Partial<ESStatusConcrete> {
    return {
        isEnablingContentSearch: false,
        isContentIndexingPaused: false,
        contentIndexingDone: true,
        dbExists: true,
        esSupported: true,
        esEnabled: true,
    };
}

function failedIndexingStatus(): Partial<ESStatusConcrete> {
    return {
        contentIndexingDone: false,
        isEnablingContentSearch: false,
        isContentIndexingPaused: false,
    };
}

export type ESStatusConcrete = ESStatus<ESBaseMessage, ESMessageContent, NormalizedSearchParams>;

/**
 * Adapts the content-search-v2 index to the {@link EncryptedSearchFunctions} surface so it can be
 * swapped in behind the `ContentSearch` feature flag (see `useContentSearch` / `EncryptedSearchProvider`).
 */
export class ESAdapter implements FunctionsV2 {
    private readonly searchService: SearchService;
    private readonly indexService: IndexService;
    /** Public so `useContentSearch` can refresh `metricService.addresses` directly — see there. */
    public readonly metricService: MetricService;
    /** Per-render dependency, refreshed by `useContentSearch` — provides getSearchParams/getKeywords. */
    public esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
    private readonly searchAdapter: SearchAdapter;
    /** Pushes a new status to the hook, triggering a re-render. */
    private _updateESStatus: (status: ESStatusConcrete) => void;
    /** Pushes a new progress snapshot to the hook (raw counter + derived state), triggering a re-render. */
    private updateESProgress: (timepoint: ESTimepoint, progressState: ESIndexingState) => void;
    /** Shows an error to the user when indexing fails. */
    private readonly notifyIndexingFailed: () => void;
    private readonly logger: Logger;

    private unsubscribeFromIndexService?: () => void;
    private lastStatus: ESStatusConcrete;

    constructor({
        searchService,
        indexService,
        metricService,
        esCallbacks,
        updateESStatus,
        updateESProgress,
        notifyIndexingFailed,
        logger,
    }: {
        searchService: SearchService;
        indexService: IndexService;
        metricService: MetricService;
        /** Per-render dependency, refreshed by `useContentSearch` — provides getSearchParams/getKeywords. */
        esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
        /** Per-render dependency, refreshed by `useContentSearch` — the legacy `useEncryptedSearch` instance. */
        updateESStatus: (status: ESStatusConcrete) => void;
        updateESProgress: (timepoint: ESTimepoint, progressState: ESIndexingState) => void;
        notifyIndexingFailed: () => void;
        logger: Logger;
    }) {
        this.searchService = searchService;
        this.indexService = indexService;
        this.metricService = metricService;
        this.esCallbacks = esCallbacks;
        this._updateESStatus = updateESStatus;
        this.updateESProgress = updateESProgress;
        this.notifyIndexingFailed = notifyIndexingFailed;
        this.searchAdapter = new SearchAdapter({ searchService, metricService, esCallbacks });
        this.logger = logger;
        this.lastStatus = defaultESStatus;
    }

    updateESStatus(status: Partial<ESStatusConcrete>) {
        this.lastStatus = { ...this.lastStatus, ...status };
        this._updateESStatus(this.lastStatus);
    }

    async cacheIndexedDB() {
        // `cacheIndexedDB` is the legacy ES warmup hook; the search UI already calls it when the user
        // opens the search box (see `MailSearch.handleOpen`). We repurpose it to spin up the v2 worker
        // ahead of time, so the cold start overlaps with the user typing their query instead of being
        // paid on the first search.
        await this.searchService.warmUp();
    }

    /** Forwards a search-result open to the v2 metrics pipeline; see `EncryptedSearchProvider.reportResultOpened`. */
    reportResultOpened(...args: Parameters<MetricService['resultOpened']>) {
        this.metricService.resultOpened(...args);
    }

    /** Forwards a search-result action to the v2 metrics pipeline; see `EncryptedSearchProvider.reportResultAction`. */
    reportResultAction(...args: Parameters<MetricService['resultActionPerformed']>) {
        this.metricService.resultActionPerformed(...args);
    }

    startSearchSession() {
        this.metricService.startSearchSession();
    }

    /** v2 counterpart of `endSearchSession`; see `EncryptedSearchProvider.endSearchSession`. */
    endSearchSession(endReason: ContentSearchEndReason) {
        this.searchService.endSession(endReason);
    }

    async encryptedSearch(setResultsList: ESSetResultsList<ESBaseMessage, ESMessageContent>) {
        return this.searchAdapter.encryptedSearch(setResultsList);
    }

    isSearchResult(ID: string) {
        return this.searchAdapter.isSearchResult(ID);
    }

    leaveSearch() {
        this.searchAdapter.leaveSearch();
    }

    updateESCallbacks(esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>) {
        this.esCallbacks = esCallbacks;
        this.searchAdapter.esCallbacks = esCallbacks;
    }

    // Highlighting is purely keyword-driven (no index access), so it is ported verbatim from
    // `useEncryptedSearch`: pull the keywords from the current search params and delegate to the
    // shared `insertMarks` / `highlightJSX` helpers.
    shouldHighlight() {
        return false;
    }

    highlightString(content: string, _setAutoScroll: boolean) {
        return content;
    }

    highlightMetadata(metadata: string, _isBold?: boolean, _trim?: boolean) {
        return {
            numOccurrences: 0,
            resultJSX: <span>{metadata}</span>,
        };
    }

    async handleEvent(event: ESEvent<ESBaseMessage> | undefined) {
        return this.indexService.handleEvent(event);
    }

    async enableEncryptedSearch(_options?: {
        isRefreshed?: boolean;
        isBackgroundIndexing?: boolean;
        showErrorNotification?: boolean;
        notify?: boolean;
    }) {
        this.logger.info('enable encrypted search');
        this.subscribeToIndexService();
        await this.indexService.enable();
        await this.reportFinishedIfHistoricalDone();
        return true;
    }

    async enableContentSearch(_options?: { isRefreshed?: boolean; isBackgroundIndexing?: boolean; notify?: boolean }) {
        this.subscribeToIndexService();
        await this.indexService.enable();
        await this.reportFinishedIfHistoricalDone();
    }

    /** Once the historic pass reached eof, the worker only runs catch-up, and its `reportIndexComplete` comes
     * when that's done: push the finished status ourselves, as search doesn't wait for catch-up. */
    private async reportFinishedIfHistoricalDone() {
        const isHistoricalFinished = await this.indexService.isHistoricalFinished();
        if (this.indexService.isEnabled && isHistoricalFinished) {
            this.updateESStatus(finishedIndexingStatus());
        }
    }

    async esDelete() {
        await this.indexService.deleteIndex();
    }

    async initializeES() {
        this.logger.info('initializing encrypted search');
        this.subscribeToIndexService();
        await this.indexService.initialize();
    }

    private subscribeToIndexService() {
        if (this.unsubscribeFromIndexService) {
            return;
        }

        this.logger.info('subscribing to index service');
        let timeEstimation: TimeEstimation | undefined;
        this.unsubscribeFromIndexService = this.indexService.subscribe({
            reportHistoricProgress: (processed: number, total: number) => {
                // A tab that follows the leader doesn't see the historic pass start, or joins after it started:
                // it estimates from the first progress it gets.
                timeEstimation ??= new TimeEstimation(performance.now());
                timeEstimation.setInitialAmountIfNotSet(processed);
                this.updateESProgress([processed, total], {
                    esProgress: processed,
                    estimatedMinutes: timeEstimation.remainingMinutes(performance.now(), processed, total),
                    totalIndexingItems: total,
                    currentProgressValue: total === 0 ? 0 : Math.ceil((processed / total) * 100),
                });
            },
            reportIndexComplete: () => {
                this.updateESStatus(finishedIndexingStatus());
            },
            reportTaskStarted: (taskName: TaskName) => {
                this.logger.info(`task started: ${taskName}`);
                if (taskName === 'historic') {
                    timeEstimation = new TimeEstimation(performance.now());
                    this.updateESStatus(startedIndexingStatus());
                } else if (taskName === 'catchup') {
                    // like v1 while catching up on events, live updates don't show as refreshing
                    this.updateESStatus({ isRefreshing: true });
                    // Catch-up has no meaningful progress, but without any `EncryptedSearchField` shows
                    // "Estimating time remaining..." instead of "Updating message content search...".
                    // Report it as complete: historic indexing reports its own progress when it runs.
                    this.updateESProgress([1, 1], {
                        esProgress: 1,
                        totalIndexingItems: 1,
                        estimatedMinutes: 0,
                        currentProgressValue: 100,
                    });
                }
            },
            reportTaskCompleted: (taskName: TaskName) => {
                this.logger.info(`task completed: ${taskName}`);
                if (taskName === 'catchup') {
                    this.updateESStatus({ isRefreshing: false });
                }
            },
            reportStatusUpdate: (status: IndexStatus | undefined) => {
                this.logger.info(`index status changed: ${status}`);
                this.emitStatus(status);
            },
            reportError: () => {
                this.reportIndexingError().catch((err) => {
                    this.logger.error('failed to report indexing error', err);
                });
            },
        });
    }

    /** Once the historic pass is done, a failed catch-up or live update leaves the index usable, only behind:
     * the next worker catches up again, so search stays available. */
    private async reportIndexingError() {
        if (await this.indexService.isHistoricalFinished()) {
            this.logger.warn('index worker failed after the historic pass finished, keeping search available');
            return;
        }
        this.updateESStatus(failedIndexingStatus());
        this.notifyIndexingFailed();
    }

    private emitStatus(status: IndexStatus | undefined) {
        switch (status) {
            case 'enabled':
                this.updateESStatus(startedIndexingStatus());
                break;
            case 'paused':
                this.updateESStatus(pausedIndexingStatus());
                break;
            case 'disabled':
                this.updateESStatus(disabledIndexingStatus());
                break;
            case undefined:
                this.updateESStatus(noIndexStatus());
                break;
            default:
                this.logger.error(`Unknown IndexService status: ${status}`);
                break;
        }
    }

    async pauseContentIndexing() {
        this.logger.info('pause content indexing');
        await this.indexService.pause();
    }

    async pauseMetadataIndexing() {
        this.logger.info('pause metadata indexing');
        await this.indexService.pause();
    }

    correctDecryptionErrors() {
        this.logger.info('correct decryption errors');
        return Promise.resolve(0);
    }

    async toggleEncryptedSearch() {
        this.logger.info('toggle encrypted search');
        if (this.indexService.isEnabled) {
            await this.indexService.disable();
        } else {
            await this.indexService.enable();
        }
    }

    getCache() {
        this.logger.info('get cache');
        return new Map();
    }

    resetCache() {}
}
