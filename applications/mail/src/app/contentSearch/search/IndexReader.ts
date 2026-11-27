import type { IDBPDatabase } from 'idb';

import type { Engine, Entry, ExportEvent, Expression } from '@proton/proton-foundation-search';
import { ExportEventKind, SerDes } from '@proton/proton-foundation-search';

import { BlobCache } from '../cache/BlobCache';
import type { OpenBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { EncryptedBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import type { Database } from '../db/schema';
import { isLoadEvent } from '../utils/eventTypeGuards';
import { SearchLoop } from './SearchLoop';
import { createLocalSearchQueryOptions } from './queryOptions';
import { generateTimeBuckets } from './timeBuckets';

// The values are the same as what mobile has set in their codebase
const SMALLISH_CARDINALITY = 80;
const BUCKET_SIZE_SECONDS = 60n * 60n * 24n * 90n;

export class IndexReader {
    /**
     * @param engine `createMailSearchEngine()`'s, which lives in wasm memory: whoever creates it frees it, once done
     * with the reader. A writer passes the one it writes with: writes run one at a time, and it only reads between them.
     */
    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey,
        private readonly engine: Engine
    ) {}

    async count(): Promise<number> {
        let count = 0;
        await this.runExport(() => {
            count += 1;
        });
        return count;
    }

    async getAllIds(): Promise<string[]> {
        const ids: string[] = [];
        await this.runExport((entry) => {
            ids.push(entry.identifier());
        });
        return ids;
    }

    async getDocumentById(id: string): Promise<undefined | Record<string, any[]>> {
        return this.runExport((entry) => {
            if (entry.identifier() === id) {
                return JSON.parse(new TextDecoder('utf-8').decode(entry.serialize(SerDes.Json)));
            }
        });
    }

    /** note that the callback should not keep a reference to
     * any entry after runExport has finished, it will point
     * to invalid wasm memory. */
    private async runExport<T>(callback: (entry: Entry) => T | undefined): Promise<T | undefined> {
        const e = this.engine.export();
        const txn = await EncryptedBlobTransaction.start(undefined, this.db, this.indexKey);
        try {
            let event: ExportEvent | undefined;
            while ((event = e.next())) {
                if (isLoadEvent(event)) {
                    await txn.handleLoadEvent(event);
                } else if (event.kind() === ExportEventKind.Entry) {
                    const entry = event.entry();
                    if (entry) {
                        const predicateResult = callback(entry);
                        if (predicateResult !== undefined) {
                            return predicateResult;
                        }
                    }
                }
            }
        } finally {
            e.free();
        }
    }

    /**
     * @param oldestFirst walk the time buckets of a large result set from the oldest to the most recent,
     * so that the results streamed first are the ones listed first in an ascending time sort
     */
    async search(
        exp: Expression,
        resultCallback: (results: string[]) => void,
        abortSignal: AbortSignal,
        { oldestFirst = false }: { oldestFirst?: boolean } = {}
    ): Promise<void> {
        performance.mark('search-foundation-start');
        const blobCache = new BlobCache();
        const txn = await EncryptedBlobTransaction.start(blobCache, this.db, this.indexKey);

        try {
            const searchLoop = new SearchLoop(this.engine, txn, exp.clone(), createLocalSearchQueryOptions());
            const { cardinality, hits } = await searchLoop.runUntilCardinality(abortSignal);
            if (hits) {
                resultCallback(hits);
            } else if (cardinality) {
                if (cardinality.estimate().atMost <= SMALLISH_CARDINALITY) {
                    const hits = await searchLoop.continueAfterCardinality(abortSignal);
                    resultCallback(hits);
                } else {
                    const r = cardinality.range();
                    const range = { high: r.high, low: r.low };
                    searchLoop.dispose();
                    await this.runBucketedSearch(range, txn, exp, resultCallback, abortSignal, oldestFirst);
                }
            }
        } finally {
            exp.free();
            blobCache.free();
        }

        await txn.verify(this.db.transaction('config'));
        performance.measure('search-foundation', 'search-foundation-start');
    }

    /**
     * The hits of one search over the inclusive range of range keys (`Time`, in seconds) `range`, read through `txn`:
     * a caller that just wrote the index passes a transaction on the blob cache it warmed. The caller keeps owning
     * `exp`. Throws if aborted or if the search fails, rather than returning the hits found until then.
     */
    async searchRange(
        exp: Expression,
        range: { low: bigint; high: bigint },
        txn: OpenBlobTransaction,
        abortSignal: AbortSignal
    ): Promise<string[]> {
        const searchLoop = new SearchLoop(this.engine, txn, exp.clone(), createLocalSearchQueryOptions());
        return searchLoop.runBucketedSearch(range, abortSignal);
    }

    private async runBucketedSearch(
        range: { high: bigint; low: bigint },
        txn: OpenBlobTransaction,
        exp: Expression,
        resultCallback: (results: string[]) => void,
        abortSignal: AbortSignal,
        oldestFirst: boolean
    ) {
        const newestFirstBuckets = generateTimeBuckets(range.low, range.high, BUCKET_SIZE_SECONDS);
        const buckets = oldestFirst ? [...newestFirstBuckets].reverse() : newestFirstBuckets;
        let anyBucketHadHits = false;
        for (const bucket of buckets) {
            const searchLoop = new SearchLoop(this.engine, txn, exp.clone(), createLocalSearchQueryOptions());
            const hits = await searchLoop.runBucketedSearch(bucket, abortSignal);
            if (hits.length > 0) {
                anyBucketHadHits = true;
                resultCallback(hits);
            }
        }

        if (!anyBucketHadHits) {
            resultCallback([]);
        }
    }

    close() {
        this.db.close();
    }
}
