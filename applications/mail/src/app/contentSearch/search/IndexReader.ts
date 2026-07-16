import type { IDBPDatabase } from 'idb';

import type { Entry, ExportEvent, Expression, QueryEvent } from '@proton/proton-foundation-search';
import { ExportEventKind, QueryEventKind, SerDes } from '@proton/proton-foundation-search';

import { BlobCache } from '../cache/BlobCache';
import { EncryptedBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import type { Database } from '../db/schema';
import { createMailSearchEngine } from '../engine/create';
import { isLoadEvent } from '../utils/eventTypeGuards';
import { createLocalSearchQueryOptions } from './queryOptions';

const BUCKET_SIZE_SECONDS = 60n * 60n * 24n;

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

    private async getQueryCardinality(txn: EncryptedBlobTransaction, exp: Expression) {
        const queryOptions = createLocalSearchQueryOptions();
        const search = this.engine.query().withStructuredExpression(exp).withOptions(queryOptions).search();

        let span: { low: bigint; high: bigint } | null = null;

        try {
            let event: QueryEvent | undefined;
            while ((event = search.next())) {
                if (isLoadEvent(event)) {
                    await txn.handleLoadEvent(event);
                } else if (event.kind() === QueryEventKind.Cardinality) {
                    const cardinality = event.cardinality()!;
                    const range = cardinality.range();
                    span = { low: range.low, high: range.high };
                    range.free();
                    cardinality.free();
                    break;
                }
            }
        } catch (e) {
            console.log(e);
        }

        return span;
    }

    async search(
        exp: Expression,
        resultCallback: (results: string[]) => void,
        abortSignal: AbortSignal
    ): Promise<void> {
        performance.mark('search-foundation-start');
        const blobCache = new BlobCache();
        const txn = await EncryptedBlobTransaction.start(blobCache, this.db, this.indexKey);

        const expression = exp.clone();
        const range = await this.getQueryCardinality(txn, expression);

        if (!range?.high || !range?.low) {
            // run regular search
            // const queryOptions = createLocalSearchQueryOptions();
            return;
        }

        let start = range.high;

        while (start - BUCKET_SIZE_SECONDS >= range.low) {
            performance.mark('search-bucket-start');
            const queryOptions = createLocalSearchQueryOptions();
            queryOptions.setRangeLookup(start - BUCKET_SIZE_SECONDS, start);

            const expression = exp.clone();
            const search = this.engine.query().withStructuredExpression(expression).withOptions(queryOptions).search();
            try {
                const hits: string[] = [];
                let event: QueryEvent | undefined;
                while ((event = search.next())) {
                    abortSignal.throwIfAborted();
                    if (isLoadEvent(event)) {
                        performance.mark('search-foundation-read-blob');
                        await txn.handleLoadEvent(event);
                    } else if (event.kind() === QueryEventKind.Found) {
                        const id = event.found()?.identifier();
                        if (id) {
                            hits.push(id);
                        }
                    }
                    abortSignal.throwIfAborted();
                }
                if (hits.length !== 0) {
                    resultCallback(hits);
                }
            } finally {
                search.free();
            }
            start -= BUCKET_SIZE_SECONDS;
            performance.measure('search-bucket', 'search-bucket-start');
        }

        blobCache.free();
        await txn.verify(this.db.transaction('config'));
        performance.measure('search-foundation', 'search-foundation-start');
    }

    close() {
        this.db.close();
    }
}
