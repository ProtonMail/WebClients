import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'user_eligibility' as const;

export interface UserEligibilityState {
    [name]: ModelState<boolean>;
}

type SliceState = UserEligibilityState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserEligibility = (state: UserEligibilityState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, UserEligibilityState, WalletThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const isEligible = await extraArgument.walletApi
            .clients()
            .settings.getUserWalletEligibility()
            .then((data) => Boolean(data))
            .catch(() => false);

        return isEligible;
    },
    previous: previousSelector(selectUserEligibility),
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

export const userEligibilityReducer = { [name]: slice.reducer };
export const userEligibilityThunk = modelThunk.thunk;
