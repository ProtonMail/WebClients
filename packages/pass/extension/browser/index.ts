import type { Browser } from '../../types/browser';

/*
 * Based on https://github.com/mozilla/webextension-polyfill Chrome check
 */
export const detectBrowser = (): Browser => {
    const global = globalThis as any;

    return typeof global.browser === 'undefined' || Object.getPrototypeOf(global.browser) !== Object.prototype
        ? 'chrome'
        : 'firefox';
};

export const getWebStoreUrl = (browser: Browser): string => {
    return {
        chrome: 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde',
        firefox: 'https://addons.mozilla.org/en-US/firefox/addon/proton-pass/',
    }[browser];
};
