import type { Permissions } from 'webextension-polyfill';

import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import browser from '@proton/pass/lib/globals/browser';
import type { Unpack } from '@proton/pass/types';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

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

export const getMinimalHostPermissions = ({ SSO_URL, API_URL }: PassConfig): string[] => {
    if (BUILD_TARGET === 'safari') {
        /** Safari merges host permissions and externally_connectable in
         * the extension's settings for website access. To circumvent
         * the limitation of a user manually denying website access to account
         * or pass domains, create a wildcard Proton domain host permission. */
        const protonHost = `https://*.${getSecondLevelDomain(new URL(SSO_URL).hostname)}/*`;
        return [protonHost];
    }

    const accountHost = `${SSO_URL}/*`;
    const passHost = API_URL.replace(/\api$/, '*');
    return [accountHost, passHost];
};

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
