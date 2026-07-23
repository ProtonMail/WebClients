import { Highlighting, QueryOptions, Ranking, ScoringMethod } from '@proton/proton-foundation-search';

import { FOUNDATION_DEFAULT_MAXIMUM_DISTANCE, LOCAL_SEARCH_MINIMUM_SIMILARITY } from '../engine/config';

/**
 * Query options for local mail search — aligned with
 * `mail-search/src/trigram_cache.rs::local_search_query_options`.
 *
 * Keeps ranking and highlighting off so queries stay on the trigram fast path.
 */
export function createLocalSearchQueryOptions(): QueryOptions {
    const options = new QueryOptions();
    options.setMinimumSimilarity(LOCAL_SEARCH_MINIMUM_SIMILARITY);
    options.setMaximumDistance(FOUNDATION_DEFAULT_MAXIMUM_DISTANCE);
    options.setScoringMethod(ScoringMethod.TrigramSimilarity);
    options.setRanking(Ranking.Off);
    options.setHighlighting(Highlighting.Off);
    return options;
}
