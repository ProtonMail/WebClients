/**
 * Bumped only when a `@proton/proton-foundation-search` upgrade changes the WASM
 * engine's on-disk blob format. Checked against the persisted value on bootstrap
 * (SearchDB.ensureCompatibleBlobVersion) - a mismatch wipes the index so the new
 * engine never has to deserialize an old-format blob.
 *
 * History (bump number -> npm version that required it):
 * - 1: 2.0.0-preview2-job33841442
 * - 2: 2.0.0-rc1
 * - [add your new version / npm version here]
 */
export const SEARCH_LIBRARY_BLOB_VERSION = '2';

/**
 * The WASM engine's `case_insensitive` defaults to `true`, which lowercases both text
 * tokens AND tag values at insert/query time. Tag values (e.g. treeEventScopeId, nodeUid)
 * must stay byte-exact or the index gets corrupted. Filenames are case-folded manually for
 * the tag attribute instead (see normalizedFilenameForTag), so this must stay `false`.
 */
export const SEARCH_ENGINE_CASE_INSENSITIVE = false;

/**
 * Maximum token length accepted by the search engine's text processor.
 * Filenames (after stripping special characters) longer than this will have
 * their text tokens silently dropped by the WASM engine. We use this value
 * both when configuring the ProcessorConfig and when validating filenames
 * at index time.
 */
export const SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH = 255;

/**
 * Text index token-bucket size. 0 (the library default) starts a fresh bucket per transaction;
 * a larger value reuses a bucket across commits until full, keeping blobs above a minimum size
 * instead of writing one tiny blob per commit.
 */
export const SEARCH_ENGINE_MAX_TOKEN_BUCKET_SIZE = 10_000;

/**
 * Maximum number of decoded WASM blobs (Cached objects) IndexBlobStore keeps resident per index.
 * A backstop against unbounded WASM memory growth on write paths that can save many blobs before
 * an interleaved cleanup gets a chance to run (see the incremental-update OOM investigation).
 * This is a count-based proxy, not a byte budget - blob size is not uniform and was observed to
 * grow with accumulated write history, so this does not translate to a fixed memory ceiling.
 * Kept close to normal steady-state (~7-13 blobs) and well below the size that preceded a real
 * production WASM allocator-abort crash (~417 blobs / ~500MB).
 */
export const SEARCH_BLOB_CACHE_MAX_ENTRIES = 20;

/**
 * Hard ceiling on the number of documents held in a single index. The cost being bounded is
 * indexing time, not disk or memory: commit time grows super-linearly with the number of
 * documents already in the index (measured), while per-entry size is ~constant, so document
 * count is the usable proxy for "how expensive is the next commit". The initial walk hard-stops
 * here and the index is flagged partial rather than walking (and paying for) the rest of the tree.
 */
export const SEARCH_MAX_INDEXED_DOCUMENTS = 50_000;

/**
 * Eviction thresholds as ratios of SEARCH_MAX_INDEXED_DOCUMENTS, so raising the cap needs one
 * edit. Eviction triggers once the index exceeds 115% of the cap (57_500) and removes a fixed 15%
 * of the cap (7_500) per sweep, landing back around 50_000. The 15% band is the hysteresis: one
 * sweep per ~7_500 net insertions, not one per insert.
 */
export const SEARCH_EVICTION_TRIGGER_RATIO = 1.15;
export const SEARCH_EVICTION_REMOVAL_RATIO = 0.15;

/**
 * Number of buckets in the recency histogram eviction uses to pick a removal threshold without a
 * sort API (the search engine has none). Buckets are equal-width over a fixed [0, now] epoch-ms
 * range rather than the swept index's own recency span, so one streaming pass suffices - sizing
 * buckets to the observed span would need a prior pass just to find the min and max. At 4096
 * buckets that is ~5 days per bucket, fine enough against the eviction hysteresis band; entries
 * closer together than one bucket tie, and which of a tied bucket's entries get evicted (up to
 * the per-run removal cap) is deliberately unspecified.
 */
export const SEARCH_EVICTION_HISTOGRAM_BUCKETS = 4096;

/** Minimum interval between two eviction sweeps for the same index, to bound worst-case cost. */
export const SEARCH_EVICTION_MIN_INTERVAL_MS = 5 * 60 * 1000;

/** Maximum number of documents a single eviction sweep will remove, regardless of how far over
 * the cap the index is. Bounds one sweep's cost; a larger overshoot converges over several sweeps
 * instead of one very long one. Must stay above SEARCH_EVICTION_REMOVAL_RATIO * cap (7_500 at the
 * current cap): this is a defensive ceiling against a future mis-set ratio, not meant to actively
 * clamp the per-sweep removal - if it does, the index settles above the ~50_000 documented above,
 * since one sweep would remove less than what re-crossing the trigger implies. */
export const SEARCH_EVICTION_MAX_REMOVALS_PER_RUN = 10_000;
