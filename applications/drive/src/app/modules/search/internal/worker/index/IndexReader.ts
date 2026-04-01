import type { Engine, Query, QueryEvent } from '@proton/proton-foundation-search';
import { QueryEventKind } from '@proton/proton-foundation-search';

import { SearchLibraryError } from '../../shared/errors';
import type { IndexBlobStore } from './IndexBlobStore';

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
    async *execute(configureQuery: (query: Query) => Query): AsyncGenerator<ReadResult> {
        const search = configureQuery(this.engine.query()).search();

        try {
            let event: QueryEvent | undefined;
            while ((event = search.next()) !== undefined) {
                switch (event.kind()) {
                    case QueryEventKind.Load:
                        try {
                            await this.blobStore.loadEvent(event);
                        } catch (e) {
                            throw new SearchLibraryError('IndexReader: failed to load blob during query', e);
                        }
                        break;
                    case QueryEventKind.Found: {
                        const found = event.found();
                        if (found) {
                            const score = found.score();
                            // TODO: Add matches to the yield ReadResult when available from foundation team.
                            // https://gitlab.protontech.ch/backend-team/foundation-team/search/-/merge_requests/364
                            yield { identifier: found.identifier(), score: score.value() };
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
            search.free();
        }
    }
}
