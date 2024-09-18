import { CryptoProxy } from '@proton/crypto';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Address, DecryptedAddressKey, DecryptedKey, Key } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { selectAddresses } from '../addresses';
import { selectUserKeys } from '../userKeys';
import {
    type AddressKeysState,
    addressKeysThunk,
    dispatchGetAllAddressesKeys,
    getAllAddressKeysAction,
    selectAddressKeys,
} from './index';

const addressKeyEqualityComparator = (a: Key[] | undefined = [], b: Key[] | undefined = []) => {
    return (
        a &&
        b &&
        a.length === b.length &&
        a.every((value, index) => {
            const otherKey = b[index];
            return isDeepEqual(value, otherKey);
        })
    );
};

const getAddressesWithChangedKeys = (
    currentAddressKeys: AddressKeysState['addressKeys'],
    currentUserKeys: DecryptedKey[],
    nextUserKeys: DecryptedKey[],
    a: Address[],
    b: Address[]
) => {
    const result = (() => {
        // Any user keys changed, return all new addresses.
        if (currentUserKeys !== nextUserKeys) {
            return b;
        }
        const currentAddressesMap = a.reduce<{ [key: string]: Address }>((acc, address) => {
            acc[address.ID] = address;
            return acc;
        }, {});
        return b.filter((address) => {
            return !addressKeyEqualityComparator(address.Keys, currentAddressesMap[address.ID]?.Keys);
        });
    })();
    return result.filter((address) => currentAddressKeys[address.ID]);
};

const getChanges = (currentValue: AddressKeysState['addressKeys'], nextValue: AddressKeysState['addressKeys']) => {
    return Object.entries(currentValue).filter(([addressID, currentValue]) => {
        return currentValue?.value !== nextValue[addressID]?.value;
    });
};

export const addressKeysListener = (startListening: SharedStartListening<AddressKeysState>) => {
    startListening({
        predicate: (action, currentState, nextState) => {
            const currentUserKeys = selectUserKeys(currentState).value;
            const nextUserKeys = selectUserKeys(nextState).value;
            const currentAddresses = selectAddresses(currentState).value || [];
            const nextAddresses = selectAddresses(nextState).value || [];
            const currentAddressKeys = selectAddressKeys(currentState);
            if (
                // Decrypting address keys depend on user keys, so if they change we assume it should get recomputed.
                (currentUserKeys !== nextUserKeys ||
                    // Addresses changed and address keys have been computed.
                    currentAddresses !== nextAddresses) &&
                Object.keys(currentAddressKeys).length > 0
            ) {
                return true;
            }
            return false;
        },
        effect: async (action, listenerApi) => {
            const currentState = listenerApi.getOriginalState();
            const nextState = listenerApi.getState();
            const currentAddressKeys = selectAddressKeys(currentState);
            const currentUserKeys = selectUserKeys(currentState)?.value || [];
            const nextUserKeys = selectUserKeys(nextState)?.value || [];
            const currentAddresses = selectAddresses(currentState)?.value || [];
            const nextAddresses = selectAddresses(nextState)?.value || [];
            const changedAddresses = getAddressesWithChangedKeys(
                currentAddressKeys,
                currentUserKeys,
                nextUserKeys,
                currentAddresses,
                nextAddresses
            );
            if (!changedAddresses.length) {
                return;
            }
            await Promise.all(
                changedAddresses.map((address) =>
                    listenerApi.dispatch(addressKeysThunk({ addressID: address.ID, cache: CacheType.None }))
                )
            );
        },
    });

    startListening({
        predicate: (action, currentState, nextState) => {
            const oldValue = selectAddressKeys(currentState);
            const newValue = selectAddressKeys(nextState);
            const changes = getChanges(oldValue, newValue);
            return changes.length > 0;
        },
        effect: (action, listenerApi) => {
            const clear = (addressID: string, oldValue: DecryptedAddressKey[] | undefined) => {
                return Promise.all(
                    (oldValue || []).map(async (cachedKey) => {
                        if (cachedKey?.privateKey) {
                            await CryptoProxy.clearKey({ key: cachedKey.privateKey }).catch(noop);
                        }
                        if (cachedKey?.publicKey) {
                            await CryptoProxy.clearKey({ key: cachedKey.publicKey }).catch(noop);
                        }
                        return undefined;
                    })
                );
            };
            const oldValue = selectAddressKeys(listenerApi.getOriginalState());
            const newValue = selectAddressKeys(listenerApi.getState());
            const changes = getChanges(oldValue, newValue);
            return Promise.all(
                changes.map(async ([addressID, oldValue]) => {
                    return clear(addressID, oldValue?.value);
                })
            ).then(() => undefined);
        },
    });

    startListening({
        actionCreator: getAllAddressKeysAction,
        effect: async (action, listenerApi) => {
            await dispatchGetAllAddressesKeys(listenerApi.dispatch);
        },
    });
};
