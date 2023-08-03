import { removeKeyRoute, setKeyFlagsRoute, setKeyPrimaryRoute } from '../api/keys';
import { Address, Api, DecryptedKey, KeyTransparencyVerify } from '../interfaces';
import { getActiveKeys, getNormalizedActiveKeys } from './getActiveKeys';
import { getSignedKeyList } from './signedKeyList';

export const setPrimaryAddressKey = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, keys);
    const oldActiveKey = activeKeys.find(({ ID: otherID }) => ID === otherID);
    if (!oldActiveKey) {
        throw new Error('Cannot set primary key');
    }
    const updatedActiveKeys = getNormalizedActiveKeys(
        address,
        activeKeys
            .map((activeKey) => {
                return {
                    ...activeKey,
                    primary: activeKey.ID === ID ? 1 : 0,
                } as const;
            })
            .sort((a, b) => b.primary - a.primary)
    );
    const signedKeyList = await getSignedKeyList(updatedActiveKeys, address, keyTransparencyVerify);
    await api(setKeyPrimaryRoute({ ID, SignedKeyList: signedKeyList }));
    const newActivePrimaryKey = updatedActiveKeys.find((activeKey) => activeKey.ID === ID)!!;
    return [newActivePrimaryKey, updatedActiveKeys] as const;
};

export const deleteAddressKey = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, keys);
    const oldActiveKey = activeKeys.find(({ ID: otherID }) => ID === otherID);
    if (oldActiveKey?.primary) {
        throw new Error('Cannot delete primary key');
    }
    const updatedActiveKeys = getNormalizedActiveKeys(
        address,
        activeKeys.filter(({ ID: otherID }) => ID !== otherID)
    );
    const signedKeyList = await getSignedKeyList(updatedActiveKeys, address, keyTransparencyVerify);
    await api(removeKeyRoute({ ID, SignedKeyList: signedKeyList }));
};

export const setAddressKeyFlags = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    flags: number,
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, keys);
    const updatedActiveKeys = getNormalizedActiveKeys(
        address,
        activeKeys.map((activeKey) => {
            if (activeKey.ID === ID) {
                return {
                    ...activeKey,
                    flags,
                };
            }
            return activeKey;
        })
    );
    const signedKeyList = await getSignedKeyList(updatedActiveKeys, address, keyTransparencyVerify);
    await api(setKeyFlagsRoute({ ID, Flags: flags, SignedKeyList: signedKeyList }));
};
