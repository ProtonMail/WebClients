import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import authentication from '@proton/shared/lib/authentication/authentication';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { getInactiveKeys } from '@proton/shared/lib/keys/getInactiveKeys';

import { inactiveKeysActions } from '../inactiveKeys';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'userKeys';

export interface UserKeysState extends UserState {
    [name]: ModelState<DecryptedKey[]>;
}

type SliceState = UserKeysState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserKeys = (state: UserKeysState) => state.userKeys;

const modelThunk = createAsyncModelThunk<Model, UserKeysState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch }) => {
        const user = await dispatch(userThunk());
        const keys = await getDecryptedUserKeysHelper(user, authentication.getPassword());
        const inactiveKeys = await getInactiveKeys(user.Keys, keys);
        dispatch(inactiveKeysActions.set({ id: 'user', value: inactiveKeys }));
        return keys;
    },
    previous: previousSelector(selectUserKeys),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const userKeysReducer = { [name]: slice.reducer };
export const userKeysThunk = modelThunk.thunk;
