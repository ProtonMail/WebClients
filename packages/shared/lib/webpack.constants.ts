declare const WEBPACK_FEATURE_FLAGS: string;
// This is a definition coming from webpack. Hide behind typeof for the test env.
export const FEATURE_FLAGS = typeof WEBPACK_FEATURE_FLAGS === 'undefined' ? '' : WEBPACK_FEATURE_FLAGS;

declare const WEBPACK_APP_MODE: string;
export const APP_MODE = typeof WEBPACK_APP_MODE === 'undefined' ? '' : WEBPACK_APP_MODE;

export type AppMode = 'sso' | 'standalone';
export const appMode: AppMode = APP_MODE === 'sso' ? 'sso' : 'standalone';

declare const WEBPACK_PUBLIC_PATH: string;
export const PUBLIC_PATH = typeof WEBPACK_PUBLIC_PATH === 'undefined' ? '' : WEBPACK_PUBLIC_PATH;
