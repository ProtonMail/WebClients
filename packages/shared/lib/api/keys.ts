import { AddressKeyPayload, AddressKeyPayloadV2, SignedKeyList } from '../interfaces';

interface GetPublicKeysParams {
    Email: string;
    Fingerprint?: string;
}

export const getPublicKeys = (params: GetPublicKeysParams) => ({
    url: 'keys',
    method: 'get',
    params,
});

export const getKeySalts = () => ({
    url: 'keys/salts',
    method: 'get',
});

interface CreateAddressKeyPayload {
    AddressID: string;
    Primary: number;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}

export const createAddressKeyRoute = (data: CreateAddressKeyPayload) => ({
    url: 'keys',
    method: 'post',
    data,
});

interface CreateAddressKeyPayloadV2 extends CreateAddressKeyPayload {
    Token: string;
    Signature: string;
}

export const createAddressKeyRouteV2 = (data: CreateAddressKeyPayloadV2) => ({
    url: 'keys/address',
    method: 'post',
    data,
});

interface SetupKeysPayload {
    PrimaryKey: string;
    KeySalt: string;
    AddressKeys: (AddressKeyPayload | AddressKeyPayloadV2)[];
}

export const setupKeys = (data: SetupKeysPayload) => ({
    url: 'keys/setup',
    method: 'post',
    data,
});

interface ActivateKeyPayload {
    ID: string;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}

export const activateKeyRoute = ({ ID, ...data }: ActivateKeyPayload) => ({
    url: `keys/${ID}/activate`,
    method: 'put',
    data,
});

interface ActivateKeyPayloadV2 extends ActivateKeyPayload {
    Signature: string;
    Token: string;
}

export const activateKeyRouteV2 = ({ ID, ...data }: ActivateKeyPayloadV2) => ({
    url: `keys/address/${ID}/activate`,
    method: 'put',
    data,
});

export const reactiveLegacyAddressKeyRouteV2 = ({ ID, ...data }: ActivateKeyPayloadV2) => ({
    url: `keys/address/${ID}`,
    method: 'put',
    data,
});

interface ReactivateKeyPayload {
    ID: string;
    PrivateKey: string;
    SignedKeyList?: SignedKeyList;
}

export const reactivateKeyRoute = ({ ID, PrivateKey, SignedKeyList }: ReactivateKeyPayload) => ({
    url: `keys/${ID}`,
    method: 'put',
    data: {
        PrivateKey,
        SignedKeyList,
    },
});

interface ReactivateUserKeyPayloadV2 {
    ID: string;
    PrivateKey: string;
    AddressKeyFingerprints: string[];
    SignedKeyLists: {
        [key: string]: SignedKeyList;
    };
}

export const reactivateUserKeyRouteV2 = ({ ID, ...data }: ReactivateUserKeyPayloadV2) => ({
    url: `keys/user/${ID}`,
    method: 'put',
    data,
});

interface SetKeyPrimaryPayload {
    ID: string;
    SignedKeyList: SignedKeyList;
}

export const setKeyPrimaryRoute = ({ ID, ...data }: SetKeyPrimaryPayload) => ({
    url: `keys/${ID}/primary`,
    method: 'put',
    data,
});

interface SetKeyFlagsPayload {
    ID: string;
    Flags: number;
    SignedKeyList: SignedKeyList;
}

export const setKeyFlagsRoute = ({ ID, ...data }: SetKeyFlagsPayload) => ({
    url: `keys/${ID}/flags`,
    method: 'put',
    data,
});

interface RemoveKeyPayload {
    ID: string;
    SignedKeyList: SignedKeyList;
}

export const removeKeyRoute = ({ ID, ...data }: RemoveKeyPayload) => ({
    url: `keys/${ID}/delete`,
    method: 'put',
    data,
});

export interface UpdatePrivateKeyPayload {
    KeySalt: string;
    Keys: { ID: string; PrivateKey: string }[];
    OrganizationKey?: string;
}

export interface UpdatePrivateKeyPayloadV2 {
    KeySalt: string;
    UserKeys: { ID: string; PrivateKey: string }[];
    OrganizationKey?: string;
}

export const updatePrivateKeyRoute = (data: UpdatePrivateKeyPayload | UpdatePrivateKeyPayloadV2) => ({
    url: 'keys/private',
    method: 'put',
    data,
});

export interface ResetKeysPayload {
    Username: string;
    PrimaryKey?: string;
    Token: string;
    KeySalt: string;
    AddressKeys: AddressKeyPayload[];
}

export interface ResetKeysPayloadV2 extends Omit<ResetKeysPayload, 'AddressKeys'> {
    AddressKeys: AddressKeyPayloadV2[];
}

export const resetKeysRoute = (data: ResetKeysPayload | ResetKeysPayloadV2) => ({
    url: 'keys/reset',
    method: 'post',
    data,
});

interface UpgradeKeyPayload {
    ID: string;
    PrivateKey: string;
}

interface UpgradeKeysPayload {
    KeySalt: string;
    Keys: UpgradeKeyPayload[];
    OrganizationKey?: string;
}

export interface UpgradeAddressKeyPayload {
    ID: string;
    PrivateKey: string;
    Token: string;
    Signature: string;
}

interface UpgradeKeysPayloadV2 {
    KeySalt: string;
    UserKeys: UpgradeKeyPayload[];
    AddressKeys: UpgradeAddressKeyPayload[];
    OrganizationKey?: string;
    SignedKeyLists: {
        [key: string]: SignedKeyList;
    };
}

export const upgradeKeysRoute = (data: UpgradeKeysPayload | UpgradeKeysPayloadV2) => ({
    url: 'keys/private/upgrade',
    method: 'post',
    data,
});
