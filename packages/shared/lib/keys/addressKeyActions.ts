import { removeAddressKeyRoute, setKeyFlagsRoute, setKeyPrimaryRoute } from '../api/keys';
import type {
    ActiveKeyWithVersion} from '../interfaces';
import {
    type Address,
    type Api,
    type DecryptedKey,
    type KeyTransparencyVerify,
} from '../interfaces';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from './getActiveKeys';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';

export const setPrimaryAddressKey = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const activeKeys = await getActiveAddressKeys(address, address.SignedKeyList, address.Keys, keys);
    const oldActiveKeyV4 = activeKeys.v4.find(({ ID: otherID }) => ID === otherID);
    const oldActiveKeyV6 = oldActiveKeyV4 ? undefined : activeKeys.v6.find(({ ID: otherID }) => ID === otherID);

    if (!oldActiveKeyV4 && !oldActiveKeyV6) {
        throw new Error('Cannot set primary key');
    }
    const getKeysWithUpdatedPrimaryFlag = <V extends ActiveKeyWithVersion>(keys: V[], newPrimaryID: string) =>
        keys
            .map((activeKey) => {
                return {
                    ...activeKey,
                    primary: activeKey.ID === newPrimaryID ? 1 : 0,
                } as const;
            })
            .sort((a, b) => b.primary - a.primary);
    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
        v4: oldActiveKeyV4 ? getKeysWithUpdatedPrimaryFlag(activeKeys.v4, ID) : [...activeKeys.v4],
        v6: oldActiveKeyV6 ? getKeysWithUpdatedPrimaryFlag(activeKeys.v6, ID) : [...activeKeys.v6],
    });
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        address,
        keyTransparencyVerify
    );
    await api(setKeyPrimaryRoute({ ID, SignedKeyList: signedKeyList }));
    await onSKLPublishSuccess();
    const newActivePrimaryKey = oldActiveKeyV4
        ? updatedActiveKeys.v4.find((activeKey) => activeKey.ID === ID)!!
        : updatedActiveKeys.v6.find((activeKey) => activeKey.ID === ID)!!;
    const oldActiveKeys = activeKeys;
    return [newActivePrimaryKey, updatedActiveKeys, oldActiveKeys] as const;
};

export const deleteAddressKey = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const activeKeys = await getActiveAddressKeys(address, address.SignedKeyList, address.Keys, keys);
    const oldActiveKeyV4 = activeKeys.v4.find(({ ID: otherID }) => ID === otherID);
    const oldActiveKeyV6 = oldActiveKeyV4 ? undefined : activeKeys.v6.find(({ ID: otherID }) => ID === otherID);

    if (oldActiveKeyV4?.primary || oldActiveKeyV6?.primary) {
        throw new Error('Cannot delete primary key');
    }
    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
        v4: oldActiveKeyV4 ? activeKeys.v4.filter(({ ID: otherID }) => ID !== otherID) : activeKeys.v4,
        v6: oldActiveKeyV6 ? activeKeys.v6.filter(({ ID: otherID }) => ID !== otherID) : activeKeys.v6,
    });
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        address,
        keyTransparencyVerify
    );
    await api(removeAddressKeyRoute({ ID, SignedKeyList: signedKeyList }));
    await onSKLPublishSuccess();
};

export const setAddressKeyFlags = async (
    api: Api,
    address: Address,
    keys: DecryptedKey[],
    ID: string,
    flags: number,
    keyTransparencyVerify: KeyTransparencyVerify
) => {
    const activeKeys = await getActiveAddressKeys(address, address.SignedKeyList, address.Keys, keys);
    const setFlags = <V extends ActiveKeyWithVersion>(activeKey: V) => {
        if (activeKey.ID === ID) {
            return {
                ...activeKey,
                flags,
            };
        }
        return activeKey;
    };

    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
        v4: activeKeys.v4.map(setFlags),
        v6: activeKeys.v6.map(setFlags),
    });
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        address,
        keyTransparencyVerify
    );
    await api(setKeyFlagsRoute({ ID, Flags: flags, SignedKeyList: signedKeyList }));
    await onSKLPublishSuccess();
};
