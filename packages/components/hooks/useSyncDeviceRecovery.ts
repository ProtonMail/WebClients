import { useCallback } from 'react';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useGetUserSettings } from '@proton/account/userSettings/hooks';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { syncDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';

import useApi from './useApi';
import useAuthentication from './useAuthentication';

export const useSyncDeviceRecovery = () => {
    const api = useApi();
    const authentication = useAuthentication();
    const getUser = useGetUser();
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const getUserSettings = useGetUserSettings();

    return useCallback(
        async (partialUserSettings: Partial<UserSettings>) => {
            const [user, userKeys, addresses, currentUserSettings] = await Promise.all([
                getUser(),
                getUserKeys(),
                getAddresses(),
                getUserSettings(),
            ]);
            return syncDeviceRecovery({
                api,
                user,
                addresses,
                userSettings: { ...currentUserSettings, ...partialUserSettings },
                userKeys,
                authentication,
            });
        },
        [api, authentication, getUser, getUserKeys, getAddresses, getUserSettings]
    );
};
