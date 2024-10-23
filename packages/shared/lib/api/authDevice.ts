export enum AuthDeviceErrorCodes {
    AUTH_DEVICE_NOT_FOUND = 10_300,
    AUTH_DEVICE_NOT_ACTIVE = 10_301,
    AUTH_DEVICE_TOKEN_INVALID = 10_302,
    AUTH_DEVICE_REJECTED = 10_303,
}

export const addAuthDeviceConfig = (data: { Name: string; ActivationToken?: string }) => ({
    method: 'post',
    url: 'auth/v4/devices',
    data,
});

export const activateAuthDeviceConfig = ({ DeviceID, ...data }: { DeviceID: string; EncryptedSecret: string }) => ({
    method: 'post',
    url: `auth/v4/devices/${DeviceID}`,
    data,
});

export const associateAuthDeviceConfig = ({ DeviceID, ...data }: { DeviceID: string; DeviceToken: string }) => ({
    method: 'post',
    url: `auth/v4/devices/${DeviceID}/associate`,
    data,
});

export const getAuthDevicesConfig = () => ({
    method: 'get',
    url: `auth/v4/devices`,
});

export const deleteAuthDeviceConfig = (deviceID: string) => ({
    method: 'delete',
    url: `auth/v4/devices/${deviceID}`,
});

export const deleteAllOtherAuthDeviceConfig = () => ({
    method: 'delete',
    url: `auth/v4/devices`,
});

export const rejectAuthDeviceConfig = (deviceID: string) => ({
    method: 'put',
    url: `auth/v4/devices/${deviceID}/reject`,
});

export const askAdminConfig = (deviceID: string) => ({
    method: 'put',
    url: `auth/v4/devices/${deviceID}/admin`,
});

export const getPendingMemberAuthDevicesConfig = () => ({
    method: 'get',
    url: `core/v4/members/devices/pending`,
});

export const activateMemberAuthDeviceConfig = ({
    MemberID,
    ...data
}: {
    MemberID: string;
    AuthDeviceID: string;
    EncryptedSecret: string;
    UserKeys: { ID: string; PrivateKey: string }[];
}) => ({
    method: 'post',
    url: `core/v4/members/${MemberID}/devices/reset`,
    data,
});

export const rejectMemberAuthDeviceConfig = ({ MemberID, DeviceID }: { MemberID: string; DeviceID: string }) => ({
    method: 'put',
    url: `core/v4/members/${MemberID}/devices/${DeviceID}/reject`,
});
