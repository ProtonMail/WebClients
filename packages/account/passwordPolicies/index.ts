import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getPasswordPolicies, getShouldUsePasswordPolicies } from '@proton/shared/lib/api/passwordPolicies';
import { DAY } from '@proton/shared/lib/constants';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const name = 'passwordPolicies' as const;

export interface AuthState extends UserState {
    [name]: ModelState<PasswordPolicies>;
}

type SliceState = AuthState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPasswordPolicies = (state: AuthState) => state.passwordPolicies;

const modelThunk = createAsyncModelThunk<Model, AuthState, ProtonThunkArguments>(`${name}/fetch`, {
    expiry: 7 * DAY,
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (!getShouldUsePasswordPolicies(user)) {
            return [];
        }
        const silentApi = getSilentApi(extraArgument.api);
        return getPasswordPolicies({ api: silentApi });
    },
    previous: previousSelector(selectPasswordPolicies),
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

export const passwordPoliciesReducer = { [name]: slice.reducer };
export const passwordPoliciesThunk = modelThunk.thunk;
