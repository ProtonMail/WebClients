/**
 * Maximum token length accepted by the search engine's text processor.
 * Filenames (after stripping special characters) longer than this will have
 * their text tokens silently dropped by the WASM engine. We use this value
 * both when configuring the ProcessorConfig and when validating filenames
 * at index time.
 */
export const MAX_SEARCHABLE_FILENAME_LENGTH = 255;
