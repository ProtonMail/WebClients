import type { Permissions } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Unpack } from '@proton/pass/types';

export type Permission = Unpack<Permissions.Permissions['permissions']>;

const manifest = browser?.runtime.getManifest();

export const PASS_PERMISSIONS: Permissions.Permissions = {
    permissions: [],
    origins: manifest?.host_permissions ?? [],
};

export const checkExtensionPermissions = async (): Promise<boolean> => {
    try {
        if (BUILD_TARGET === 'safari') {
            const permissions = await browser.permissions.getAll();
            const validOrigins = permissions.origins?.includes('*://*/*') ?? true;
            const validPermissions =
                manifest.permissions?.reduce(
                    (acc, p) => acc && (permissions.permissions?.includes(p) ?? false),
                    true
                ) ?? true;
            return validOrigins && validPermissions;
        }

        return await browser.permissions.contains(PASS_PERMISSIONS);
    } catch {
        return false;
    }
};

export const promptForPermissions = async (): Promise<boolean> => {
    try {
        return await browser.permissions.request(PASS_PERMISSIONS);
    } catch {
        return false;
    }
};

export const hasPermissions = async (permissions: Permission[]) => {
    try {
        return await browser.permissions.contains({ permissions });
    } catch {
        return false;
    }
};

export const requestPermissions = async (permissions: Permission[]) => {
    try {
        return await browser.permissions.request({ permissions });
    } catch {
        return false;
    }
};

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
