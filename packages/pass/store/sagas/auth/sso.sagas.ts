import { select } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import {
    confirmPendingAuthDevice,
    getAuthDevices,
    rejectPendingAuthDevice,
} from '@proton/pass/store/actions/creators/sso';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectAllAddresses, selectUser } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
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
