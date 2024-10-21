import { c } from 'ttag';

import { activateAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { Address, Api, DecryptedKey } from '@proton/shared/lib/interfaces';

import {
    type AuthDeviceOutput,
    type DeviceSecretData,
    decryptAuthDeviceActivationToken,
    encryptAuthDeviceSecret,
    getValidActivation,
} from './device';

export class ConfirmAuthDeviceError extends Error {}

export const getAuthDeviceActivation = ({
    addresses,
    pendingAuthDevice,
}: {
    addresses: Address[];
    pendingAuthDevice: AuthDeviceOutput;
}) => {
    const activation = getValidActivation({ addresses, pendingAuthDevice });
    if (!activation) {
        throw new ConfirmAuthDeviceError('Unable to find address for device');
    }
    return activation;
};

export const decryptAuthDeviceActivation = async ({
    deviceID,
    addressKeys,
    token,
}: {
    deviceID: string;
    addressKeys: DecryptedKey[];
    token: string;
}) => {
    try {
        const deviceSecretData = await decryptAuthDeviceActivationToken({
            deviceID,
            decryptionKeys: addressKeys.map(({ privateKey }) => privateKey),
            armoredMessage: token,
        });
        return deviceSecretData;
    } catch {
        throw new ConfirmAuthDeviceError('Unable to decrypt activation token');
    }
};

export const validateAuthDevice = ({
    deviceSecretData,
    confirmationCode,
}: {
    deviceSecretData: DeviceSecretData;
    confirmationCode: string;
}) => {
    if (deviceSecretData.confirmationCode !== confirmationCode) {
        throw new ConfirmAuthDeviceError(c('sso').t`Invalid confirmation code`);
    }
};

export const activateAuthDevice = async ({
    api,
    keyPassword,
    deviceSecretData,
    pendingAuthDevice,
}: {
    api: Api;
    keyPassword: string;
    deviceSecretData: DeviceSecretData;
    pendingAuthDevice: AuthDeviceOutput;
}) => {
    try {
        const encryptedSecret = await encryptAuthDeviceSecret({
            keyPassword,
            deviceSecretData,
        });
        await api(
            activateAuthDeviceConfig({
                DeviceID: pendingAuthDevice.ID,
                EncryptedSecret: encryptedSecret,
            })
        );
    } catch (error) {
        const { message } = getApiError(error);
        throw new ConfirmAuthDeviceError(message || 'Failed to activate device');
    }
};
