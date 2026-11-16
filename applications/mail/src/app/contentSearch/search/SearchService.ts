import * as Comlink from 'comlink';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';

import { getIndexKey } from '../crypto/indexKey';
import type { DatabaseLock } from '../db/DatabaseLock';
import { openContentSearchDB } from '../db/open';
import type { MetricService } from '../metrics/MetricService';
import type { ContentSearchEndReason } from '../metrics/interface';
import type { Logger } from '../utils/logger';
import { Search, type SearchOutcome } from './Search';
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

/** public interface into search functionality */
export class SearchService {
    private workerReadyPromise:
        | Promise<{ worker: Comlink.Remote<SearchWorker>; indexKey: CryptoKey } | undefined>
        | undefined;
    /** The most recent search; only its completion is reported — see `search()`. */
    private currentSearch: Search | undefined;

    constructor(
        private readonly userId: string,
        private readonly getUserKeys: () => Promise<DecryptedKey[]>,
        private readonly dbLock: DatabaseLock,
        private readonly logger: Logger,
        private readonly metricService: MetricService,
        private readonly useV2Indexing: boolean
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
        const search = new Search(params, this.dbLock, workerCacheParamsPromise, this.userId, this.logger);
        search.start();
        this.currentSearch = search;
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

    private async createAndInitNewWorkerInstance() {
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
            await worker.init(this.userId, indexKey);
            performance.measure('search-get-worker', 'search-get-worker-start');
            // return the worker, but also the index key for the message cache since we have it already
            return { worker, indexKey };
        } catch (error) {
            rawWorker.terminate();
            throw error;
        }
    }

    private async getIndexKey() {
        const db = await openContentSearchDB(this.userId);
        try {
            return await getIndexKey(db, await this.getUserKeys());
        } finally {
            // Always release the DB connection, even if key derivation throws.
            db.close();
        }
    }
}
