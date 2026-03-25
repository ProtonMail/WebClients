import type { Query } from '@proton/proton-foundation-search';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import type { SearchQuery, SearchResultItem } from '../../shared/types';
import { IndexKind, type IndexRegistry } from '../index/IndexRegistry';

const ACTIVE_ENGINES: IndexKind[] = [IndexKind.MAIN];

/**
 * Searches across all active engines in parallel, yielding results as they arrive.
 *
 * Search bypasses the task queue entirely — Search library WASM supports concurrent read
 * handles while a write is in progress.
 */
export class SearchQueryExecutor {
    constructor(
        private readonly indexRegistry: IndexRegistry,
        private readonly db: SearchDB
    ) {}

    async *performSearch(query: SearchQuery): AsyncGenerator<SearchResultItem> {
        // TODO: When adding more engines, consider running and yielding searches in parallel.
        for (const kind of ACTIVE_ENGINES) {
            yield* this.searchEngine(kind, query);
        }
    }

    private async *searchEngine(kind: IndexKind, query: SearchQuery): AsyncGenerator<SearchResultItem> {
        const { indexReader } = await this.indexRegistry.get(kind, this.db);
        for await (const result of indexReader.execute((q) => this.buildSearchQuery(query, q))) {
            yield { nodeUid: result.identifier, score: result.score, indexKind: kind };
        }
    }

    /**
     * Build a wildcard match on the "filename" attribute.
     * e.g. query.filename = "report" → matches "report", "report.pdf", "myreport2024", etc.
     */
    private buildSearchQuery(query: SearchQuery, wasmQuery: Query): Query {
        const expression = Expression.attr('filename', Func.Matches, TermValue.text(query.filename).wildcard());
        return wasmQuery.withStructuredExpression(expression);
    }
}
