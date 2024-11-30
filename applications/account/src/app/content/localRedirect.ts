import type * as H from 'history';

import { DEFAULT_APP, getAppFromPathname } from '@proton/shared/lib/apps/slugHelper';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import {
    APPS,
    type APP_NAMES,
    SECURITY_CHECKUP_PATHS,
    SETUP_ADDRESS_PATH,
    SSO_PATHS,
    VPN_TV_PATHS,
} from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';

import { UNAUTHENTICATED_ROUTES } from './helper';

const getParsedContinueTo = (searchParams: URLSearchParams) => {
    const continueTo = searchParams.get('continueTo') || '';
    // Only allowing tv for now
    if (VPN_TV_PATHS.includes(continueTo)) {
        return {
            path: continueTo,
            app: APPS.PROTONVPN_SETTINGS,
        };
    }
};

const getCleanPath = (location: H.Location) => {
    try {
        const path = getPathFromLocation(location);
        const url = new URL(path, window.location.origin);
        url.searchParams.delete(ForkSearchParameters.LocalID);
        return getPathFromLocation(url);
    } catch {}
};

export interface LocalRedirect {
    path: string;
    toApp: APP_NAMES | undefined;
}

export const getLocalRedirect = (location: H.Location): LocalRedirect | undefined => {
    const searchParams = new URLSearchParams(location.search);
    const continueTo = getParsedContinueTo(searchParams);
    if (continueTo) {
        return {
            path: continueTo.path,
            toApp: continueTo.app,
        };
    }
    const isSSOPathname = Object.values<string>(SSO_PATHS).includes(location.pathname);
    if (isSSOPathname) {
        return;
    }
    // TODO: Make this better and remove the SSO_PATHS.INVITE special condition due to it containing several paths
    const isUnauthenticatedPathname = [...Object.values<string>(UNAUTHENTICATED_ROUTES), SSO_PATHS.INVITE].some(
        (route) => location.pathname.startsWith(route)
    );
    if (isUnauthenticatedPathname) {
        return;
    }
    // If trying to access a non-public location from this app, set up a local redirect
    const path = getCleanPath(location);
    if (!path) {
        return undefined;
    }
    // Special case to not add the slug...
    if ([SETUP_ADDRESS_PATH, SECURITY_CHECKUP_PATHS.ROOT].some((p) => path.includes(p))) {
        return {
            path,
            toApp: DEFAULT_APP,
        };
    }
    const trimmedPathname = stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname));
    if (!trimmedPathname) {
        return undefined;
    }
    const toApp = getAppFromPathname(trimmedPathname);
    if (!toApp) {
        return {
            path,
            toApp: undefined,
        };
    }
    return {
        path,
        toApp,
    };
};
