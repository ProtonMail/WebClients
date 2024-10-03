import type * as H from 'history';

import type { ProduceForkData } from '@proton/components/containers/app/SSOForkProducer';
import { SSOType } from '@proton/components/containers/app/SSOForkProducer';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { DEFAULT_APP, getAppFromPathname } from '@proton/shared/lib/apps/slugHelper';
import {
    getIsCalendarApp,
    getIsDocsApp,
    getIsDriveApp,
    getIsMailApp,
    getIsPassApp,
    getIsVPNApp,
    getIsWalletApp,
} from '@proton/shared/lib/authentication/apps';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    SECURITY_CHECKUP_PATHS,
    SETUP_ADDRESS_PATH,
    SSO_PATHS,
    VPN_TV_PATHS,
} from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getPathFromLocation, getTermsURL, stringifySearchParams } from '@proton/shared/lib/helpers/url';
import { localeCode } from '@proton/shared/lib/i18n';

import { getLocaleMapping } from '../locales';
import { getLocalePathPrefix } from '../useLocationWithoutLocale';

export const getLoginUrl = (localePath: string, app: APP_NAMES | undefined) => {
    const { path } = (() => {
        if (getIsMailApp(app)) {
            return { path: SSO_PATHS.MAIL_SIGN_IN };
        }
        if (getIsCalendarApp(app)) {
            return { path: SSO_PATHS.CALENDAR_SIGN_IN };
        }
        if (getIsDriveApp(app)) {
            return { path: SSO_PATHS.DRIVE_SIGN_IN };
        }
        if (getIsDocsApp(app)) {
            return { path: SSO_PATHS.DOCS_SIGN_IN };
        }
        if (getIsPassApp(app)) {
            return { path: SSO_PATHS.PASS_SIGN_IN };
        }
        if (getIsVPNApp(app)) {
            return { path: SSO_PATHS.VPN_SIGN_IN };
        }
        if (getIsWalletApp(app)) {
            return { path: SSO_PATHS.WALLET_SIGN_IN };
        }

        return { path: SSO_PATHS.LOGIN };
    })();
    return `${localePath}${path}`;
};

export const getReauthUrl = (localePath: string) => {
    return `${localePath}${SSO_PATHS.REAUTH}`;
};

export const getAppSwitcherUrl = (localePath: string) => {
    return `${localePath}${SSO_PATHS.APP_SWITCHER}`;
};

export const getSignupUrl = (
    localePath: string,
    forkState: ProduceForkData | undefined,
    app: APP_NAMES | undefined,
    productParam: ProductParam
) => {
    const { path, params } = (() => {
        if (forkState?.type === SSOType.OAuth) {
            return { path: SSO_PATHS.SIGNUP, params: {} };
        }

        let params = {};

        if (forkState?.type === SSOType.Proton) {
            params = forkState.payload.forkParameters.plan ? { plan: forkState.payload.forkParameters.plan } : {};
        }

        if (getIsMailApp(app)) {
            return { path: SSO_PATHS.MAIL_SIGNUP, params };
        }
        if (getIsCalendarApp(app)) {
            return { path: SSO_PATHS.CALENDAR_SIGNUP, params };
        }
        if (getIsDriveApp(app)) {
            return { path: SSO_PATHS.DRIVE_SIGNUP, params };
        }
        if (getIsDocsApp(app)) {
            return { path: SSO_PATHS.DOCS_SIGNUP, params };
        }
        if (getIsPassApp(app)) {
            return { path: SSO_PATHS.PASS_SIGNUP, params };
        }
        if (getIsVPNApp(app)) {
            return { path: SSO_PATHS.VPN_SIGNUP, params };
        }
        if (getIsWalletApp(app)) {
            return { path: SSO_PATHS.WALLET_SIGNUP, params };
        }

        if (productParam === 'business') {
            return { path: SSO_PATHS.BUSINESS_SIGNUP, params };
        }
        return { path: SSO_PATHS.SIGNUP, params };
    })();

    return `${localePath}${path}${stringifySearchParams(params, '?')}`;
};

export interface Paths {
    login: string;
    signup: string;
    reauth: string;
    appSwitcher: string;
    reset: string;
    forgotUsername: string;
}

export const getPaths = (
    maybeLocalePrefix: string,
    forkState: ProduceForkData | undefined,
    app: APP_NAMES | undefined,
    productParam: ProductParam
): Paths => {
    const localePrefix = maybeLocalePrefix || getLocaleMapping(localeCode);
    const prefix = getLocalePathPrefix(localePrefix);
    return {
        login: getLoginUrl(prefix, app),
        reauth: getReauthUrl(prefix),
        appSwitcher: getAppSwitcherUrl(prefix),
        signup: getSignupUrl(prefix, forkState, app, productParam),
        forgotUsername: `${prefix}${SSO_PATHS.FORGOT_USERNAME}`,
        reset: `${prefix}${SSO_PATHS.RESET_PASSWORD}`,
    };
};

export const getLocaleTermsURL = (app: APP_NAMES) => {
    return getTermsURL(app, getLocaleMapping(localeCode));
};

export const UNAUTHENTICATED_ROUTES = {
    UNSUBSCRIBE: '/unsubscribe',
    VERIFY_EMAIL: '/verify-email',
    REMOVE_EMAIL: '/remove-email',
    DISABLE_ACCOUNT: '/disable-account',
    EMAIL_FORWARDING: '/email-forwarding',
    GROUP_INVITE: '/groups',
    CLOSE_TICKET: '/close-ticket',
    TRIAL_ENDED: '/trial-ended',
};

const getCleanPath = (location: H.Location) => {
    try {
        const path = getPathFromLocation(location);
        const url = new URL(path, window.location.origin);
        url.searchParams.delete(ForkSearchParameters.LocalID);
        return getPathFromLocation(url);
    } catch {}
};

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

export const getLocalRedirect = (location: H.Location) => {
    const searchParams = new URLSearchParams(location.search);
    const continueTo = getParsedContinueTo(searchParams);
    if (continueTo) {
        return {
            path: continueTo.path,
            app: continueTo.app,
        };
    }
    // If trying to access a non-public location from this app, set up a local redirect
    const localLocation = [...Object.values(SSO_PATHS), ...Object.values(UNAUTHENTICATED_ROUTES)].includes(
        location.pathname
    )
        ? undefined
        : location;
    if (!localLocation) {
        return;
    }
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
