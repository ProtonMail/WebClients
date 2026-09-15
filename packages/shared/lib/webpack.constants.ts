declare const WEBPACK_APP_MODE: string;
const APP_MODE = typeof WEBPACK_APP_MODE === 'undefined' ? '' : WEBPACK_APP_MODE;

export type AppMode = 'sso' | 'standalone';
export const appMode: AppMode = APP_MODE === 'sso' ? 'sso' : 'standalone';

declare const WEBPACK_PUBLIC_PATH: string;
export const PUBLIC_PATH = typeof WEBPACK_PUBLIC_PATH === 'undefined' ? '' : WEBPACK_PUBLIC_PATH;
