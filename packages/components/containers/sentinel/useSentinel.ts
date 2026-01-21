import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { organizationThunk, selectOrganization } from '@proton/account/organization';
import { selectUserSettings, userSettingsThunk } from '@proton/account/userSettings';
import {
    disableHighSecurityOrganization,
    enableHighSecurityOrganization,
} from '@proton/components/containers/b2bDashboard/ActivityMonitor/api';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import {
    deleteSummaryEmailForHighSecurity,
    disableHighSecurity,
    enableHighSecurity,
    updateSummaryEmailForHighSecurity,
} from '@proton/shared/lib/api/settings';
import {
    ORGANIZATION_POLICY_ENFORCED,
    PROTON_SENTINEL_NAME,
    SETTINGS_PROTON_SENTINEL_STATE,
} from '@proton/shared/lib/constants';
import { isProtonSentinelEligible } from '@proton/shared/lib/helpers/userSettings';
import noop from '@proton/utils/noop';

import { getDisabledString, getEnabledString } from '../credentialLeak/helpers';

export const selectOrganizationSentinel = createSelector([selectOrganization], ({ value: organization }) => {
    const orgSentinelEnforced = organization?.Settings.OrganizationPolicy.Enforced === ORGANIZATION_POLICY_ENFORCED.YES;
    const orgSentinelValue = organization?.Settings.HighSecurity;
    const orgSentinelEnabled = orgSentinelValue === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;
    const value = orgSentinelValue || SETTINGS_PROTON_SENTINEL_STATE.DISABLED;

    return {
        loading: organization === undefined,
        eligible: orgSentinelEnforced || orgSentinelEnabled,
        value,
        checked: value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
        enforcedByOrganization: orgSentinelEnforced,
    };
});

export const selectUserSentinel = createSelector(
    [selectUserSettings, selectOrganization],
    ({ value: userSettings }, { value: organization }) => {
        const orgSentinelValue = organization?.Settings.HighSecurity;
        const orgSentinelEnabled = orgSentinelValue === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;

        const userSentinelValue = userSettings?.HighSecurity.Value || SETTINGS_PROTON_SENTINEL_STATE.DISABLED;
        const orgSentinelEnforced = userSettings?.OrganizationPolicy.Enforced === ORGANIZATION_POLICY_ENFORCED.YES;

        const value = orgSentinelEnabled ? orgSentinelValue : userSentinelValue;

        return {
            loading: userSettings === undefined || organization === undefined,
            eligible: Boolean(userSettings && isProtonSentinelEligible(userSettings)),
            value,
            checked: value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
            enforcedByOrganization: orgSentinelEnforced && orgSentinelEnabled,
            notificationEmails: userSettings?.HighSecurity?.SummaryEmail,
        };
    }
);

export const useSentinel = (
    variant: 'user' | 'organization'
): {
    state: ReturnType<typeof selectUserSentinel> | ReturnType<typeof selectOrganizationSentinel>;
    setSentinel: (enabled: boolean) => any;
    loadingSentinel: boolean;
    setNotificationEmails: (enabled: boolean) => any;
    loadingNotifications: boolean;
} => {
    const api = useApi();
    const dispatch = useDispatch();
    const state = useSelector(variant === 'user' ? selectUserSentinel : selectOrganizationSentinel);
    const { createNotification } = useNotifications();

    const [loadingSentinel, withLoadingSentinel] = useLoading();
    const [loadingNotifications, withLoadingNotifications] = useLoading();

    const setSentinel = async (enabled: boolean) => {
        withLoadingSentinel(
            (async () => {
                const enableEndpoint = variant === 'user' ? enableHighSecurity : enableHighSecurityOrganization;
                const disableEndpoint = variant === 'user' ? disableHighSecurity : disableHighSecurityOrganization;
                const endpoint = enabled ? enableEndpoint : disableEndpoint;
                const notificationTextGetter = enabled ? getEnabledString : getDisabledString;

                await api(endpoint());
                await dispatch(userSettingsThunk({ cache: CacheType.None }));
                if (variant === 'organization') {
                    await dispatch(organizationThunk({ cache: CacheType.None, type: 'settings' }));
                }

                createNotification({ text: notificationTextGetter(PROTON_SENTINEL_NAME) });
            })()
        ).catch(noop);
    };

    const setNotificationEmails = async (enabled: boolean) => {
        withLoadingNotifications(
            (async () => {
                if (enabled) {
                    await api(updateSummaryEmailForHighSecurity());
                    createNotification({ text: c('Notification').t`Email notifications have been enabled` });
                } else {
                    await api(deleteSummaryEmailForHighSecurity());
                    createNotification({ text: c('Notification').t`Email notifications have been disabled` });
                }
                await dispatch(userSettingsThunk({ cache: CacheType.None }));
                if (variant === 'organization') {
                    await dispatch(organizationThunk({ cache: CacheType.None, type: 'settings' }));
                }
            })()
        ).catch(noop);
    };

    return {
        state,
        setSentinel,
        loadingSentinel,
        setNotificationEmails,
        loadingNotifications,
    };
};
