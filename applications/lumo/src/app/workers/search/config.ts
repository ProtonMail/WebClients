/**
 * Bumped whenever a `@proton/proton-foundation-search` upgrade changes the WASM engine's
 * on-disk blob format. Checked against the persisted value when the engine is created:
 * on a mismatch the engine's blobs are wiped and rebuilt, because handing an old-format
 * blob to a new engine throws inside `Engine`'s `send()` with nothing to fall back to.
 *
 * History (version -> npm version that required it):
 * - 1: 2.0.0 — first marker. Indexes written by 1.1.2 carry no version, so every
 *      existing index is rebuilt once on upgrade.
 */
export const SEARCH_LIBRARY_BLOB_VERSION = '1';

/** Where the format version lives, alongside the blobs it describes. */
export const SEARCH_BLOB_VERSION_KEY = 'search_blob_version';

/**
 * Blobs in the foundation-search store that Lumo writes itself rather than the WASM
 * engine, so they outlive a format reset. `bm25_index` and `drive_manifest` back project
 * file search and would otherwise force a full re-index of every document.
 */
export const NON_ENGINE_SEARCH_BLOB_KEYS = ['search_index_key', 'bm25_index', 'drive_manifest'];
