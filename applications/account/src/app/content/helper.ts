import type { ActiveSessionData } from '@proton/components/containers/app/SSOForkProducer';
import { SSOType } from '@proton/components/containers/app/SSOForkProducer';
import { ProductParam } from '@proton/shared/lib/apps/product';
import {
    getIsCalendarApp,
    getIsDriveApp,
    getIsMailApp,
    getIsPassApp,
    getIsVPNApp,
} from '@proton/shared/lib/authentication/apps';
import { APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';
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
        if (getIsPassApp(app)) {
            return { path: SSO_PATHS.PASS_SIGN_IN };
        }
        if (getIsVPNApp(app)) {
            return { path: SSO_PATHS.VPN_SIGN_IN };
        }
        return { path: SSO_PATHS.LOGIN };
    })();
    return `${localePath}${path}`;
};

export const getSignupUrl = (
    localePath: string,
    forkState: ActiveSessionData | undefined,
    app: APP_NAMES | undefined,
    productParam: ProductParam
) => {
    const { path, params } = (() => {
        if (forkState?.type === SSOType.OAuth) {
            return { path: SSO_PATHS.SIGNUP, params: {} };
        }

        let params = {};

        if (forkState?.type === SSOType.Proton) {
            params = forkState.payload.plan ? { plan: forkState.payload.plan } : {};
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
        if (getIsPassApp(app)) {
            return { path: SSO_PATHS.PASS_SIGNUP, params };
        }
        if (getIsVPNApp(app)) {
            return { path: SSO_PATHS.VPN_SIGNUP, params };
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
    reset: string;
    forgotUsername: string;
}

export const getPaths = (
    maybeLocalePrefix: string,
    forkState: ActiveSessionData | undefined,
    app: APP_NAMES | undefined,
    productParam: ProductParam
): Paths => {
    const localePrefix = maybeLocalePrefix || getLocaleMapping(localeCode);
    const prefix = getLocalePathPrefix(localePrefix);
    return {
        login: getLoginUrl(prefix, app),
        signup: getSignupUrl(prefix, forkState, app, productParam),
        forgotUsername: `${prefix}${SSO_PATHS.FORGOT_USERNAME}`,
        reset: `${prefix}${SSO_PATHS.RESET_PASSWORD}`,
    };
};
