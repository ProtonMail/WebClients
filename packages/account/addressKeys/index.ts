import {
    type PayloadAction,
    type UnknownAction,
    createAction,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createPromiseMapCache } from '@proton/redux-utilities';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys';
import { getInactiveKeys } from '@proton/shared/lib/keys/getInactiveKeys';

import { type AddressesState, addressesThunk } from '../addresses';
import { inactiveKeysActions } from '../inactiveKeys';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';

const name = 'addressKeys';

export interface AddressKeysState extends UserState, AddressesState, UserKeysState {
    [name]: { [id: string]: ModelState<DecryptedAddressKey[]> };
}

type SliceState = AddressKeysState[typeof name];
type Model = SliceState;

export const selectAddressKeys = (state: AddressKeysState) => state.addressKeys;

const initialState: Model = {};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state, action: PayloadAction<{ id: string }>) => {
            const oldValue = state[action.payload.id];
            if (oldValue && oldValue.error) {
                oldValue.error = undefined;
            }
        },
        fulfilled: (state, action: PayloadAction<{ id: string; value: DecryptedAddressKey[] }>) => {
            state[action.payload.id] = { value: action.payload.value, error: undefined };
        },
        rejected: (state, action: PayloadAction<{ id: string; value: any }>) => {
            state[action.payload.id] = { value: undefined, error: action.payload.value };
        },
    },
});

const promiseCache = createPromiseMapCache<DecryptedAddressKey[]>();

export const addressKeysThunk = ({
    addressID,
    forceFetch,
}: {
    addressID: string;
    forceFetch?: boolean;
}): ThunkAction<Promise<DecryptedAddressKey[]>, AddressKeysState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            const oldValue = selectAddressKeys(getState())?.[addressID || '']?.value;
            if (oldValue !== undefined && !forceFetch) {
                return Promise.resolve(oldValue);
            }
        };
        const cb = async () => {
            try {
                const [user, userKeys, addresses] = await Promise.all([
                    dispatch(userThunk()),
                    dispatch(userKeysThunk()),
                    dispatch(addressesThunk()),
                ]);

                const address = addresses.find(({ ID: AddressID }) => AddressID === addressID);
                if (!address) {
                    dispatch(inactiveKeysActions.set({ id: addressID, value: [] }));
                    dispatch(slice.actions.fulfilled({ id: addressID, value: [] }));
                    return [];
                }

                dispatch(slice.actions.pending({ id: addressID }));

                const keys = await getDecryptedAddressKeysHelper(
                    address.Keys,
                    user,
                    userKeys,
                    extraArgument.authentication.getPassword()
                );

                const inactiveKeys = await getInactiveKeys(address.Keys, keys);

                dispatch(inactiveKeysActions.set({ id: addressID, value: inactiveKeys }));
                dispatch(slice.actions.fulfilled({ id: addressID, value: keys }));

                return keys;
            } catch (error) {
                dispatch(inactiveKeysActions.set({ id: addressID, value: [] }));
                dispatch(slice.actions.rejected({ id: addressID, value: miniSerializeError(error) }));
                throw error;
            }
        };
        return promiseCache(addressID, select, cb);
    };
};

export const addressKeysReducer = { [name]: slice.reducer };

export const getAllAddressKeysAction = createAction(`${name}/all`);
export const addressKeysFulfilledAction = slice.actions.fulfilled;
