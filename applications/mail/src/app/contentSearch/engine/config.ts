/**
 * Foundation Search engine configuration for Proton Mail web.
 *
 * Mirrors `mail-search/src/engine_config.rs`.
 */

/** Upper bound for `TextIndex::maximum_token_bucket_size` when rebuilding the engine. */
// export const MAX_TOKEN_BUCKET_SIZE = 100_000;

/**
 * Default token-bucket size for new Mail search engines (monorepo production default).
 * Non-zero values reduce blob count vs the engine default of `0` (one bucket per commit).
 */
export const DEFAULT_TOKEN_BUCKET_SIZE = 50_000;

/** Delta segments before cleanup folds the cache log (mail policy; used when trigram cache is enabled). */
// export const TRIGRAM_CACHE_COMPACTION_DELTA_THRESHOLD = 30;

/**
 * Minimum similarity for local search, as `LOCAL_SEARCH_MINIMUM_SIMILARITY` in monorepo
 * `mail-search/src/local_search_options.rs`. Lower lets a full address fuzzily match another one at the same
 * domain (`dave@example.com` → `grace@example.com`).
 */
export const LOCAL_SEARCH_MINIMUM_SIMILARITY = 0.8;

/** Maximum edit distance for local search, as `LOCAL_SEARCH_MAXIMUM_DISTANCE` in monorepo `local_search_options.rs`. */
export const LOCAL_SEARCH_MAXIMUM_DISTANCE = 2;
