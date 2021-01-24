import { encryptPrivateKey } from 'pmcrypto';
import { Address, Api, DecryptedKey, UserModel as tsUserModel } from '../interfaces';
import { MEMBER_PRIVATE } from '../constants';
import { getSignedKeyList } from './signedKeyList';
import { activateKeyRoute } from '../api/keys';
import { getActiveKeys } from './getActiveKeys';

export const getAddressesWithKeysToActivate = (user: tsUserModel, addresses: Address[]) => {
    // If signed in as subuser, or not a readable member
    if (!user || !addresses || user.OrganizationPrivateKey || user.Private !== MEMBER_PRIVATE.READABLE) {
        return [];
    }
    return addresses.filter(({ Keys = [] }) => {
        return Keys.some(({ Activation }) => !!Activation);
    });
};

interface Args {
    address: Address;
    addressKeys: DecryptedKey[];
    keyPassword: string;
    api: Api;
}

export const activateMemberAddressKeys = async ({ address, addressKeys, keyPassword, api }: Args) => {
    if (!addressKeys.length) {
        return;
    }
    if (!keyPassword) {
        throw new Error('Password required to generate keys');
    }
    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, addressKeys);
    for (const addressKey of addressKeys) {
        const { ID, privateKey } = addressKey;
        const Key = address.Keys.find(({ ID: otherID }) => otherID === ID);
        if (!Key?.Activation || !privateKey) {
            continue;
        }
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, keyPassword);
        const SignedKeyList = await getSignedKeyList(activeKeys);

        await api(activateKeyRoute({ ID, PrivateKey: encryptedPrivateKey, SignedKeyList }));
    }
};
