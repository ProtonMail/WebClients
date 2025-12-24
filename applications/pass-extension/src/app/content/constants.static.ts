export const OVERRIDE_STYLES_ATTR = `data-protonpass-base-css`;

export const ICON_MAX_HEIGHT = 28;
export const ICON_MIN_HEIGHT = 16;
export const ICON_PADDING = 8;

export const DROPDOWN_WIDTH = 250;
export const DROPDOWN_MIN_HEIGHT = 60;

export const NOTIFICATION_WIDTH = 320;
export const NOTIFICATION_MIN_HEIGHT = 180;
export const NOTIFICATION_HEIGHT = 350;

export const IFRAME_APP_READY_EVENT = 'PassIFrameReady';
export const CLIENT_SCRIPT_READY_EVENT = 'PassClientScriptReady';
export const PASS_ROOT_REMOVED_EVENT = 'PassRootRemoved';

/* heuristic max detection time duration in ms for sanity checking */
export const MIN_MAX_DETECTION_TIME = 250;
export const MAX_MAX_DETECTION_TIME = 1_000;

/** Delay for iframe → service worker → frame message hops (prevents focus race conditions) */
export const MESSAGE_HOP_DELAY = 15;
