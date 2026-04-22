import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { selectOrganizationSentinel, selectUserSentinel } from '@proton/account/recovery/sentinelSelectors';
import { userSettingsThunk } from '@proton/account/userSettings';
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
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { getDisabledString, getEnabledString } from '../credentialLeak/helpers';

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
