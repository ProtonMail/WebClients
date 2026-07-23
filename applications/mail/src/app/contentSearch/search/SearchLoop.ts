import type {
    CollectionCardinality,
    Engine,
    Expression,
    QueryEvent,
    QueryOptions,
    Search,
} from '@proton/proton-foundation-search';
import { QueryEventKind } from '@proton/proton-foundation-search';

import type { OpenBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { isLoadEvent } from '../utils/eventTypeGuards';

export class SearchLoop {
    private search?: Search;
    private cardinality?: CollectionCardinality;

    constructor(
        private readonly engine: Engine,
        private readonly blobTxn: OpenBlobTransaction,
        private readonly exp: Expression,
        private readonly queryOptions: QueryOptions
    ) {}

    public runUntilCardinality(abortSignal: AbortSignal) {
        return this.run(true, abortSignal);
    }

    public async continueAfterCardinality(abortSignal: AbortSignal): Promise<string[]> {
        if (!this.cardinality) {
            throw new Error('Missing cardinality');
        }
        const { hits } = await this.run(false, abortSignal);

        return hits || [];
    }

    public async runBucketedSearch(range: { low: bigint; high: bigint }, abortSignal: AbortSignal): Promise<string[]> {
        if (this.search) {
            throw new Error('Search already created');
        }

        performance.mark('search-bucket-start');
        this.queryOptions.setRangeLookup(range.low, range.high);
        const { hits } = await this.run(false, abortSignal);

        performance.measure('search-bucket', {
            start: 'search-bucket-start',
            detail: {
                hits: hits?.length,
                low: range.low.toString(),
                high: range.high.toString(),
            },
        });
        return hits || [];
    }

    private async run(
        stopAtCardinality: boolean,
        abortSignal: AbortSignal
    ): Promise<{
        hits?: string[] | undefined;
        cardinality?: CollectionCardinality | undefined;
    }> {
        if (!this.search) {
            this.search = this.engine
                .query()
                .withStructuredExpression(this.exp)
                .withOptions(this.queryOptions)
                .search();
        }

        const hits: string[] = [];
        let event: QueryEvent | undefined;
        try {
            while ((event = this.search.next())) {
                abortSignal.throwIfAborted();
                if (isLoadEvent(event)) {
                    performance.mark('search-foundation-read-blob');
                    await this.blobTxn.handleLoadEvent(event);
                } else if (event.kind() === QueryEventKind.Found) {
                    performance.mark('search-foundation-result-found');
                    const id = event.found()?.identifier();
                    if (id) {
                        hits.push(id);
                    }
                } else if (event.kind() === QueryEventKind.Cardinality) {
                    if (stopAtCardinality) {
                        const cardinality = event.cardinality();
                        this.cardinality = cardinality;
                        return { cardinality };
                    }
                }
                abortSignal.throwIfAborted();
            }
        } catch (e) {
            if (stopAtCardinality) {
                this.dispose();
                throw e;
            }
        } finally {
            if (!stopAtCardinality) {
                this.dispose();
            }
        }

        return { hits };
    }

    public dispose() {
        this.search?.free();
        this.cardinality?.free();
        this.search = undefined;
    }
}
