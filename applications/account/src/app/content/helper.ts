import type { ProductParam } from '@proton/shared/lib/apps/product';
import {
    getIsCalendarApp,
    getIsDocsApp,
    getIsDriveApp,
    getIsLumoApp,
    getIsMailApp,
    getIsPassApp,
    getIsVPNApp,
    getIsWalletApp,
} from '@proton/shared/lib/authentication/apps';
import { type ProduceForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { getTermsURL, stringifySearchParams } from '@proton/shared/lib/helpers/url';
import { localeCode } from '@proton/shared/lib/i18n';

import { getLocaleMapping } from '../locales';
import { getLocalePathPrefix } from '../useLocationWithoutLocale';
import type { LocalRedirect } from './localRedirect';

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
        if (getIsLumoApp(app)) {
            return { path: SSO_PATHS.LUMO_SIGN_IN };
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
    forkState: ProduceForkData | undefined | null,
    app: APP_NAMES | undefined,
    productParam: ProductParam,
    searchParams: URLSearchParams
) => {
    const { path, params } = (() => {
        if (forkState?.type === SSOType.OAuth) {
            return { path: SSO_PATHS.SIGNUP, params: {} };
        }

        let params: { [key: string]: string | null } = {};

        for (const key of ['plan', 'cycle', 'currency', 'mode']) {
            params[key] = searchParams.get(key);
        }

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
        if (getIsLumoApp(app)) {
            return { path: SSO_PATHS.LUMO_SIGNUP, params };
        }

        if (productParam === 'business') {
            return { path: SSO_PATHS.BUSINESS_SIGNUP, params };
        }
        return { path: SSO_PATHS.SIGNUP, params };
    })();

    return `${localePath}${path}${stringifySearchParams(params, '?')}`;
};

/**
 * Note: These are paths, and may contain query strings.
 */
export interface Paths {
    login: string;
    signup: string;
    reauth: string;
    appSwitcher: string;
    reset: string;
    forgotUsername: string;
    signinHelp: string;
    signinAnotherDevice: string;
}

export const getPaths = ({
    maybeLocalePrefix,
    productParam,
    app,
    forkState,
    searchParams,
}: {
    maybeLocalePrefix: string;
    forkState: ProduceForkData | undefined | null;
    app: APP_NAMES | undefined;
    productParam: ProductParam;
    searchParams: URLSearchParams;
}): Paths => {
    const localePrefix = maybeLocalePrefix || getLocaleMapping(localeCode);
    const prefix = getLocalePathPrefix(localePrefix);
    return {
        login: getLoginUrl(prefix, app),
        reauth: getReauthUrl(prefix),
        appSwitcher: getAppSwitcherUrl(prefix),
        signup: getSignupUrl(prefix, forkState, app, productParam, searchParams),
        forgotUsername: `${prefix}${SSO_PATHS.FORGOT_USERNAME}`,
        reset: `${prefix}${SSO_PATHS.RESET_PASSWORD}`,
        signinHelp: `${prefix}${SSO_PATHS.SIGNIN_HELP}`,
        signinAnotherDevice: `${prefix}${SSO_PATHS.SIGN_IN_WITH_ANOTHER_DEVICE}`,
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

export const getPreAppIntent = ({
    forkState,
    localRedirect: maybeLocalRedirect,
    queryAppIntent: maybeQueryAppIntent,
}: {
    localRedirect: LocalRedirect | undefined;
    forkState: ProduceForkData | undefined | null;
    queryAppIntent: APP_NAMES | undefined;
}) => {
    return (
        (forkState?.type === SSOType.Proton && forkState.payload.forkParameters.app) ||
        maybeLocalRedirect?.toApp ||
        maybeQueryAppIntent
    );
};
