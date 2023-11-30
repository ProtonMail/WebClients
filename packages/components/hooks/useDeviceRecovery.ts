import { useEffect } from 'react';

import { getIsDeviceRecoveryEnabled, syncDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import noop from '@proton/utils/noop';

import { useFlag } from '../../components/containers/unleash';
import { useGetAddresses } from './useAddresses';
import useApi from './useApi';
import useConfig from './useConfig';
import useEventManager from './useEventManager';
import useIsRecoveryFileAvailable from './useIsRecoveryFileAvailable';
import { useGetUser } from './useUser';
import { useGetUserKeys, useUserKeys } from './useUserKeys';
import useUserSettings from './useUserSettings';

export const useIsDeviceRecoveryEnabled = () => {
    const [userSettings] = useUserSettings();
    return getIsDeviceRecoveryEnabled(userSettings);
};

export const useIsDeviceRecoveryAvailable = () => {
    const hasTrustedDeviceRecovery = useFlag('TrustedDeviceRecovery');
    const [recoveryFileAvailable, loading] = useIsRecoveryFileAvailable();
    return [recoveryFileAvailable && hasTrustedDeviceRecovery, loading];
};

export const useDeviceRecovery = () => {
    const [userKeys] = useUserKeys();
    const getUserKeys = useGetUserKeys();
    const getUser = useGetUser();
    const getAddresses = useGetAddresses();
    const { call } = useEventManager();
    const [userSettings] = useUserSettings();
    const api = useApi();
    const { APP_NAME } = useConfig();

    useEffect(() => {
        if (!userKeys?.length) {
            return;
        }
        const abortController = new AbortController();
        const run = async () => {
            const [user, userKeys, addresses] = await Promise.all([getUser(), getUserKeys(), getAddresses()]);
            const result = await syncDeviceRecovery({
                api,
                user,
                userKeys,
                addresses,
                userSettings,
                appName: APP_NAME,
                signal: abortController.signal,
            });
            if (result) {
                await call();
            }
        };
        run().catch(noop);
        return () => {
            abortController.abort();
        };
        // In lieu of better logic, this is trying to catch user keys that get reactivated.
    }, [userKeys?.length]);
};
