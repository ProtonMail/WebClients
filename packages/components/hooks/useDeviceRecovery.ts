import { useEffect } from 'react';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { useGetUserKeys, useUserKeys } from '@proton/account/userKeys/hooks';
import { useGetUserSettings, useUserSettings } from '@proton/account/userSettings/hooks';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { CacheType } from '@proton/redux-utilities';
import { getIsDeviceRecoveryEnabled, syncDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import noop from '@proton/utils/noop';

import useApi from './useApi';
import useConfig from './useConfig';

export const useIsDeviceRecoveryEnabled = () => {
    const [userSettings] = useUserSettings();
    const authentication = useAuthentication();
    return getIsDeviceRecoveryEnabled(userSettings, authentication);
};

export const useIsDeviceRecoveryAvailable = () => {
    const [recoveryFileAvailable, loading] = useIsRecoveryFileAvailable();
    return [recoveryFileAvailable, loading];
};

export const useDeviceRecovery = () => {
    const [userKeys] = useUserKeys();
    const getUserKeys = useGetUserKeys();
    const getUser = useGetUser();
    const getAddresses = useGetAddresses();
    const getUserSettings = useGetUserSettings();
    const authentication = useAuthentication();
    const api = useApi();
    const { APP_NAME } = useConfig();

    useEffect(() => {
        if (!userKeys?.length) {
            return;
        }
        const abortController = new AbortController();
        const run = async () => {
            const [user, userKeys, addresses, userSettings] = await Promise.all([
                getUser(),
                getUserKeys(),
                getAddresses(),
                getUserSettings(),
            ]);
            if (!userKeys) {
                return;
            }
            const result = await syncDeviceRecovery({
                api,
                user,
                userKeys,
                addresses,
                userSettings,
                appName: APP_NAME,
                signal: abortController.signal,
                authentication,
            });
            if (result) {
                await Promise.all([getUser({ cache: CacheType.None }), getUserSettings({ cache: CacheType.None })]);
            }
        };
        run().catch(noop);
        return () => {
            abortController.abort();
        };
        // In lieu of better logic, this is trying to catch user keys that get reactivated.
    }, [userKeys?.length]);
};
