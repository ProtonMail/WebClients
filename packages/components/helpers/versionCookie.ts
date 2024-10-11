import type { Feature } from '@proton/features/interface';
import { doesNotSupportEarlyAccessVersion } from '@proton/shared/lib/helpers/browser';
import { deleteCookie, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import type { Environment } from '@proton/shared/lib/interfaces';

export const versionCookieAtLoad = getCookie('Tag') as Environment | undefined;

export const getVersionCookieIsValid = (
    versionCookie: Environment | undefined,
    earlyAccessScope: Feature<Environment> | undefined
) => versionCookie === undefined || earlyAccessScope?.Options?.includes(versionCookie);

export const getTargetEnvironment = (
    earlyAccessScope: Feature<Environment> | undefined,
    earlyAccessUserSetting: boolean
): Environment | undefined => {
    if (!earlyAccessScope || !earlyAccessUserSetting) {
        return;
    }

    return earlyAccessScope.Value;
};

export const updateVersionCookieHelper = (
    cookieName: string,
    environment: Environment | undefined,
    earlyAccessScopeFeature: Feature<Environment> | undefined
) => {
    if (environment) {
        setCookie({
            cookieName,
            cookieValue: environment,
            expirationDate: 'max',
            path: '/',
        });
    }

    /*
     * if there is a not-allowed cookie already set in the browser,
     * leave it be, version will not be treated as set by it
     */
    if (!getVersionCookieIsValid(getCookie(cookieName) as Environment | undefined, earlyAccessScopeFeature)) {
        return;
    }

    if (!environment) {
        deleteCookie(cookieName);
    }
};

export const updateVersionCookie = (
    environment: Environment | undefined,
    earlyAccessScopeFeature: Feature<Environment> | undefined
) => {
    if (doesNotSupportEarlyAccessVersion()) {
        return;
    }
    updateVersionCookieHelper('Tag', environment, earlyAccessScopeFeature);
};

export const deleteVersionCookies = () => {
    deleteCookie('Tag');
};
