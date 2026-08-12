import type { Engine, Query, QueryEvent } from '@proton/proton-foundation-search';
import { QueryEventKind } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';
import type { IndexBlobStore } from './IndexBlobStore';
import { engineStream } from './engineCall';

export type ReadResult = {
    identifier: string;
    score: number;
};

/**
 * Issues read queries against a single WASM search engine.
 * Symmetric counterpart to IndexWriter.
 *
 * WASM supports concurrent read handles while a write is in progress.
 */
export class IndexReader {
    constructor(
        private readonly engine: Engine,
        private readonly blobStore: IndexBlobStore
    ) {}

    /**
     * Execute a query built by the caller and yield matching results.
     */
    execute(configureQuery: (query: Query) => Query): AsyncGenerator<ReadResult> {
        return engineStream('query', () => this.executeUnguarded(configureQuery));
    }

    private async *executeUnguarded(configureQuery: (query: Query) => Query): AsyncGenerator<ReadResult> {
        // Signal the beginning of reading to avoid operations that could interrupt/corrupt this read.
        this.blobStore.beginRead();
        try {
            const search = configureQuery(this.engine.query()).search();

            const startMs = performance.now();
            let blobsLoaded = 0;
            let resultsFound = 0;
            try {
                let event: QueryEvent | undefined;
                while ((event = search.next()) !== undefined) {
                    switch (event.kind()) {
                        case QueryEventKind.Load:
                            await this.blobStore.loadEvent(event);
                            blobsLoaded++;
                            break;
                        case QueryEventKind.Found: {
                            const found = event.found();
                            if (found) {
                                const score = found.score();
                                // TODO: Add matches to the yield ReadResult when available from foundation team.
                                // https://gitlab.protontech.ch/backend-team/foundation-team/search/-/merge_requests/364
                                yield { identifier: found.identifier(), score: score.value() };
                                resultsFound++;
                                score.free();
                                found.free();
                            }
                            break;
                        }
                        case QueryEventKind.Stats:
                        default:
                            event.free();
                            break;
                    }
                }
            } finally {
                Logger.info(
                    `IndexReader: query done — ${resultsFound} UIDs found across ${blobsLoaded} blobs in ${Math.round(performance.now() - startMs)}ms`
                );
                search.free();
            }
        } finally {
            this.blobStore.endRead();
        }
    }
}
