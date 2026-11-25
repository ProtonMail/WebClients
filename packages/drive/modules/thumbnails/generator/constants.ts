import { isIos, isWebKit } from '@proton/shared/lib/helpers/browser';

// Limits on every platform, iOS and iPadOS included.
// 10MB: the browser decodes the whole SVG in the tab, and a multi-GB one crashes it
export const MAX_SVG_SIZE_FOR_THUMBNAIL = 10 * 1024 * 1024;
// 100MB: the browser loads the whole image file into the tab to decode it, and a multi-GB one crashes it.
// Larger images also get no Media width and height unless their metadata has them.
export const MAX_IMAGE_SIZE_FOR_THUMBNAIL = 100 * 1024 * 1024;

// Extra limits on iOS and iPadOS only, on top of the ones above.
// These values are arbitrary, there is no way for now to check what would be the limit to prevent the browser from crashing.
// But they should be safe.
// TODO: Move logic to the worker to prevent app to crash
// 500MB
export const MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS = 500 * 1024 * 1024;
// 100MB
export const MAX_MEDIA_SIZE_FOR_THUMBNAIL_IOS = 100 * 1024 * 1024;

export const THUMBNAIL_GENERATION_TIMEOUT_MS = 10_000;

export const isIosDevice: boolean = isIos();
export const isWebKitDevice: boolean = isWebKit();
