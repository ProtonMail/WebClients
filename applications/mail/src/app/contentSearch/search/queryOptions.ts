import {
    Highlighting,
    ImplicitTermFunction,
    QueryOptions,
    Ranking,
    ScoringMethod,
} from '@proton/proton-foundation-search';

import { LOCAL_SEARCH_MAXIMUM_DISTANCE, LOCAL_SEARCH_MINIMUM_SIMILARITY } from '../engine/config';

/**
 * Query options for local mail search — aligned with
 * `mail-search/src/trigram_cache.rs::local_search_query_options`.
 *
 * Keeps ranking and highlighting off so queries stay on the trigram fast path.
 * Terms typed without a function stay fuzzy (`~`), as they were before 3.0 made them exact.
 */
export function createLocalSearchQueryOptions(): QueryOptions {
    const options = new QueryOptions();
    options.setMinimumSimilarity(LOCAL_SEARCH_MINIMUM_SIMILARITY);
    options.setMaximumDistance(LOCAL_SEARCH_MAXIMUM_DISTANCE);
    options.setScoringMethod(ScoringMethod.TrigramSimilarity);
    options.setImplicitTermFunction(ImplicitTermFunction.Matches);
    options.setRanking(Ranking.Off);
    options.setHighlighting(Highlighting.Off);
    return options;
}
