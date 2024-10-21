import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, defaultLongExpiry, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { getInactiveKeys } from '@proton/shared/lib/keys/getInactiveKeys';

import { signoutAction } from '../authenticationService';
import { inactiveKeysActions } from '../inactiveKeys';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const name = 'userKeys' as const;

export interface UserKeysState extends UserState {
    [name]: ModelState<DecryptedKey[]>;
}

type SliceState = UserKeysState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserKeys = (state: UserKeysState) => state.userKeys;

const modelThunk = createAsyncModelThunk<Model, UserKeysState, ProtonThunkArguments>(`${name}/fetch`, {
    expiry: defaultLongExpiry,
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        const keys = await getDecryptedUserKeysHelper(user, extraArgument.authentication.getPassword());
        const inactiveKeys = await getInactiveKeys(user.Keys, keys);
        dispatch(inactiveKeysActions.set({ id: 'user', value: inactiveKeys }));
        // This asserts that when a key update arrives, the client still has the correct key password for it.
        // Otherwise, it may invalidly be used. This is dangerous because it could potentially break keys.
        // One example where this happened was during a password reset where from the client perspective
        // it looked like an API call to update user keys failed (timed out) however, it actually succeeded
        // and the client kept using the old password. Since this is rare and should not happen, we just
        // sign out the user in lack of a better UX.
        if (inactiveKeys.length && !keys.length) {
            dispatch(signoutAction({ clearDeviceRecovery: false }));
        }

        return keys;
    },
    previous: previousSelector(selectUserKeys),
});

const initialState = getInitialModelState<Model>();
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
