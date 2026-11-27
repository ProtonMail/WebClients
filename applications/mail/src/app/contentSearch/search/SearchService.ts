import * as Comlink from 'comlink';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';

import { getIndexKey } from '../crypto/indexKey';
import type { DatabaseLock } from '../db/DatabaseLock';
import { openContentSearchDB } from '../db/open';
import type { MetricService } from '../metrics/MetricService';
import type { ContentSearchEndReason } from '../metrics/interface';
import type { Logger } from '../utils/logger';
import { Search, type SearchOutcome, type SubscribeToExpressionUpdates } from './Search';
import type SearchWorker from './SearchWorker';

const reportSearchOutcome = (search: Search, outcome: SearchOutcome, metricService: MetricService) => {
    if (outcome === 'no-index') {
        metricService.searchCancelled();
        return;
    }
    if (outcome === 'failed') {
        metricService.searchCompleted({ hasResults: false, status: 'error', resultCount: 0 });
        return;
    }
    const resultCount = search.results?.length ?? 0;
    metricService.searchCompleted({
        hasResults: resultCount > 0,
        status: 'success',
        resultCount,
    });
};

interface WorkerSetup {
    worker: Comlink.Remote<SearchWorker>;
    indexKey: CryptoKey;
    rawWorker: Pick<Worker, 'terminate'>;
}

/** public interface into search functionality */
export class SearchService {
    private workerReadyPromise: Promise<WorkerSetup | undefined> | undefined;
    /** The worker `workerReadyPromise` resolved to, to tell whether a closed connection belongs to it. */
    private currentRawWorker: Pick<Worker, 'terminate'> | undefined;
    /** Searches that haven't settled: a worker is only terminated once the ones that may be using it are done. */
    private readonly runningSearches = new Set<Promise<SearchOutcome>>();
    /** The most recent search; only its completion is reported — see `search()`. */
    private currentSearch: Search | undefined;

    constructor(
        private readonly userId: string,
        private readonly getUserKeys: () => Promise<DecryptedKey[]>,
        private readonly dbLock: DatabaseLock,
        private readonly logger: Logger,
        private readonly metricService: MetricService,
        private readonly useV2Indexing: boolean,
        /** See `IndexService.waitForDbReset`: the key must come from the database this session's path uses. */
        private readonly waitForDbReset: () => Promise<void>,
        /** keeps the results of the searches up to date as the index changes, when this session indexes */
        private readonly subscribeToExpressionUpdates?: SubscribeToExpressionUpdates
    ) {}

    /**
     * Warm up the worker ahead of the first search — e.g. when the user opens the search box —
     * so the cold start cost (spawning the worker, opening the DB, deriving the index key) is paid
     * before they submit their query. Idempotent: a no-op once the worker is ready.
     */
    async warmUp() {
        await this.getWorkerAndMessageCacheDeps();
    }

    search(params: NormalizedSearchParams): Search {
        const workerCacheParamsPromise = this.getWorkerAndMessageCacheDeps().then(async (result) => {
            if (!result) {
                return undefined;
            }
            const { worker, indexKey } = result;
            let userKeys: DecryptedKey[] | undefined;
            if (!this.useV2Indexing) {
                userKeys = await this.getUserKeys();
            }
            return { userKeys, indexKey, worker, useV2Indexing: this.useV2Indexing };
        });
        const search = new Search(
            params,
            this.dbLock,
            workerCacheParamsPromise,
            this.userId,
            this.logger,
            this.subscribeToExpressionUpdates
        );
        search.start();
        this.currentSearch = search;
        this.runningSearches.add(search.done);
        void search.done.finally(() => {
            this.runningSearches.delete(search.done);
        });
        this.startSearchSession();
        this.metricService.searchStarted();

        search.done
            .then((outcome) => {
                // A superseded search isn't cancelled (see `Search.dispose`) and still completes; its
                // session and start time have been replaced by the newer search's, so don't report it.
                if (search === this.currentSearch) {
                    reportSearchOutcome(search, outcome, this.metricService);
                }
            })
            .catch((err) => {
                this.logger.error('failed to report search outcome', err);
            });
        return search;
    }

    startSearchSession() {
        this.metricService.startSearchSession();
    }

    /** Ends the current session for a reason that isn't a new query — see `search()` for `'newSearch'`. */
    endSession(reason: ContentSearchEndReason) {
        this.metricService.endSearchSession(reason);
    }

    reportResultOpened(...args: Parameters<MetricService['resultOpened']>) {
        this.metricService.resultOpened(...args);
    }
    reportResultAction(...args: Parameters<MetricService['resultActionPerformed']>) {
        this.metricService.resultActionPerformed(...args);
    }

    private getWorkerAndMessageCacheDeps() {
        if (!this.workerReadyPromise) {
            this.workerReadyPromise = this.createAndInitNewWorkerInstance()
                .then((workerSetup) => {
                    // "There is no index yet" is a moment in time, not a result to cache. The v2
                    // database and its key are created by the first import, and the warm-up usually
                    // runs before that — the indexing progress is shown *inside* the search dropdown,
                    // so the dropdown tends to be open while the index is still being built. Caching
                    // that would leave every search for the rest of the session answering from no
                    // index at all, long after the import has finished.
                    if (!workerSetup) {
                        this.workerReadyPromise = undefined;
                    }
                    this.currentRawWorker = workerSetup?.rawWorker;
                    return workerSetup;
                })
                .catch((error) => {
                    // Don't cache a failed init: clear the promise so the next call (search or warmup)
                    // retries from scratch instead of replaying the cached rejection forever.
                    this.workerReadyPromise = undefined;
                    throw error;
                });
        }
        return this.workerReadyPromise;
    }

    /**
     * The worker's database connection was closed, e.g. by another tab deleting the database: every search on
     * it would fail from now on, so the next one starts a new worker. Terminating the old one waits for the
     * searches already running, as a call into a terminated worker never settles.
     */
    private onWorkerConnectionClosed(rawWorker: Pick<Worker, 'terminate'>) {
        if (this.currentRawWorker === rawWorker) {
            this.logger.info('the search worker lost its database connection, the next search starts a new one');
            this.currentRawWorker = undefined;
            this.workerReadyPromise = undefined;
        }
        void Promise.allSettled([...this.runningSearches]).then(() => {
            rawWorker.terminate();
        });
    }

    private async createAndInitNewWorkerInstance(): Promise<WorkerSetup | undefined> {
        performance.mark('search-get-worker-start');
        const indexKey = await this.getIndexKey();
        if (!indexKey) {
            return;
        }
        // Keep the raw worker so we can terminate it if init fails — otherwise a failed attempt
        // leaks a worker thread, and every retry would spawn another.
        const rawWorker = new Worker(
            new URL(/* webpackChunkName: "content-search-worker" */ 'search.worker.ts', import.meta.url)
        );
        try {
            const worker = Comlink.wrap<SearchWorker>(rawWorker);
            let connectionClosed = false;
            await worker.init(
                this.userId,
                indexKey,
                Comlink.proxy(() => {
                    connectionClosed = true;
                    this.onWorkerConnectionClosed(rawWorker);
                })
            );
            if (connectionClosed) {
                throw new Error('the search worker lost its database connection while starting');
            }
            performance.measure('search-get-worker', 'search-get-worker-start');
            // return the worker, but also the index key for the message cache since we have it already
            return { worker, indexKey, rawWorker };
        } catch (error) {
            rawWorker.terminate();
            throw error;
        }
    }

    private async getIndexKey() {
        await this.waitForDbReset();
        const db = await openContentSearchDB(this.userId);
        try {
            return await getIndexKey(db, await this.getUserKeys());
        } finally {
            // Always release the DB connection, even if key derivation throws.
            db.close();
        }
    }
}
