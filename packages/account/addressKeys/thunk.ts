import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk } from '@proton/redux-utilities';
import authentication from '@proton/shared/lib/authentication/authentication';
import { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys';
import { getInactiveKeys } from '@proton/shared/lib/keys/getInactiveKeys';

import { addressesThunk } from '../addresses';
import { inactiveKeysActions } from '../inactiveKeys';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { AddressKeysState, selectAddressKeys } from './index';

export const addressKeysModelThunk = createAsyncModelThunk<
    DecryptedAddressKey[],
    AddressKeysState,
    ProtonThunkArguments,
    string
>(`addressKeys/fetch`, {
    miss: async ({ dispatch, options }) => {
        const addressID = options?.thunkArg;
        if (addressID === undefined) {
            return [];
        }

        const [user, userKeys, addresses] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
        ]);

        const address = addresses.find(({ ID: AddressID }) => AddressID === addressID);
        if (!address) {
            dispatch(inactiveKeysActions.set({ id: addressID, value: [] }));
            return [];
        }

        const keys = await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, authentication.getPassword());

        const inactiveKeys = await getInactiveKeys(address.Keys, keys);
        dispatch(inactiveKeysActions.set({ id: address.ID, value: inactiveKeys }));

        return keys;
    },
    previous: ({ getState, options }) => {
        const addressID = options?.thunkArg;
        const old = selectAddressKeys(getState())?.[addressID || ''];
        return {
            value: old?.value,
            error: old?.error,
        };
    },
});
