import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models';

import { openContentSearchDB } from '../db/open';
import { initWasm } from '../init';
import { IndexReader } from './IndexReader';
import { buildQuery } from './query';

export default class SearchWorker {
    private reader?: IndexReader;
    private initPromise?: Promise<void>;
    private abortController?: AbortController;

    async init(userId: string, indexKey: CryptoKey): Promise<void> {
        // NOTE: if we ever use the reader here,
        // we also need to guard worker.init with the dbLock in Search.ts
        this.initPromise = (async () => {
            await initWasm();
            const db = await openContentSearchDB(userId);
            this.reader = new IndexReader(db, indexKey);
        })();
        await this.initPromise;
        this.initPromise = undefined;
    }

    private async getReader(): Promise<IndexReader> {
        if (this.initPromise) {
            await this.initPromise;
        }
        if (!this.reader) {
            throw new Error('init not called');
        }
        return this.reader;
    }

    async search(params: NormalizedSearchParams, resultCallback: (results: string[]) => void): Promise<void> {
        // if search is already running, abort it as we won't use the results anymore
        this.abortController?.abort();
        const reader = await this.getReader();
        const expression = buildQuery(params);
        const abortController = new AbortController();
        this.abortController = abortController;
        try {
            await reader.search(expression, resultCallback, this.abortController.signal);
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                throw err;
            }
        } finally {
            if (this.abortController === abortController) {
                this.abortController = undefined;
            }
        }
    }
}
