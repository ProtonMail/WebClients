import { useEffect, useState } from 'react';
import { updateEarlyAccess } from 'proton-shared/lib/api/settings';
import { deleteCookie, getCookie, setCookie } from 'proton-shared/lib/helpers/cookies';

import useFeature from './useFeature';
import useApi from './useApi';
import useLoading from './useLoading';
import useUserSettings from './useUserSettings';
import { Feature, FeatureCode } from '../containers/features';

export type Environment = 'alpha' | 'beta';

const getVersionCookieIsValid = (
    versionCookie: Environment | undefined,
    earlyAccessScope: Feature<Environment> | undefined
) => versionCookie === undefined || earlyAccessScope?.Options?.includes(versionCookie);

const getTargetEnvironment = (
    versionCookie: Environment | undefined,
    earlyAccessScope: Feature<Environment> | undefined,
    earlyAccessUserSetting: boolean
): Environment | undefined => {
    if (!earlyAccessScope || !earlyAccessUserSetting) {
        return;
    }

    if (versionCookie === undefined || !getVersionCookieIsValid(versionCookie, earlyAccessScope)) {
        return earlyAccessScope.Value;
    }

    return versionCookie;
};

const versionCookieAtLoad = getCookie('Version') as Environment | undefined;

const useEarlyAccess = () => {
    const api = useApi();
    const earlyAccessScope = useFeature(FeatureCode.EarlyAccessScope);
    const { feature: { Value: maybeEarlyAccess, DefaultValue } = {} } = earlyAccessScope;
    const [loadingUpdate, withLoadingUpdate] = useLoading();
    const [versionCookie, setVersionCookie] = useState(versionCookieAtLoad);
    const [userSettings, userSettingsLoading] = useUserSettings();

    const earlyAccessScopeValue = maybeEarlyAccess || DefaultValue;
    const hasLoaded = !(userSettingsLoading || earlyAccessScope.loading);

    const targetEnvironment = getTargetEnvironment(
        versionCookie,
        earlyAccessScope.feature,
        Boolean(userSettings.EarlyAccess)
    );

    const updateVersionCookie = (environment?: Environment) => {
        if (environment) {
            setVersionCookie(environment);
            setCookie({
                cookieName: 'Version',
                cookieValue: environment,
                expirationDate: 'max',
                path: '/',
            });
        }

        /*
         * if there is a not-allowed cookie already set in the browser,
         * leave it be, version will not be treated as set by it
         */
        if (!getVersionCookieIsValid(getCookie('Version') as Environment | undefined, earlyAccessScope.feature)) {
            return;
        }

        if (!environment) {
            setVersionCookie(environment);
            deleteCookie('Version');
        }
    };

    useEffect(() => {
        if (!hasLoaded || versionCookie === targetEnvironment || versionCookie !== versionCookieAtLoad) {
            return;
        }

        updateVersionCookie(targetEnvironment);
    }, [hasLoaded, versionCookie, targetEnvironment]);

    /*
     * Shouldn't be able to call update without the request for the EarlyAccessScope
     * feature to have completed since the environment is set based on it should
     * earlyAccessEnabled be true
     */
    const canUpdate = earlyAccessScope.feature && 'Value' in earlyAccessScope.feature;

    const update = async (earlyAccessEnabled: boolean) => {
        await withLoadingUpdate(api(updateEarlyAccess({ EarlyAccess: Number(earlyAccessEnabled) })));

        /*
         * Can't update the cookie without the request for the EarlyAccessScope
         * feature to have completed since the environment is set based on it should
         * earlyAccessEnabled be true
         */
        if (!canUpdate) {
            updateVersionCookie(earlyAccessEnabled ? earlyAccessScopeValue : undefined);
        }
    };

    const normalizedVersionCookieAtLoad = getVersionCookieIsValid(versionCookieAtLoad, earlyAccessScope.feature)
        ? versionCookieAtLoad
        : undefined;

    const currentEnvironmentMatchesTargetEnvironment = normalizedVersionCookieAtLoad === targetEnvironment;
    const environmentIsDesynchronized = hasLoaded && !currentEnvironmentMatchesTargetEnvironment;
    const loading = earlyAccessScope.loading || loadingUpdate;
    const isEnabled =
        !earlyAccessScope.loading &&
        Boolean(earlyAccessScope.feature) &&
        Boolean(earlyAccessScope.feature?.Options?.length);

    return {
        isEnabled,
        value: Boolean(userSettings.EarlyAccess),
        scope: earlyAccessScopeValue,
        canUpdate,
        update,
        loading,
        loadingUpdate,
        environmentIsDesynchronized,
        currentEnvironment: versionCookieAtLoad,
    };
};

export default useEarlyAccess;
