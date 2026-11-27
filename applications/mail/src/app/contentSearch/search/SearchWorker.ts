import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import type { Engine } from '@proton/proton-foundation-search';

import { openContentSearchDB } from '../db/open';
import { createMailSearchEngine } from '../engine/create';
import { initWasm } from '../init';
import { IndexReader } from './IndexReader';
import { buildQuery } from './query';

export default class SearchWorker {
    private reader?: IndexReader;
    /** the reader's, for as long as the worker lives */
    private engine?: Engine;
    private initPromise?: Promise<void>;
    private abortController?: AbortController;

    /** `onConnectionClosed` is called when the reader's connection is closed, after which every search fails. */
    async init(userId: string, indexKey: CryptoKey, onConnectionClosed: () => void): Promise<void> {
        // NOTE: if we ever use the reader here,
        // we also need to guard worker.init with the dbLock in Search.ts
        this.initPromise = (async () => {
            await initWasm();
            const db = await openContentSearchDB(userId, () => {
                void onConnectionClosed();
            });
            this.engine?.free();
            this.engine = createMailSearchEngine();
            this.reader = new IndexReader(db, indexKey, this.engine);
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

    /**
     * The query `params` run as, in the query language: what a search sends the leader's index worker to be told
     * about the messages it writes that match (see `OpenSearchMatcher`), without loading the engine in the tab.
     */
    getExpression(params: NormalizedSearchParams): string {
        const expression = buildQuery(params);
        try {
            return expression.toString();
        } finally {
            expression.free();
        }
    }

    /**
     * `resultCallback` is a Comlink proxy: its calls go over their own port, so without waiting for them the
     * reply of this method could reach the main thread before the results, which closes the database once
     * the search is done. Across Comlink, each call returns a promise that resolves once the main thread has
     * handled it.
     */
    async search(params: NormalizedSearchParams, resultCallback: (results: string[]) => Promise<void>): Promise<void> {
        // if search is already running, abort it as we won't use the results anymore
        this.abortController?.abort();
        const reader = await this.getReader();
        const expression = buildQuery(params);
        const abortController = new AbortController();
        this.abortController = abortController;
        const deliveries: Promise<void>[] = [];
        try {
            await reader.search(
                expression,
                (results) => {
                    deliveries.push(resultCallback(results));
                },
                this.abortController.signal,
                { oldestFirst: params.sort.sort === 'Time' && !params.sort.desc }
            );
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                throw err;
            }
        } finally {
            if (this.abortController === abortController) {
                this.abortController = undefined;
            }
            // Also when aborted or failing: batches sent before that are still on their way.
            await Promise.allSettled(deliveries);
        }
    }
}
