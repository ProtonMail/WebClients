import { createAction, createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/index';
import { getInitialModelState } from '@proton/account/index';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getRemainingInvitations } from '@proton/shared/lib/api/lumo';

const name = 'lumo/remainingInvites' as const;
export interface RemainingInvitesState {
    [name]: ModelState<{ remaining: number }>;
}

type SliceState = RemainingInvitesState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState = getInitialModelState<Model>();

export const selectRemainingInvites = (state: RemainingInvitesState) => {
    return state[name];
};

export const decrementAvailableInvites = createAction('decrement available invites', () => ({ payload: {} }));

const modelThunk = createAsyncModelThunk<Model, RemainingInvitesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument
            .api(getRemainingInvitations())
            .then((response) => ({ remaining: response.Remaining }))
            .catch(() => ({ remaining: 0 }));
    },
    previous: previousSelector(selectRemainingInvites),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder.addCase(decrementAvailableInvites, (state) => {
            if (state.value && state.value.remaining > 0) {
                state.value.remaining--;
            }
        });
    },
});

export const remainingInvitesReducer = { [name]: slice.reducer };
export const remainingInvitesThunk = modelThunk.thunk;
