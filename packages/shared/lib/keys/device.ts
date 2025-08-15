import { base32crockford } from '@scure/base';
import { c } from 'ttag';

import { CryptoProxy, type PrivateKeyReference } from '@proton/crypto';
import { decryptData, encryptData, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUser } from '@proton/shared/lib/api/user';
import { API_CODES } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { getBrowser, getOs } from '@proton/shared/lib/helpers/browser';
import { getSHA256String } from '@proton/shared/lib/helpers/crypto';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { getIsGlobalSSOAccount } from '@proton/shared/lib/keys/setupAddress';
import noop from '@proton/utils/noop';

import {
    AuthDeviceErrorCodes,
    addAuthDeviceConfig,
    associateAuthDeviceConfig,
    deleteAuthDeviceConfig,
    getAuthDevicesConfig,
    getPendingMemberAuthDevicesConfig,
} from '../api/authDevice';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';
import type { Address, AddressKey, Api, User, User as tsUser } from '../interfaces';

const AesContext = {
    deviceSecret: 'account.device-secret',
};

export enum AuthDeviceState {
    Inactive = 0,
    Active = 1,
    PendingActivation = 2,
    PendingAdminActivation = 3,
    Rejected = 4,
    NoSession = 5,
}

export interface DeviceSecretData {
    data: Uint8Array<ArrayBuffer>;
    serializedData: string;
    key: CryptoKey;
    confirmationCode: string;
}

export interface DeviceDataSerialized {
    deviceSecretData: DeviceSecretData;
    serializedDeviceData: SerializedAuthDeviceData;
}

export interface DeviceData {
    deviceSecretData: DeviceSecretData;
    deviceOutput: AuthDeviceOutput;
}

export interface DeviceSecretUser {
    deviceSecretData: DeviceSecretData;
    keyPassword: string;
    user: User;
    serializedDeviceData: SerializedAuthDeviceData;
}

export class AuthDeviceInactiveError extends Error {
    deviceDataSerialized: DeviceDataSerialized;

    constructor(deviceDataSerialized: DeviceDataSerialized) {
        super('AuthDeviceInactiveError');
        this.deviceDataSerialized = deviceDataSerialized;
        Object.setPrototypeOf(this, AuthDeviceInactiveError.prototype);
    }
}

export class AuthDeviceInvalidError extends Error {
    deviceID: string;

    context: string;

    constructor(deviceID: string, context: string) {
        super('AuthDeviceInvalidError');
        this.deviceID = deviceID;
        this.context = context;
        Object.setPrototypeOf(this, AuthDeviceInvalidError.prototype);
    }
}

export class AuthDeviceNonExistingError extends Error {}

type DevicePlatform = 'Web' | 'Windows' | 'macOS' | 'Linux' | 'Android' | 'AndroidTV' | 'iOS' | 'AppleTV';

export interface AuthDeviceOutput {
    ID: string;
    State: AuthDeviceState;
    Name: string;
    LocalizedClientName: string;
    Platform: DevicePlatform;
    CreateTime: number;
    ActivateTime?: number;
    RejectTime: number;
    LastActivityTime: number;
    ActivationToken?: string;
    ActivationAddressID?: string;
    DeviceToken: string;
}

export interface MemberAuthDeviceOutput extends AuthDeviceOutput {
    MemberID: string;
}

export interface AuthDevicesOutput {
    AuthDevices: AuthDeviceOutput[];
}

export interface AssociateAuthDeviceOutput {
    ID: string;
    EncryptedSecret: string;
}

export const deserializeAuthDeviceSecret = (value: string) => {
    return base64StringToUint8Array(value);
};

const serializeAuthDeviceSecret = (value: Uint8Array<ArrayBuffer>) => {
    return uint8ArrayToBase64String(value);
};

export const getAuthDeviceSecretConfirmationCode = async (data: string) => {
    const sha256DeviceSecret = await getSHA256String(data);
    return base32crockford.encode(stringToUtf8Array(sha256DeviceSecret)).slice(0, 4);
};

export const deserializeAuthDeviceSecretData = async (
    deviceID: string,
    serializedData: string
): Promise<DeviceSecretData> => {
    try {
        const data = deserializeAuthDeviceSecret(serializedData);
        const key = await importKey(data);
        return {
            data,
            key,
            serializedData,
            confirmationCode: await getAuthDeviceSecretConfirmationCode(serializedData),
        };
    } catch {
        throw new AuthDeviceInvalidError(deviceID, 'Unable to deserialize');
    }
};

export const generateAuthDeviceSecretData = async (): Promise<DeviceSecretData> => {
    const data = crypto.getRandomValues(new Uint8Array(32));
    const serializedData = serializeAuthDeviceSecret(data);
    const key = await importKey(data);

    return {
        data,
        serializedData,
        key,
        confirmationCode: await getAuthDeviceSecretConfirmationCode(serializedData),
    };
};

const getDeviceName = () => {
    const browserVendor = getBrowser();
    const osVendor = getOs();
    let osVendorName = osVendor.name;
    if (osVendorName === 'Mac OS') {
        osVendorName = 'macOS';
    }
    return [browserVendor.name, osVendorName].filter(Boolean).join(', ') || 'Browser';
};

export const createAuthDevice = async ({ api }: { api: Api }): Promise<DeviceData> => {
    const deviceSecretData = await generateAuthDeviceSecretData();
    const name = getDeviceName();
    const deviceOutput = await api<{
        AuthDevice: AuthDeviceOutput;
    }>(addAuthDeviceConfig({ Name: name })).then(({ AuthDevice }) => AuthDevice);
    return {
        deviceSecretData,
        deviceOutput,
    };
};

const encryptAuthDeviceActivationToken = async ({
    primaryAddressKey,
    deviceSecretData,
}: {
    primaryAddressKey: AddressKey;
    deviceSecretData: DeviceSecretData;
}) => {
    const publicKey = await CryptoProxy.importPublicKey({ armoredKey: primaryAddressKey.PrivateKey });
    const { message } = await CryptoProxy.encryptMessage({
        encryptionKeys: [publicKey],
        textData: deviceSecretData.serializedData,
    });
    await CryptoProxy.clearKey({ key: publicKey });
    return message;
};

export const decryptAuthDeviceActivationToken = async ({
    deviceID,
    decryptionKeys,
    armoredMessage,
}: {
    deviceID: string;
    decryptionKeys: PrivateKeyReference[];
    armoredMessage: string;
}): Promise<DeviceSecretData> => {
    const { data } = await CryptoProxy.decryptMessage({
        decryptionKeys,
        armoredMessage,
    });
    return deserializeAuthDeviceSecretData(deviceID, data);
};

export const createAuthDeviceToActivate = async ({
    api,
    primaryAddressKey,
}: {
    api: Api;
    primaryAddressKey: AddressKey;
}): Promise<DeviceData> => {
    const deviceSecretData = await generateAuthDeviceSecretData();
    const name = getDeviceName();
    const activationToken = await encryptAuthDeviceActivationToken({ primaryAddressKey, deviceSecretData });

    const deviceOutput = await api<{ AuthDevice: AuthDeviceOutput }>(
        addAuthDeviceConfig({
            Name: name,
            ActivationToken: activationToken,
        })
    ).then(({ AuthDevice }) => AuthDevice);

    return {
        deviceSecretData,
        deviceOutput,
    };
};

export const encryptAuthDeviceSecret = async ({
    keyPassword,
    deviceSecretData,
}: {
    keyPassword: string;
    deviceSecretData: DeviceSecretData;
}) => {
    const encryptedSecret = await encryptData(
        deviceSecretData.key,
        stringToUtf8Array(keyPassword),
        stringToUtf8Array(AesContext.deviceSecret)
    );
    return uint8ArrayToBase64String(encryptedSecret);
};

export const getDecryptedAuthDeviceSecret = async ({
    encryptedSecret,
    deviceDataSerialized,
}: {
    encryptedSecret: string;
    deviceDataSerialized: DeviceDataSerialized;
}) => {
    try {
        const decryptedSecret = await decryptData(
            deviceDataSerialized.deviceSecretData.key,
            base64StringToUint8Array(encryptedSecret),
            stringToUtf8Array(AesContext.deviceSecret)
        );
        return utf8ArrayToString(decryptedSecret);
    } catch {
        throw new AuthDeviceInvalidError(deviceDataSerialized.serializedDeviceData.id, 'Unable to decrypt');
    }
};

const getStorageKey = (userID: string) => {
    return `ds-${userID}`;
};

interface SerializedAuthDeviceData {
    id: string;
    token: string;
    secret: string;
    persistedAt: number;
}

const serializeAuthDeviceData = (deviceData: DeviceData): string => {
    const serializedData: SerializedAuthDeviceData = {
        id: deviceData.deviceOutput.ID,
        token: deviceData.deviceOutput.DeviceToken,
        secret: deviceData.deviceSecretData.serializedData,
        persistedAt: Date.now(),
    };
    return JSON.stringify(serializedData);
};

const deserializeAuthDeviceData = (data: string | null | undefined): SerializedAuthDeviceData | undefined => {
    if (!data) {
        return;
    }
    try {
        const parsedJson: SerializedAuthDeviceData = JSON.parse(data);
        if (parsedJson.token && parsedJson.secret && parsedJson.id) {
            return {
                id: parsedJson.id,
                token: parsedJson.token,
                secret: parsedJson.secret,
                persistedAt: Number(parsedJson.persistedAt),
            };
        }
    } catch {}
};

const getEncryptedAuthDeviceSecret = async ({
    api,
    deviceDataSerialized,
}: {
    api: Api;
    deviceDataSerialized: DeviceDataSerialized;
}) => {
    try {
        const {
            AuthDevice: { EncryptedSecret },
        } = await api<{ AuthDevice: AssociateAuthDeviceOutput }>(
            associateAuthDeviceConfig({
                DeviceID: deviceDataSerialized.serializedDeviceData.id,
                DeviceToken: deviceDataSerialized.serializedDeviceData.token,
            })
        );
        return EncryptedSecret;
    } catch (e) {
        const { status, code } = getApiError(e);
        if (
            code === AuthDeviceErrorCodes.AUTH_DEVICE_NOT_FOUND ||
            code === AuthDeviceErrorCodes.AUTH_DEVICE_TOKEN_INVALID ||
            code === AuthDeviceErrorCodes.AUTH_DEVICE_REJECTED ||
            (status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY && code === API_CODES.NOT_ALLOWED_ERROR)
        ) {
            throw new AuthDeviceInvalidError(deviceDataSerialized.serializedDeviceData.id, 'API invalid');
        }

        if (code === AuthDeviceErrorCodes.AUTH_DEVICE_NOT_ACTIVE) {
            throw new AuthDeviceInactiveError(deviceDataSerialized);
        }

        throw e;
    }
};

export const getPersistedAuthDeviceDataByUser = ({ user }: { user: User }) => {
    try {
        return deserializeAuthDeviceData(getItem(getStorageKey(user.ID)));
    } catch {}
};

export const setPersistedAuthDeviceDataByUser = async ({
    user,
    deviceData,
}: {
    user: User;
    deviceData: DeviceData;
}) => {
    setItem(getStorageKey(user.ID), serializeAuthDeviceData(deviceData));
};

export const removePersistedAuthDeviceDataByUser = ({ user, deviceID }: { user: User; deviceID: string }) => {
    const persistedAuthDevice = getPersistedAuthDeviceDataByUser({ user });
    // We're only storing one device per user, and to avoid race conditions we need to verify that the persisted device id
    // is the same one (or missing) that we want to remove.
    if (!persistedAuthDevice || persistedAuthDevice.id === deviceID) {
        removeItem(getStorageKey(user.ID));
    }
};

export const getDeserializedDeviceSecretData = async (
    serializedDeviceData: SerializedAuthDeviceData
): Promise<DeviceDataSerialized> => {
    const deviceSecretData = await deserializeAuthDeviceSecretData(
        serializedDeviceData.id,
        serializedDeviceData.secret
    );
    return {
        deviceSecretData,
        serializedDeviceData,
    };
};

export const getDeviceSecretDataByUser = async ({ user }: { user: User }) => {
    const serializedDeviceData = getPersistedAuthDeviceDataByUser({ user });
    if (!serializedDeviceData) {
        throw new AuthDeviceNonExistingError();
    }
    const deviceDataSerialized = await getDeserializedDeviceSecretData(serializedDeviceData);
    return deviceDataSerialized.deviceSecretData;
};

export const getAuthDeviceDataByUser = async ({
    user: cachedUser,
    api,
    refreshUser,
}: {
    user: User;
    api: Api;
    refreshUser?: boolean;
}): Promise<DeviceSecretUser> => {
    const serializedDeviceData = getPersistedAuthDeviceDataByUser({ user: cachedUser });
    if (!serializedDeviceData) {
        throw new AuthDeviceNonExistingError();
    }

    const deviceDataSerialized = await getDeserializedDeviceSecretData(serializedDeviceData);
    const { deviceSecretData } = deviceDataSerialized;
    const encryptedSecret = await getEncryptedAuthDeviceSecret({ api, deviceDataSerialized });
    const keyPassword = await getDecryptedAuthDeviceSecret({ encryptedSecret, deviceDataSerialized });

    const user = !refreshUser ? cachedUser : await api<{ User: tsUser }>(getUser()).then(({ User }) => User);
    const armoredPrimaryPrivateKey = user.Keys[0]?.PrivateKey;
    const primaryPrivateKey = await CryptoProxy.importPrivateKey({
        armoredKey: armoredPrimaryPrivateKey,
        passphrase: keyPassword,
    }).catch(noop);

    if (!primaryPrivateKey) {
        throw new AuthDeviceInvalidError(deviceDataSerialized.serializedDeviceData.id, 'Unable to decrypt primary key');
    }

    return {
        serializedDeviceData,
        deviceSecretData,
        keyPassword,
        user,
    };
};

export const getPendingMemberAuthDevices = async ({ api }: { api: Api }) => {
    const { MemberAuthDevices } = await api<{
        MemberAuthDevices: MemberAuthDeviceOutput[];
    }>(getPendingMemberAuthDevicesConfig());
    return MemberAuthDevices;
};

export const getValidActivation = ({
    addresses,
    pendingAuthDevice,
}: {
    addresses: Pick<Address, 'ID' | 'Email'>[];
    pendingAuthDevice: AuthDeviceOutput;
}) => {
    const { ActivationAddressID: activationAddressID, ActivationToken: activationToken } = pendingAuthDevice;
    if (!activationAddressID || !activationToken) {
        return null;
    }
    const address = addresses.find(({ ID }) => ID === activationAddressID);
    if (!address) {
        return null;
    }
    return {
        address,
        token: activationToken,
    };
};

export const getLocalizedDeviceState = (state: AuthDeviceState) => {
    switch (state) {
        case AuthDeviceState.Active:
            return c('sso: auth device state').t`Active`;
        case AuthDeviceState.Inactive:
            return c('sso: auth device state').t`Inactive`;
        case AuthDeviceState.NoSession:
            return c('sso: auth device state').t`Signed out`;
        case AuthDeviceState.PendingActivation:
            return c('sso: auth device state').t`Pending activation`;
        case AuthDeviceState.PendingAdminActivation:
            return c('sso: auth device state').t`Pending admin activation`;
        case AuthDeviceState.Rejected:
            return c('sso: auth device state').t`Rejected`;
    }
    return c('sso: auth device state').t`Unknown`;
};

export const getAllAuthDevices = async ({
    user,
    api,
}: {
    user: User | null | undefined;
    api: Api;
}): Promise<AuthDeviceOutput[]> => {
    if (user && getIsGlobalSSOAccount(user)) {
        try {
            const { AuthDevices } = await api<AuthDevicesOutput>({
                silence: true,
                ...getAuthDevicesConfig(),
            });
            return AuthDevices;
        } catch {
            return [];
        }
    }
    return [];
};

export const deleteAuthDevice = async ({
    user,
    api,
    deviceID,
}: {
    // If the deletion of this auth device should happen locally too
    user?: User;
    api: Api;
    deviceID: string;
}) => {
    if (user) {
        removePersistedAuthDeviceDataByUser({ user, deviceID });
    }
    return api(deleteAuthDeviceConfig(deviceID));
};
