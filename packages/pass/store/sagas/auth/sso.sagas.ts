import { select } from 'redux-saga/effects';

import { rejectAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces/Key';
import type { User } from '@proton/shared/lib/interfaces/User';
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
import type { MaybeNull } from '../../../types/utils';
import { confirmPendingAuthDevice, getAuthDevices, rejectPendingAuthDevice } from '../../actions/creators/sso';
import { createRequestSaga } from '../../request/sagas';
import { selectAllAddresses, selectUser } from '../../selectors/user';

const authDevices = createRequestSaga({
    actions: getAuthDevices,
    call: function* () {
        const user: MaybeNull<User> = yield select(selectUser);
        const AuthDevices: AuthDeviceOutput[] = yield getAllAuthDevices({ user, api });
        return AuthDevices;
    },
});

const confirmPending = createRequestSaga({
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

        validateAuthDevice({ pendingAuthDevice, deviceSecretData, confirmationCode });

        const keyPassword = getAuthStore().getPassword()!;
        yield activateAuthDevice({ api, keyPassword, deviceSecretData, pendingAuthDevice });

        return pendingAuthDevice.ID;
    },
});

const rejectPending = createRequestSaga({
    actions: rejectPendingAuthDevice,
    call: (pendingAuthDevice) => {
        api(rejectAuthDeviceConfig(pendingAuthDevice.ID)).catch(noop);
        return pendingAuthDevice.ID;
    },
});

export default [authDevices, confirmPending, rejectPending];
