import { useEffect } from 'react';

import { removePersistedStateEvent } from '@proton/account/persist/event';
import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import {
    getTargetEnvironment,
    updateVersionCookie,
    versionCookieAtLoad,
} from '@proton/components/helpers/versionCookie';
import { FeatureCode, useFeature } from '@proton/features';
import { useDispatch } from '@proton/redux-shared-store';
import { updateEarlyAccess } from '@proton/shared/lib/api/settings';
import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import useApi from './useApi';

const useEarlyAccess = () => {
    const api = useApi();
    const earlyAccessScope = useFeature(FeatureCode.EarlyAccessScope);
    const dispatch = useDispatch();
    const { feature: { Value: maybeEarlyAccess, DefaultValue } = {} } = earlyAccessScope;
    const [userSettings] = useUserSettings();

    const earlyAccessScopeValue = maybeEarlyAccess || DefaultValue;

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

        const newValue = { EarlyAccess: Number(earlyAccessEnabled) };
        dispatch(userSettingsActions.update({ UserSettings: newValue }));
        // We remove the persisted state because it's important that it's persisted with the new user settings so that
        // it doesn't desynchronize the app on the next load
        dispatch(removePersistedStateEvent());
        await api(updateEarlyAccess(newValue));
    };

    const targetEnvironment = getTargetEnvironment(earlyAccessScope.feature, Boolean(userSettings.EarlyAccess));

    useEffect(() => {
        if (hasInboxDesktopFeature('EarlyAccess')) {
            void invokeInboxDesktopIPC({ type: 'earlyAccess', payload: targetEnvironment });
        }
    }, [targetEnvironment]);

    return {
        value: Boolean(userSettings.EarlyAccess),
        update,
        currentEnvironment: versionCookieAtLoad,
    };
};

export default useEarlyAccess;
