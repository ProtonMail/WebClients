import type { Query } from '@proton/proton-foundation-search';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import type { SearchQuery, SearchResultItem } from '../../shared/types';
import { IndexKind, type IndexRegistry } from '../index/IndexRegistry';
import { normalizedFilenameForTag } from '../indexer/indexEntry';

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
        // Normalize query the same way we normalized at index time:
        // strip all non-alphanumeric characters and lowercase.
        const normalized = normalizedFilenameForTag(query.filename);
        const hasFilename = normalized.length > 0;
        const hasFilters = query.filters && Object.keys(query.filters).length > 0;

        // Guard: a pure-special-char query (e.g. "#") with no filters normalizes
        // to empty. Returning an unfiltered query would match everything — return
        // nothing instead.
        if (!hasFilename && !hasFilters) {
            return wasmQuery;
        }

        const filenameExpr = this.buildFilenameExpression(normalized);
        const filterExprs = this.buildFilterExpressions(query.filters);
        const allExprs = [filenameExpr, ...filterExprs].filter((e): e is Expression => e !== undefined);

        const expr = allExprs.reduce((acc, e) => acc.and(e));
        return wasmQuery.withStructuredExpression(expr);
    }

    private buildFilenameExpression(normalized: string): Expression | undefined {
        if (normalized.length === 0) {
            return undefined;
        }
        // Substring match on the normalized tag (*query*) — works for any length
        // including short (< 3 char) queries, special chars, and mixed case.
        const tagMatch = Expression.attr('filename', Func.Matches, TermValue.wild().then(normalized).wildcard());
        // Fuzzy trigram match on the stripped text (query*) — adds relevance scoring
        // for longer queries via the text processor.
        const textMatch = Expression.attr('filenameText', Func.Matches, TermValue.text(normalized).wildcard());
        return textMatch.or(tagMatch);
    }

    private buildFilterExpressions(filters: SearchQuery['filters']): Expression[] {
        if (!filters) {
            return [];
        }
        return Object.entries(filters).map(([name, value]) => {
            let term: TermValue;
            if (typeof value === 'string') {
                term = TermValue.text(value);
            } else if (typeof value === 'bigint') {
                term = TermValue.int(value);
            } else {
                term = TermValue.bool(value);
            }
            return Expression.attr(name, Func.Equals, term);
        });
    }
}
