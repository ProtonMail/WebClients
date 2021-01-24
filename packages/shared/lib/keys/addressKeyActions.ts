import { removeKeyRoute, setKeyFlagsRoute, setKeyPrimaryRoute } from '../api/keys';
import { Address, Api, DecryptedKey } from '../interfaces';
import { getSignedKeyList } from './signedKeyList';
import { getActiveKeys } from './getActiveKeys';

export const setPrimaryAddressKey = async (api: Api, address: Address, keys: DecryptedKey[], ID: string) => {
    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, keys);
    const oldActiveKey = activeKeys.find(({ ID: otherID }) => ID === otherID);
    if (!oldActiveKey) {
        throw new Error('Cannot set primary key');
    }
    const updatedActiveKeys = activeKeys
        .map((activeKey) => {
            return {
                ...activeKey,
                primary: activeKey.ID === ID ? 1 : 0,
            } as const;
        })
        .sort((a, b) => b.primary - a.primary);
    const signedKeyList = await getSignedKeyList(updatedActiveKeys);
    await api(setKeyPrimaryRoute({ ID, SignedKeyList: signedKeyList }));
};

export const deleteAddressKey = async (api: Api, address: Address, keys: DecryptedKey[], ID: string) => {
    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, keys);
    const oldActiveKey = activeKeys.find(({ ID: otherID }) => ID === otherID);
    if (oldActiveKey?.primary) {
        throw new Error('Cannot delete primary key');
    }
    const updatedActiveKeys = activeKeys.filter(({ ID: otherID }) => ID !== otherID);
    const signedKeyList = await getSignedKeyList(updatedActiveKeys);
    await api(removeKeyRoute({ ID, SignedKeyList: signedKeyList }));
};

export const setAddressKeyFlags = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    flags: number
) => {
    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, keys);
    const updatedActiveKeys = activeKeys.map((activeKey) => {
        if (activeKey.ID === ID) {
            return {
                ...activeKey,
                flags,
            };
        }
        return activeKey;
    });
    const signedKeyList = await getSignedKeyList(updatedActiveKeys);
    await api(setKeyFlagsRoute({ ID, Flags: flags, SignedKeyList: signedKeyList }));
};
