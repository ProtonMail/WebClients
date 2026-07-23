import type { Query } from '@proton/proton-foundation-search';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import type { SearchQuery, SearchResultItem } from '../../shared/types';
import { IndexKind, type IndexRegistry } from '../index/IndexRegistry';
import { normalizedFilenameForTag, normalizedFilenameForText } from '../indexer/indexEntry';

// TODO: Rename to indices instead of engines.
let activeEngines: IndexKind[] = [IndexKind.MAIN];

/** Exposed for tests only. */
export function setActiveEnginesForTests(engines: IndexKind[]) {
    activeEngines = engines;
}

/**
 * Searches across all active engines in parallel, yielding results as they arrive.
 *
 * Search bypasses the task queue entirely - Search library WASM supports concurrent read
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
     * Build a wildcard match on the "filenameTag" attribute, optionally ANDed with exact-match
     * attribute filters (e.g. nodeType, indexPopulatorGeneration).
     * Excludes trashed files.
     */
    private buildFilenameSearchQuery(query: SearchQuery, wasmQuery: Query): Query {
        // The tag path preserves special chars (lowercase only); the text path strips them for
        // the tokenizer. Trim so a trailing-space query ("my file ") doesn't build "*my file *"
        // (which would miss "my file_name"); internal spaces are preserved.
        const trimmed = query.filename.trim();
        const tagQuery = normalizedFilenameForTag(trimmed);
        const textQuery = normalizedFilenameForText(trimmed);
        const hasFilters = query.filters && Object.keys(query.filters).length > 0;

        // Guard: an empty / whitespace-only query with no filters would build a bare query that
        // matches everything - return nothing instead.
        if (trimmed.length === 0 && !hasFilters) {
            return wasmQuery;
        }

        const filenameExpr = this.buildFilenameExpression(tagQuery, textQuery);
        const filterExprs = this.buildFilterExpressions(query.filters);
        const trashExclusionExpr = Expression.attr('trashTime', Func.Equals, TermValue.int(0n));
        const allExprs = [filenameExpr, ...filterExprs, trashExclusionExpr].filter(
            (e): e is Expression => e !== undefined
        );

        const expr = allExprs.reduce((acc, e) => acc.and(e));
        return wasmQuery.withStructuredExpression(expr);
    }

    private buildFilenameExpression(tagQuery: string, textQuery: string): Expression | undefined {
        const exprs: Expression[] = [];
        if (tagQuery.length > 0) {
            // Literal substring glob on the normalized (lowercased) tag (*query*). We use
            // Func.Equals, NOT Func.Matches: on a tag, Matches tokenizes the pattern (dropping
            // special chars, splitting on spaces), whereas Equals matches the wildcard pattern
            // literally. That literal glob is what lets special characters, spaces, and short
            // (< 3 char) queries match (DRVWEB-5345). The `.then()` part is treated verbatim
            // (even a literal '*').
            exprs.push(Expression.attr('filenameTag', Func.Equals, TermValue.wild().then(tagQuery).wildcard()));
        }
        if (textQuery.length > 0) {
            // Fuzzy trigram match on the stripped text (query*) - adds relevance scoring
            // for longer queries via the text processor.
            exprs.push(Expression.attr('filenameText', Func.Matches, TermValue.text(textQuery).wildcard()));
        }
        if (exprs.length === 0) {
            return undefined;
        }
        return exprs.reduce((acc, e) => acc.or(e));
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
