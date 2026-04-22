import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { type AddressesState, addressesThunk } from '@proton/account/addresses';
import { type UserState, userThunk } from '@proton/account/user';
import { type UserKeysState, selectUserKeys, userKeysThunk } from '@proton/account/userKeys';
import { type UserSettingsState, userSettingsThunk } from '@proton/account/userSettings';
import type { ProtonThunkArguments, SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import type { Api } from '@proton/shared/lib/interfaces';
import { syncDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import noop from '@proton/utils/noop';

type RequiredState = UserState & UserKeysState & UserSettingsState & AddressesState;

export const syncDeviceRecoveryThunk = ({
    api,
    abortController,
}: { api?: Api; abortController?: AbortController } = {}): ThunkAction<
    Promise<void>,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const [user, userKeys, addresses, userSettings] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(userSettingsThunk()),
        ]);
        if (!userKeys) {
            return;
        }
        const result = await syncDeviceRecovery({
            api: api ?? extra.api,
            user,
            userKeys,
            addresses,
            userSettings,
            signal: abortController?.signal,
            authentication: extra.authentication,
        });
        if (result) {
            await Promise.all([
                dispatch(userThunk({ cache: CacheType.None })),
                dispatch(userSettingsThunk({ cache: CacheType.None })),
            ]);
        }
    };
};

export const updateDeviceRecoverySettingsThunk = ({
    deviceRecovery,
}: {
    deviceRecovery: boolean;
}): ThunkAction<Promise<boolean>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const userSettings = await dispatch(userSettingsThunk());
        const newValue = deviceRecovery ? 1 : 0;
        if (userSettings.DeviceRecovery === newValue) {
            return false;
        }
        await extra.api(updateDeviceRecovery({ DeviceRecovery: newValue }));
        await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(userSettingsThunk({ cache: CacheType.None })),
        ]);
        await dispatch(syncDeviceRecoveryThunk());
        return true;
    };
};

export const deviceRecoveryListener = (startListening: SharedStartListening<RequiredState>) => {
    let abortController = new AbortController();

    startListening({
        predicate: (_, currentState, previousState) => {
            // In lieu of better logic, this is trying to catch user keys that get reactivated.
            return selectUserKeys(currentState).value?.length !== selectUserKeys(previousState).value?.length;
        },
        effect: async (action, listenerApi) => {
            abortController.abort();
            abortController = new AbortController();
            listenerApi
                .dispatch(syncDeviceRecoveryThunk({ api: getSilentApi(listenerApi.extra.api), abortController }))
                .catch(noop);
        },
    });
};
