import type { IDBPDatabase } from 'idb';

import type { Entry, ExportEvent, Expression } from '@proton/proton-foundation-search';
import { ExportEventKind, SerDes } from '@proton/proton-foundation-search';

import { BlobCache } from '../cache/BlobCache';
import type { OpenBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { EncryptedBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import type { Database } from '../db/schema';
import { createMailSearchEngine } from '../engine/create';
import { isLoadEvent } from '../utils/eventTypeGuards';
import { SearchLoop } from './SearchLoop';
import { createLocalSearchQueryOptions } from './queryOptions';

const SMALLISH_CARDINALITY = 80;
const BUCKET_SIZE_SECONDS = 60n * 60n * 24n * 90n;

export class IndexReader {
    private readonly engine = createMailSearchEngine();

    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey
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

    async search(
        exp: Expression,
        resultCallback: (results: string[]) => void,
        abortSignal: AbortSignal
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
                    await this.runBucketedSearch(range, txn, exp, resultCallback, abortSignal);
                }
            }
        } finally {
            exp.free();
            blobCache.free();
        }

        await txn.verify(this.db.transaction('config'));
        performance.measure('search-foundation', 'search-foundation-start');
    }

    private async runBucketedSearch(
        range: { high: bigint; low: bigint },
        txn: OpenBlobTransaction,
        exp: Expression,
        resultCallback: (results: string[]) => void,
        abortSignal: AbortSignal
    ) {
        let start = range.high;
        let anyBucketHadHits = false;
        while (start - BUCKET_SIZE_SECONDS >= range.low) {
            const searchLoop = new SearchLoop(this.engine, txn, exp.clone(), createLocalSearchQueryOptions());
            const hits = await searchLoop.runBucketedSearch(
                { low: start - BUCKET_SIZE_SECONDS, high: start },
                abortSignal
            );
            if (hits.length > 0) {
                anyBucketHadHits = true;
                resultCallback(hits);
            }
            start -= BUCKET_SIZE_SECONDS;
        }

        if (!anyBucketHadHits) {
            resultCallback([]);
        }
    }

    close() {
        this.db.close();
    }
}
