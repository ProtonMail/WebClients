import { AddressKey, SignedKeyList } from '../interfaces';

export const getPublicKeys = (params: { Email: string; Fingerprint?: string }) => ({
    url: 'keys',
    method: 'get',
    params,
});

export const getKeySalts = () => ({
    url: 'keys/salts',
    method: 'get',
});

export const createAddressKeyRoute = (data: {
    AddressID: string;
    Primary: number;
    PrivateKey: string;
    SignedKeyList: SignedKeyList;
}) => ({
    url: 'keys',
    method: 'post',
    data,
});

export const setupKeys = (data: { PrimaryKey: string; KeySalt: string; AddressKeys: AddressKey[] }) => ({
    url: 'keys/setup',
    method: 'post',
    data,
});

/**
 * @param ID
 * @param PrivateKey
 * @param [SignedKeyList] - If activating an address key
 */
export const reactivateKeyRoute = ({
    ID,
    PrivateKey,
    SignedKeyList,
}: {
    ID: string;
    PrivateKey: string;
    SignedKeyList?: SignedKeyList;
}) => ({
    url: `keys/${ID}`,
    method: 'put',
    data: {
        PrivateKey,
        SignedKeyList,
    },
});

export const setKeyPrimaryRoute = ({ ID, SignedKeyList }: { ID: string; SignedKeyList: SignedKeyList }) => ({
    url: `keys/${ID}/primary`,
    method: 'put',
    data: {
        SignedKeyList,
    },
});

export const setKeyFlagsRoute = ({
    ID,
    Flags,
    SignedKeyList,
}: {
    ID: string;
    Flags: number;
    SignedKeyList: SignedKeyList;
}) => ({
    url: `keys/${ID}/flags`,
    method: 'put',
    data: {
        Flags,
        SignedKeyList,
    },
});

export const removeKeyRoute = ({ ID, SignedKeyList }: { ID: string; SignedKeyList: SignedKeyList }) => ({
    url: `keys/${ID}/delete`,
    method: 'put',
    data: {
        SignedKeyList,
    },
});

export const updatePrivateKeyRoute = (data: {
    KeySalt: string;
    Keys: { ID: string; PrivateKey: string }[];
    OrganizationKey?: string;
}) => ({
    url: 'keys/private',
    method: 'put',
    data,
});

export const resetKeysRoute = (data: {
    Username: string;
    PrimaryKey?: string;
    Token: string;
    KeySalt: string;
    AddressKeys: AddressKey[];
}) => ({
    url: 'keys/reset',
    method: 'post',
    data,
});
