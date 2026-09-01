export const BACKGROUNDS_DB_NAME = 'meet-backgrounds';
export const BACKGROUNDS_DB_VERSION = 1;

export const BACKGROUNDS_FOLDER_PATH = ['Proton Meet', 'Backgrounds'];

export const MAX_BACKGROUND_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_BACKGROUND_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const isAllowedBackgroundMediaType = (mediaType: string | undefined): mediaType is string =>
    !!mediaType && ALLOWED_BACKGROUND_MEDIA_TYPES.includes(mediaType);

export const BACKGROUND_FILE_INPUT_ACCEPT = ALLOWED_BACKGROUND_MEDIA_TYPES.join(',');

/** Covers the longest signature we match, WebP's, which ends 12 bytes in. */
export const BACKGROUND_SIGNATURE_BYTES = 16;

export const MAX_BACKGROUND_NAME_LENGTH = 255;

export const MAX_BACKGROUND_IMAGE_EDGE = 8192;

/** Decoded pixels are uncompressed RGBA, so this, not the file size, bounds a decompression bomb. */
export const MAX_BACKGROUND_IMAGE_PIXELS = 30 * 1000 * 1000;

export const BACKGROUND_IMAGE_DECODE_TIMEOUT_MS = 15_000;

export const IMAGE_CACHE_MAX_BYTES = 60 * 1024 * 1024;

export const GUEST_BACKGROUND_KEY_STORAGE_KEY = 'meet.backgrounds.guestKey';
