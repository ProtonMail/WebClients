import { isIos, isSafari } from '@proton/shared/lib/helpers/browser';

// Those values are arbitrary, there is no way for now to check what would be the limit to prevent the browser from crashing.
// But they should be safe.
// TODO: Move logic to the worker to prevent app to crash
// 500MB
export const MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS = 500 * 1024 * 1024;
// 100MB
export const MAX_MEDIA_SIZE_FOR_THUMBNAIL_IOS = 100 * 1024 * 1024;

export const isIosDevice: boolean = isIos();
export const isSafariDevice: boolean = isSafari();
