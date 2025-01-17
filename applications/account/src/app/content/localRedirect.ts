import type * as H from 'history';

import { DEFAULT_APP, getAppFromPathname, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork';
import { getParsedPathWithoutLocalIDBasename } from '@proton/shared/lib/authentication/pathnameHelper';
import { getReturnUrl } from '@proton/shared/lib/authentication/returnUrl';
import { APPS, type APP_NAMES, SSO_PATHS, VPN_TV_PATHS } from '@proton/shared/lib/constants';
import { getPathFromLocation, joinPaths } from '@proton/shared/lib/helpers/url';

import type { ProductParams } from '../signup/searchParams';
import { UNAUTHENTICATED_ROUTES } from './helper';
import { getRoutesWithoutSlug } from './routesWithoutSlug';

const getContinueToUrl = (searchParams: URLSearchParams) => {
    const continueTo = searchParams.get('continueTo') || '';
    // Only allowing tv for now
    if (VPN_TV_PATHS.includes(continueTo)) {
        const toApp = APPS.PROTONVPN_SETTINGS;
        return {
            location: {
                pathname: joinPaths(getSlugFromApp(toApp), continueTo),
                search: '',
                hash: '',
            },
            app: toApp,
        };
    }
};

/**
 * Removes basename and localID from the pathname
 */
const getCleanUrl = (location: H.Location) => {
    try {
        const path = `/${getParsedPathWithoutLocalIDBasename(getPathFromLocation(location))}`;
        const url = new URL(path, window.location.origin);
        url.searchParams.delete(ForkSearchParameters.LocalID);
        return url;
    } catch {}
};

export interface LocalRedirect {
    location: {
        pathname: string;
        search: string;
        hash: string;
    };
    toApp: APP_NAMES | undefined;
    context?: 'public' | 'private';
    type?: 'prompt-login';
}

export const getLocalRedirect = (location: H.Location, productParams: ProductParams): LocalRedirect | undefined => {
    const searchParams = new URLSearchParams(location.search);
    const continueTo = getContinueToUrl(searchParams);
    // TODO: Migrate this to returnUrl
    if (continueTo) {
        return {
            location: continueTo.location,
            toApp: continueTo.app,
            type: 'prompt-login',
        };
    }
    const returnUrl = getReturnUrl(searchParams);
    if (returnUrl && returnUrl.target === 'account') {
        const toApp = getAppFromPathname(returnUrl.location.pathname);
        return {
            location: returnUrl.location,
            context: returnUrl.context,
            // On public context, ensure the provided app or the default app is selected to avoid the app switcher
            toApp: returnUrl.context === 'public' ? productParams.product || DEFAULT_APP : toApp,
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
    const cleanUrl = getCleanUrl(location);
    if (!cleanUrl || cleanUrl.pathname === '/') {
        return undefined;
    }
    let toApp = getAppFromPathname(cleanUrl.pathname);
    // Special case to not add the app slug and skip the app switcher for these routes
    const routesWithoutSlug = Object.values(getRoutesWithoutSlug());
    if (routesWithoutSlug.some((p) => cleanUrl.pathname.includes(p))) {
        toApp = DEFAULT_APP;
    }
    return {
        location: {
            pathname: cleanUrl.pathname,
            search: cleanUrl.search,
            hash: cleanUrl.hash,
        },
        // NOTE: If toApp is defined it'll skip the app switcher
        toApp: toApp,
    };
};
