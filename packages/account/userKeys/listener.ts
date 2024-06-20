import { CryptoProxy } from '@proton/crypto';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import type { Key } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { selectUser } from '../user';
import { type UserKeysState, selectUserKeys, userKeysThunk } from './index';

export const userKeysListener = (startListening: SharedStartListening<UserKeysState>) => {
    const keyEqualityComparator = (a: Key[] | undefined = [], b: Key[] | undefined = []) => {
        return a.length === b.length && a.every((value, index) => value.PrivateKey === b[index]?.PrivateKey);
    };

    startListening({
        predicate: (action, currentState, nextState) => {
            const currentUser = selectUser(currentState);
            const nextUser = selectUser(nextState);
            const currentKeys = selectUserKeys(currentState).value;
            if (
                currentKeys &&
                currentUser !== nextUser &&
                !keyEqualityComparator(currentUser.value?.Keys, nextUser.value?.Keys)
            ) {
                return true;
            }
            return false;
        },
        effect: async (action, listenerApi) => {
            await listenerApi.dispatch(userKeysThunk({ cache: 'no-cache' }));
        },
    });

    startListening({
        predicate: (action, currentState, nextState) => {
            const oldValue = selectUserKeys(currentState).value;
            const newValue = selectUserKeys(nextState).value;
            return !!oldValue && oldValue !== newValue;
        },
        effect: async (action, listenerApi) => {
            const oldValue = selectUserKeys(listenerApi.getOriginalState())?.value;
            await Promise.all(
                (oldValue || [])?.map(async (cachedKey) => {
                    if (cachedKey?.privateKey) {
                        await CryptoProxy.clearKey({ key: cachedKey.privateKey }).catch(noop);
                    }
                    if (cachedKey?.publicKey) {
                        await CryptoProxy.clearKey({ key: cachedKey.publicKey }).catch(noop);
                    }
                    return undefined;
                })
            );
        },
    });
};
