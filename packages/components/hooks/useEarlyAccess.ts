import { updateEarlyAccess } from '@proton/shared/lib/api/settings';
import { deleteCookie, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { doesNotSupportEarlyAccessVersion } from '@proton/shared/lib/helpers/browser';

import useFeature from './useFeature';
import useApi from './useApi';
import useLoading from './useLoading';
import useUserSettings from './useUserSettings';
import { Feature, FeatureCode } from '../containers/features';

export type Environment = 'alpha' | 'beta';

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

export const versionCookieAtLoad = getCookie('Tag') as Environment | undefined;

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
    // If the `Tag` cookie will get deleted, a possibly existing `Version` cookie will get priority over it.
    // Also delete that cookie (It's not used anymore).
    deleteCookie('Version');
};

const useEarlyAccess = () => {
    const api = useApi();
    const earlyAccessScope = useFeature(FeatureCode.EarlyAccessScope);
    const { feature: { Value: maybeEarlyAccess, DefaultValue } = {} } = earlyAccessScope;
    const [loadingUpdate, withLoadingUpdate] = useLoading();
    const [userSettings, userSettingsLoading] = useUserSettings();

    const earlyAccessScopeValue = maybeEarlyAccess || DefaultValue;
    const hasLoaded = !(userSettingsLoading || earlyAccessScope.loading);

    /*
     * Shouldn't be able to call update without the request for the EarlyAccessScope
     * feature to have completed since the environment is set based on it should
     * earlyAccessEnabled be true
     */
    const canUpdate = earlyAccessScope.feature && 'Value' in earlyAccessScope.feature;

    const update = async (earlyAccessEnabled: boolean) => {
        /*
         * Can't update the cookie without the request for the EarlyAccessScope
         * feature to have completed since the environment is set based on it should
         * earlyAccessEnabled be true
         */
        if (canUpdate) {
            updateVersionCookie(earlyAccessEnabled ? earlyAccessScopeValue : undefined, earlyAccessScope.feature);
        }

        await withLoadingUpdate(api(updateEarlyAccess({ EarlyAccess: Number(earlyAccessEnabled) })));
    };

    const normalizedVersionCookieAtLoad = getVersionCookieIsValid(versionCookieAtLoad, earlyAccessScope.feature)
        ? versionCookieAtLoad
        : undefined;

    const targetEnvironment = getTargetEnvironment(earlyAccessScope.feature, Boolean(userSettings.EarlyAccess));

    const currentEnvironmentMatchesTargetEnvironment = normalizedVersionCookieAtLoad === targetEnvironment;
    const environmentIsDesynchronized = hasLoaded && !currentEnvironmentMatchesTargetEnvironment;
    const loading = earlyAccessScope.loading || loadingUpdate;

    return {
        value: Boolean(userSettings.EarlyAccess),
        scope: earlyAccessScopeValue,
        canUpdate,
        update,
        loading,
        loadingUpdate,
        environmentIsDesynchronized,
        targetEnvironment,
        currentEnvironment: versionCookieAtLoad,
    };
};

export default useEarlyAccess;
