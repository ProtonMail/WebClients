import { createAction, createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'remaining_invites' as const;

export interface RemainingInvitesState {
    [name]: ModelState<{ available: number; used: number }>;
}

type SliceState = RemainingInvitesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectRemainingInvites = (state: RemainingInvitesState) => {
    return state[name];
};

export const decrementAvailableInvites = createAction('decrement available invites', () => ({ payload: {} }));

const modelThunk = createAsyncModelThunk<Model, RemainingInvitesState, WalletThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const invites = await extraArgument.walletApi
            .clients()
            .invite.getRemainingMonthlyInvitation()
            .then((data) => ({ available: data.Available, used: data.Used }))
            .catch(() => ({ available: 0, used: 0 }));

        return invites;
    },
    previous: previousSelector(selectRemainingInvites),
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(decrementAvailableInvites, (state) => {
            if (state.value && state.value.available > 0) {
                state.value.available--;
            }
        });
    },
});

export const remainingInvitesReducer = { [name]: slice.reducer };
export const remainingInvitesThunk = modelThunk.thunk;
