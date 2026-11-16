import type {
    CollectionCardinality,
    Engine,
    Expression,
    QueryOptions,
    ResultSet,
    SearchEvent,
    SearchRun,
} from '@proton/proton-foundation-search';
import { SearchEventKind } from '@proton/proton-foundation-search';

import type { OpenBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { isLoadEvent } from '../utils/eventTypeGuards';

export class SearchLoop {
    private searchRun?: SearchRun;
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
        if (this.searchRun) {
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
        if (!this.searchRun) {
            this.searchRun = this.engine
                .query()
                .withStructuredExpression(this.exp)
                .withOptions(this.queryOptions)
                .run();
        }

        const hits: string[] = [];
        let event: SearchEvent | undefined;
        try {
            while ((event = this.searchRun.next())) {
                abortSignal.throwIfAborted();
                if (isLoadEvent(event)) {
                    performance.mark('search-foundation-read-blob');
                    await this.blobTxn.handleLoadEvent(event);
                } else if (event.kind() === SearchEventKind.Results) {
                    performance.mark('search-foundation-results');
                    const resultSet = event.results();
                    if (resultSet) {
                        hits.push(...SearchLoop.takeIdentifiers(resultSet));
                    }
                } else if (event.kind() === SearchEventKind.Cardinality) {
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

    private static takeIdentifiers(resultSet: ResultSet): string[] {
        try {
            return resultSet.results().map((entry) => {
                try {
                    return entry.identifier();
                } finally {
                    entry.free();
                }
            });
        } finally {
            resultSet.free();
        }
    }

    public dispose() {
        this.searchRun?.free();
        this.cardinality?.free();
        this.searchRun = undefined;
    }
}
