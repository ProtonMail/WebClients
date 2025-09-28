import type { Permissions } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Unpack } from '@proton/pass/types';

export type Permission = Unpack<Permissions.Permissions['permissions']>;

export const BASIC_AUTH_PERMISSIONS: Permission[] = BUILD_TARGET === 'safari' ? [] : ['webRequestAuthProvider'];

export const WEB_REQUEST_PERMISSIONS = ((): Permission[] => {
    switch (BUILD_TARGET) {
        case 'chrome':
            return ['webRequest', 'webRequestAuthProvider'];
        case 'firefox':
            return ['webRequest', 'webRequestAuthProvider', 'webRequestBlocking'];
        default:
            return [];
    }
})();

export const CLIPBOARD_PERMISSIONS: Permission[] = ['clipboardRead', 'clipboardWrite'];

const MANIFEST = browser?.runtime.getManifest() ?? {};
const HOST_PERMISSIONS = MANIFEST.host_permissions ?? [];

export const hasPermissions = async (permissions: Permission[]): Promise<boolean> => {
    try {
        return await browser.permissions.contains({ permissions });
    } catch {
        return false;
    }
};

export const requestPermissions = async (permissions: Permission[]): Promise<boolean> => {
    try {
        return await browser.permissions.request({ permissions });
    } catch {
        return false;
    }
};

export const hasHostPermissions = async (origins: string[] = HOST_PERMISSIONS): Promise<boolean> => {
    try {
        return await browser.permissions.contains({ origins });
    } catch {
        return false;
    }
};

/** Safari permission requests may return false positives. Only manual
 * user action via Safari settings grants permissions reliably - verify
 * actual permission status after request to avoid false positives. */
export const requestHostPermissions = async (origins: string[] = HOST_PERMISSIONS): Promise<boolean> => {
    try {
        const result = await browser.permissions.request({ origins });
        return BUILD_TARGET === 'safari' && result ? await hasHostPermissions(origins) : result;
    } catch {
        return false;
    }
};
