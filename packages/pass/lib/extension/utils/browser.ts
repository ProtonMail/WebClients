import { PASS_CHROME_URL, PASS_FIREFOX_URL } from '@proton/pass/constants';
import { type MaybeNull } from '@proton/pass/types';
import type { Browser } from '@proton/pass/types/browser';
import { isBrave, isChrome, isEdge, isFirefox } from '@proton/shared/lib/helpers/browser';
import { Clients } from '@proton/shared/lib/pass/constants';

const global = globalThis as any;

/* Based on https://github.com/mozilla/webextension-polyfill Chrome check */
export const detectBrowser = (): Browser =>
    typeof global.browser === 'undefined' || Object.getPrototypeOf(global.browser) !== Object.prototype
        ? 'chrome'
        : 'firefox';

export const getWebStoreUrl = (): string => ({ chrome: PASS_CHROME_URL, firefox: PASS_FIREFOX_URL })[detectBrowser()];

export type SupportedExtensionClient = Clients.Chrome | Clients.Brave | Clients.Edge | Clients.Firefox;

export const getExtensionSupportedBrowser = (): MaybeNull<SupportedExtensionClient> => {
    if (isChrome()) return Clients.Chrome;
    if (isBrave()) return Clients.Brave;
    if (isEdge()) return Clients.Edge;
    if (isFirefox()) return Clients.Firefox;
    return null;
};
