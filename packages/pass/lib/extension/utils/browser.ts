import { PASS_CHROME_URL, PASS_FIREFOX_URL } from '@proton/pass/constants';
import type { Browser } from '@proton/pass/types/browser';

const global = globalThis as any;

/*  Based on https://github.com/mozilla/webextension-polyfill Chrome check */
export const detectBrowser = (): Browser =>
    typeof global.browser === 'undefined' || Object.getPrototypeOf(global.browser) !== Object.prototype
        ? 'chrome'
        : 'firefox';

export const getWebStoreUrl = (): string => ({ chrome: PASS_CHROME_URL, firefox: PASS_FIREFOX_URL })[detectBrowser()];
