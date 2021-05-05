import { useEffect, useState } from 'react';
import { updateEarlyAccess } from 'proton-shared/lib/api/settings';
import { deleteCookie, getCookie, setCookie } from 'proton-shared/lib/helpers/cookies';

import useFeature from './useFeature';
import useApi from './useApi';
import useLoading from './useLoading';
import useUserSettings from './useUserSettings';
import { FeatureCode } from '../containers/features';

export type Environment = 'alpha' | 'beta';

const getTargetEnvironment = (
    versionCookie: Environment | undefined,
    earlyAccessScope: Environment,
    earlyAccessUserSetting: boolean
): Environment | undefined => {
    if (!earlyAccessUserSetting) {
        return;
    }

    return versionCookie || earlyAccessScope;
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
        earlyAccessScope.feature?.Value,
        Boolean(userSettings.EarlyAccess)
    );

    const updateVersionCookie = (environment?: Environment) => {
        setVersionCookie(targetEnvironment);

        if (!environment) {
            deleteCookie('Version');
        } else {
            setCookie({
                cookieName: 'Version',
                cookieValue: environment,
                expirationDate: 'max',
                path: '/',
            });
        }
    };

    useEffect(() => {
        if (!hasLoaded) {
            return;
        }

        if (versionCookie === targetEnvironment) {
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
        if (!canUpdate) {
            return;
        }

        await withLoadingUpdate(api(updateEarlyAccess({ EarlyAccess: Number(earlyAccessEnabled) })));

        updateVersionCookie(earlyAccessEnabled ? earlyAccessScopeValue : undefined);
    };

    const currentEnvironmentMatchesTargetEnvironment = versionCookieAtLoad === targetEnvironment;
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
        currentEnvironment: versionCookieAtLoad,
    };
};

export default useEarlyAccess;
