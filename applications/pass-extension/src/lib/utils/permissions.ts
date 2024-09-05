import type { Permissions } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';

const manifest = browser?.runtime.getManifest();

export const PASS_PERMISSIONS: Permissions.Permissions = {
    permissions: [],
    origins: manifest?.host_permissions ?? [],
};

export const checkExtensionPermissions = async (): Promise<boolean> => {
    if (BUILD_TARGET === 'safari') {
        const permissions = await browser.permissions.getAll();
        const validOrigins = permissions.origins?.includes('*://*/*') ?? true;
        const validPermissions =
            manifest.permissions?.reduce((acc, p) => acc && (permissions.permissions?.includes(p) ?? false), true) ??
            true;
        return validOrigins && validPermissions;
    }

    return browser.permissions.contains(PASS_PERMISSIONS).catch(() => false);
};

export const promptForPermissions = async (): Promise<boolean> =>
    browser.permissions.request(PASS_PERMISSIONS).catch(() => false);
