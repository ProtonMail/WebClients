import { select } from 'redux-saga/effects';

import { rejectAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import type { Address, DecryptedAddressKey, User } from '@proton/shared/lib/interfaces';
import type { AuthDeviceOutput, DeviceSecretData } from '@proton/shared/lib/keys/device';
import { getAllAuthDevices } from '@proton/shared/lib/keys/device';
import {
    activateAuthDevice,
    decryptAuthDeviceActivation,
    getAuthDeviceActivation,
    validateAuthDevice,
} from '@proton/shared/lib/keys/deviceConfirm';
import noop from '@proton/utils/noop';

import { api } from '../../../lib/api/api';
import { PassCrypto } from '../../../lib/crypto';
import type { MaybeNull } from '../../../types';
import { confirmPendingAuthDevice, getAuthDevices, rejectPendingAuthDevice } from '../../actions/creators/sso';
import { createRequestSaga } from '../../request/sagas';
import { selectAllAddresses, selectUser } from '../../selectors';

export const authDevices = createRequestSaga({
    actions: getAuthDevices,
    call: function* () {
        const user: MaybeNull<User> = yield select(selectUser);
        const AuthDevices: AuthDeviceOutput[] = yield getAllAuthDevices({ user, api });
        return AuthDevices;
    },
});

export const confirmPending = createRequestSaga({
    actions: confirmPendingAuthDevice,
    call: function* ({ pendingAuthDevice, confirmationCode }, { getAuthStore }) {
        const addresses: Address[] = yield select(selectAllAddresses);
        const activation = getAuthDeviceActivation({ addresses, pendingAuthDevice });

        const addressKeys: DecryptedAddressKey[] = yield PassCrypto.getDecryptedAddressKeys(activation.address.ID);
        const deviceSecretData: DeviceSecretData = yield decryptAuthDeviceActivation({
            deviceID: pendingAuthDevice.ID,
            addressKeys,
            token: activation.token,
        });

        validateAuthDevice({ deviceSecretData, confirmationCode });

        const keyPassword = getAuthStore().getPassword()!;
        yield activateAuthDevice({ api, keyPassword, deviceSecretData, pendingAuthDevice });

        return pendingAuthDevice.ID;
    },
});

export const rejectPending = createRequestSaga({
    actions: rejectPendingAuthDevice,
    call: (pendingAuthDevice) => {
        api(rejectAuthDeviceConfig(pendingAuthDevice.ID)).catch(noop);
        return pendingAuthDevice.ID;
    },
});

export default [authDevices, confirmPending, rejectPending];
