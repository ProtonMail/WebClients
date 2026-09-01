import * as Comlink from 'comlink';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { getIndexKey } from '../crypto/indexKey';
import type { DatabaseLock } from '../db/DatabaseLock';
import { openContentSearchDB } from '../db/open';
import { EncryptedSearchReader } from '../import/EncryptedSearchReader';
import type { Logger } from '../utils/logger';
import { Search } from './Search';
import type SearchWorker from './SearchWorker';

/** public interface into search functionality */
export class SearchService {
    private workerReadyPromise: Promise<Comlink.Remote<SearchWorker> | undefined> | undefined;

    constructor(
        private readonly userId: string,
        private readonly getUserKeys: () => Promise<DecryptedKey[]>,
        private readonly dbLock: DatabaseLock,
        private readonly logger: Logger
    ) {}

    /**
     * Warm up the worker ahead of the first search — e.g. when the user opens the search box —
     * so the cold start cost (spawning the worker, opening the DB, deriving the index key) is paid
     * before they submit their query. Idempotent: a no-op once the worker is ready.
     */
    async warmUp() {
        await this.getWorker();
    }

    search(params: NormalizedSearchParams): Search {
        const search = new Search(params, this.dbLock, this.getWorker(), this.logger, async () =>
            EncryptedSearchReader.open(this.userId, await this.getUserKeys())
        );
        search.start();
        return search;
    }

    private getWorker(): Promise<Comlink.Remote<SearchWorker> | undefined> {
        if (!this.workerReadyPromise) {
            this.workerReadyPromise = this.createAndInitNewWorkerInstance()
                .then((worker) => {
                    // "There is no index yet" is a moment in time, not a result to cache. The v2
                    // database and its key are created by the first import, and the warm-up usually
                    // runs before that — the indexing progress is shown *inside* the search dropdown,
                    // so the dropdown tends to be open while the index is still being built. Caching
                    // that would leave every search for the rest of the session answering from no
                    // index at all, long after the import has finished.
                    if (!worker) {
                        this.workerReadyPromise = undefined;
                    }
                    return worker;
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

    private async createAndInitNewWorkerInstance(): Promise<Comlink.Remote<SearchWorker> | undefined> {
        performance.mark('search-get-worker-start');
        const indexKey = await this.getIndexKey();
        // the index doesn't exist yet
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
            return worker;
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
