import type { Query } from '@proton/proton-foundation-search';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import type { AttributeFilter, SearchQuery, SearchResultItem } from '../../shared/types';
import { IndexKind, type IndexRegistry } from '../index/IndexRegistry';

// TODO: Rename to indices instead of engines.
let activeEngines: IndexKind[] = [IndexKind.MAIN];

/** Exposed for tests only. */
export function setActiveEnginesForTests(engines: IndexKind[]) {
    activeEngines = engines;
}

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
        for (const kind of activeEngines) {
            yield* this.searchEngine(kind, query);
        }
    }

    private async *searchEngine(kind: IndexKind, query: SearchQuery): AsyncGenerator<SearchResultItem> {
        const { indexReader } = await this.indexRegistry.get(kind, this.db);
        for await (const result of indexReader.execute((q) => this.buildFilenameSearchQuery(query, q))) {
            yield { nodeUid: result.identifier, score: result.score, indexKind: kind };
        }
    }

    /**
     * Build a wildcard match on the "filename" attribute, optionally ANDed with exact-match
     * attribute filters (e.g. nodeType, indexPopulatorGeneration).
     */
    private buildFilenameSearchQuery(query: SearchQuery, wasmQuery: Query): Query {
        // Exact substring match on the raw filename tag (*query*) — handles short tokens
        // and special characters that the text processor would drop or stem.
        const tagMatch = Expression.attr('filename', Func.Matches, TermValue.wild().then(query.filename).wildcard());
        // Fuzzy match on the tokenized filename text (query*) — handles stemming and
        // trigram matching for queries of 3+ characters.
        const textMatch = Expression.attr('filenameText', Func.Matches, TermValue.text(query.filename).wildcard());
        let expr = textMatch.or(tagMatch);
        if (query.filters) {
            for (const [name, attrValue] of Object.entries(query.filters)) {
                expr = expr.and(Expression.attr(name, Func.Equals, this.toTermValue(attrValue)));
            }
        }

        return wasmQuery.withStructuredExpression(expr);
    }

    private toTermValue(value: AttributeFilter): TermValue {
        if (typeof value === 'string') {
            return TermValue.text(value);
        }
        if (typeof value === 'bigint') {
            return TermValue.int(value);
        }
        return TermValue.bool(value);
    }
}
