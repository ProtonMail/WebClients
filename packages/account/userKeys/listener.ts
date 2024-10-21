import { CryptoProxy } from '@proton/crypto';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import type { Key } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { selectUser } from '../user';
import { type UserKeysState, selectUserKeys, userKeysThunk } from './index';

export const userKeysListener = (startListening: SharedStartListening<UserKeysState>) => {
    const keyEqualityComparator = (a: Key[] | undefined = [], b: Key[] | undefined = []) => {
        return a.length === b.length && a.every((value, index) => value.PrivateKey === b[index]?.PrivateKey);
    };

    startListening({
        predicate: (action, currentState, previousState) => {
            const currentUser = selectUser(currentState);
            const previousUser = selectUser(previousState);
            const previousKeys = selectUserKeys(previousState).value;
            return Boolean(
                previousKeys &&
                    previousUser !== currentUser &&
                    !keyEqualityComparator(currentUser.value?.Keys, previousUser.value?.Keys)
            );
        },
        effect: (action, listenerApi) => {
            listenerApi.dispatch(userKeysThunk({ cache: CacheType.None })).catch(noop);
        },
    });

    startListening({
        predicate: (action, currentState, previousState) => {
            const newValue = selectUserKeys(currentState).value;
            const oldValue = selectUserKeys(previousState).value;
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
