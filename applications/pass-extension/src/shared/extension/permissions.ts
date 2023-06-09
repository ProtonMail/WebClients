import type { Permissions } from 'webextension-polyfill';

import browser from '@proton/pass/globals/browser';

const manifest = browser.runtime.getManifest();

export const PASS_PERMISSIONS: Permissions.Permissions = {
    permissions: [],
    origins: manifest.host_permissions ?? [],
};

export const checkExtensionPermissions = async (): Promise<boolean> => browser.permissions.contains(PASS_PERMISSIONS);
export const promptForPermissions = async (): Promise<boolean> => browser.permissions.request(PASS_PERMISSIONS);
