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
