import * as Comlink from 'comlink';

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
        this.initPromise = (async () => {
            await initWasm();
            const db = await openContentSearchDB(userId);
            this.reader = new IndexReader(db, indexKey);
        })();
        await this.initPromise;
        this.initPromise = undefined;
    }

    async search(params: NormalizedSearchParams): Promise<string[]> {
        // if search is already running, abort it as we won't use the results anymore
        this.abortController?.abort();
        if (this.initPromise) {
            await this.initPromise;
        }
        const expression = buildQuery(params);
        const abortController = new AbortController();
        this.abortController = abortController;
        try {
            return await this.reader!.search(expression, this.abortController.signal);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return [];
            }
            throw err;
        } finally {
            if (this.abortController === abortController) {
                this.abortController = undefined;
            }
        }
    }
}

Comlink.expose(new SearchWorker());
