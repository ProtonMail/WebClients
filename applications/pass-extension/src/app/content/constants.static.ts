export const INPUT_BASE_STYLES_ATTR = `data-protonpass-base-css`;

export const ICON_MAX_HEIGHT = 28;
export const ICON_MIN_HEIGHT = 16;
export const ICON_PADDING = 8;
export const DROPDOWN_WIDTH = 250;
export const MIN_DROPDOWN_HEIGHT = 60;
export const NOTIFICATION_HEIGHT = 335;
export const NOTIFICATION_HEIGHT_SM = 220;
export const NOTIFICATION_HEIGHT_XS = 120;
export const NOTIFICATION_WIDTH = 320;

export const IFRAME_APP_READY_EVENT = 'PassIFrameReady';
export const CLIENT_SCRIPT_READY_EVENT = 'PassClientScriptReady';
export const PASS_ROOT_REMOVED_EVENT = 'PassRootRemoved';

/* heuristic max detection time duration in ms for sanity checking */
export const MIN_MAX_DETECTION_TIME = 250;
export const MAX_MAX_DETECTION_TIME = 1_000;

/* ⚠️ WIP ⚠️
 * This list should be actively maintained
 * to list all top-level domains of email
 * providers. On sign-up forms for these
 * domains, we want to avoid prompting the
 * user for an alias creation on the email
 * field (if any). In some cases  we might
 * still permit it - ie in the case of google.com,
 * you can actually sign up with an email */
export const EMAIL_PROVIDERS = [
    'proton.me',
    'protonmail.com',
    'protonvpn.com',
    'proton.black',
    'proton.pink',
    'proton.local',
];
