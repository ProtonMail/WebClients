export const MAX_FOLDERS_CREATED_IN_PARALLEL = 5;

/**
 * How many ongoing uploads there can be. Without http2, we cannot do more
 * than six parallel requests to one host. With http2 (which we use), there
 * is theretically no limit, but still we should make a reasonable limit
 * to not kill users device.
 */
export const MAX_UPLOAD_JOBS = 5;

// Placeholder for empty directories to preserve folder structure
export const EMPTY_FOLDER_PLACEHOLDER_FILE = '.proton-drive-keep';
export const EMPTY_FOLDER_PLACEHOLDER_MIMETYPE = 'application/x-empty-directory';
