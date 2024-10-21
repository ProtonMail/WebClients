import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { deleteAllOtherAuthDeviceConfig, rejectAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';
import {
    type AuthDeviceOutput,
    AuthDeviceState,
    type DeviceSecretData,
    deleteAuthDevice,
} from '@proton/shared/lib/keys/device';
import {
    activateAuthDevice,
    decryptAuthDeviceActivation,
    getAuthDeviceActivation,
    validateAuthDevice,
} from '@proton/shared/lib/keys/deviceConfirm';

import { addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import { userThunk } from '../user';
import { type AuthDevicesState, authDeviceActions } from './authDevices';

export interface ConfirmAuthDeviceData {
    activation: {
        token: string;
        address: Address;
    };
    deviceSecretData: DeviceSecretData;
    pendingAuthDevice: AuthDeviceOutput;
}

export const confirmPendingAuthDevice = ({
    pendingAuthDevice,
    confirmationCode,
}: {
    confirmationCode: string;
    pendingAuthDevice: AuthDeviceOutput;
}): ThunkAction<Promise<void>, AuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const addresses = await dispatch(addressesThunk());
        const activation = getAuthDeviceActivation({ addresses, pendingAuthDevice });
        const addressKeys = await dispatch(addressKeysThunk({ addressID: activation.address.ID }));
        const deviceSecretData = await decryptAuthDeviceActivation({
            deviceID: pendingAuthDevice.ID,
            addressKeys,
            token: activation.token,
        });
        validateAuthDevice({ deviceSecretData, confirmationCode });

        const api = getSilentApi(extra.api);
        const keyPassword = extra.authentication.getPassword();

        await activateAuthDevice({ api, pendingAuthDevice, deviceSecretData, keyPassword });
        dispatch(
            authDeviceActions.updateAuthDevice({
                ID: pendingAuthDevice.ID,
                State: AuthDeviceState.Active,
            })
        );
    };
};

export const rejectAuthDevice = ({
    pendingAuthDevice,
    type,
}: {
    pendingAuthDevice: AuthDeviceOutput;
    type: 'reject' | 'delete';
}): ThunkAction<Promise<void>, AuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const api = getSilentApi(extra.api);
        if (type === 'delete') {
            const user = await dispatch(userThunk());
            await deleteAuthDevice({ user, api, deviceID: pendingAuthDevice.ID });
            dispatch(authDeviceActions.removeAuthDevice(pendingAuthDevice));
        } else {
            await api(rejectAuthDeviceConfig(pendingAuthDevice.ID));
            dispatch(
                authDeviceActions.updateAuthDevice({
                    ID: pendingAuthDevice.ID,
                    State: AuthDeviceState.Rejected,
                })
            );
        }
    };
};

export const deleteAllOtherAuthDevice = ({
    currentAuthDevice,
}: {
    currentAuthDevice: AuthDeviceOutput;
}): ThunkAction<Promise<void>, AuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const api = getSilentApi(extra.api);
        await api(deleteAllOtherAuthDeviceConfig());
        dispatch(authDeviceActions.removeAllOtherAuthDevice(currentAuthDevice));
    };
};
