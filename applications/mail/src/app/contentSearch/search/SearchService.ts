import * as Comlink from 'comlink';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { KeyManager } from '../crypto/KeyManager';
import { openContentSearchDB } from '../db/open';
import { EncryptedSearchReader } from '../import/EncryptedSearchReader';
import { Search } from './Search';
import type SearchWorker from './SearchWorker';

/** public interface into search functionality */
export class SearchService {
    private workerReadyPromise: Promise<Comlink.Remote<SearchWorker>> | undefined;

    constructor(
        private userId: string,
        private getUserKeys: () => Promise<DecryptedKey[]>
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
        const search = new Search(params, this.getWorker(), async () =>
            EncryptedSearchReader.open(this.userId, await this.getUserKeys())
        );
        search.start();
        return search;
    }

    private getWorker(): Promise<Comlink.Remote<SearchWorker>> {
        if (!this.workerReadyPromise) {
            this.workerReadyPromise = this.createAndInitNewWorkerInstance().catch((error) => {
                // Don't cache a failed init: clear the promise so the next call (search or warmup)
                // retries from scratch instead of replaying the cached rejection forever.
                this.workerReadyPromise = undefined;
                throw error;
            });
        }
        return this.workerReadyPromise;
    }

    private async createAndInitNewWorkerInstance(): Promise<Comlink.Remote<SearchWorker>> {
        performance.mark('search-get-worker-start');
        // Keep the raw worker so we can terminate it if init fails — otherwise a failed attempt
        // leaks a worker thread, and every retry would spawn another.
        const rawWorker = new Worker(
            new URL(/* webpackChunkName: "content-search-worker" */ 'SearchWorker.ts', import.meta.url)
        );
        try {
            const worker = Comlink.wrap<SearchWorker>(rawWorker);
            const indexKey = await this.getIndexKey();
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
            const keyManager = new KeyManager(await this.getUserKeys(), db);
            return await keyManager.getKey();
        } finally {
            // Always release the DB connection, even if key derivation throws.
            db.close();
        }
    }
}
