import type { Query } from '@proton/proton-foundation-search';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { SearchQuery } from '../../../../types';
import { BaseSearcher } from '../../../core/searcher/BaseSearcher';

export class SearcherV1 extends BaseSearcher {
    /**
     * Builds a structured query that performs a wildcard match on the `filename` attribute.
     *
     * Given the user query `{ filename: "meeting" }`, this produces the equivalent of:
     *   filename MATCHES "*meeting*"
     */
    protected buildQuery(query: SearchQuery, searchLibraryQuery: Query): Query {
        const expression = Expression.attr('filename', Func.Matches, TermValue.text(query.filename).wildcard());
        return searchLibraryQuery.withStructuredExpression(expression);
    }
}
