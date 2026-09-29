import type { Query } from '@proton/proton-foundation-search';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import type { SearchQuery, SearchResultItem } from '../../shared/types';
import { IndexKind, type IndexRegistry } from '../index/IndexRegistry';
import { normalizedFilenameForTag, normalizedFilenameForText } from '../indexer/indexEntry';

const MIN_TYPO_WORD_LENGTH = 5;
// Letters kept on each side of a gap, so a gap variant can't degrade to a one-letter anchor.
const MIN_GAP_ANCHOR = 2;

/**
 * Substring patterns (segments joined by wildcards) that match a single-word query with one typo:
 * swapped adjacent letters, one extra letter, or one missing/wrong letter (as a gap).
 * The fuzzy text index holds whole names, not words, so per-word typos are handled here instead.
 * Only letters-only words: numbers (dates, counters) would produce too many false matches.
 */
export function singleWordTypoVariants(word: string): string[][] {
    const chars = [...word];
    if (chars.length < MIN_TYPO_WORD_LENGTH || !/^\p{L}+$/u.test(word)) {
        return [];
    }
    const variants = new Map<string, string[]>();
    const add = (segments: string[]) => variants.set(segments.join('*'), segments);
    const slice = (start: number, end?: number) => chars.slice(start, end).join('');

    for (let i = 0; i < chars.length - 1; i++) {
        const swapped = [...chars];
        [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
        add([swapped.join('')]);
    }
    for (let i = 0; i < chars.length; i++) {
        add([slice(0, i) + slice(i + 1)]);
    }
    for (let i = MIN_GAP_ANCHOR; i <= chars.length - MIN_GAP_ANCHOR; i++) {
        add([slice(0, i), slice(i)]);
    }
    for (let i = MIN_GAP_ANCHOR; i < chars.length - MIN_GAP_ANCHOR; i++) {
        add([slice(0, i), slice(i + 1)]);
    }
    variants.delete(word);
    return [...variants.values()];
}

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
            // Whitespace in the query becomes a wildcard, so "final report" (*final*report*) finds
            // "final_report_v2.docx": words must appear in order, but any separator may sit between.
            const pattern = tagQuery.split(/\s+/).reduce((term, word) => term.then(word).wildcard(), TermValue.wild());
            exprs.push(Expression.attr('filenameTag', Func.Equals, pattern));

            for (const segments of singleWordTypoVariants(tagQuery)) {
                const variant = segments.reduce((term, segment) => term.then(segment).wildcard(), TermValue.wild());
                exprs.push(Expression.attr('filenameTag', Func.Equals, variant));
            }
        }
        if (textQuery.length > 0) {
            // Fuzzy trigram match on the whole stripped name - tolerates typos only when the query
            // is close to the complete name (e.g. "photo_examlpe_1_downloaded.jpg"), not single words.
            // No trailing wildcard: a wildcard term bypasses the engine's MinimumSimilarity cutoff,
            // so any single shared trigram matches (e.g. "20260908_1515 02.jpg" hit "2009-05").
            // Prefix/substring matching is already covered by the tag glob above.
            exprs.push(Expression.attr('filenameText', Func.Matches, TermValue.text(textQuery)));
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
