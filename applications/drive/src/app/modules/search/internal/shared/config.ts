/**
 * Maximum token length accepted by the search engine's text processor.
 * Filenames (after stripping special characters) longer than this will have
 * their text tokens silently dropped by the WASM engine. We use this value
 * both when configuring the ProcessorConfig and when validating filenames
 * at index time.
 */
export const MAX_SEARCHABLE_FILENAME_LENGTH = 255;

/**
 * Bumped only when a `@proton/proton-foundation-search` upgrade changes the WASM
 * engine's on-disk blob format. Checked against the persisted value on bootstrap
 * (SearchDB.ensureCompatibleBlobVersion) - a mismatch wipes the index so the new
 * engine never has to deserialize an old-format blob.
 *
 * History (bump number -> npm version that required it):
 * - 1: 2.0.0-preview2-job33841442
 * - [add your new version / npm version here]
 */
export const SEARCH_LIBRARY_BLOB_VERSION = '1';
