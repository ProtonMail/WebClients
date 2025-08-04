import { createSlice } from '@reduxjs/toolkit';

import { type LatestSubscription, getLatestCancelledSubscription } from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const name = 'previousSubscription' as const;

export interface PreviousSubscriptionState extends UserState {
    [name]: ModelState<{ hasHadSubscription: boolean; previousSubscriptionEndTime: number }>;
}

type SliceState = PreviousSubscriptionState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPreviousSubscription = (state: PreviousSubscriptionState) => state[name];

const modelThunk = createAsyncModelThunk<Model, PreviousSubscriptionState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const user = await dispatch(userThunk());

        if (user.isPaid) {
            return { hasHadSubscription: true, previousSubscriptionEndTime: 0 };
        }

        const response = await extraArgument.api<LatestSubscription>(getLatestCancelledSubscription());
        const lastSubscriptionEnd = response.LastSubscriptionEnd || 0;

        return { hasHadSubscription: lastSubscriptionEnd > 0, previousSubscriptionEndTime: lastSubscriptionEnd };
    },
    previous: previousSelector(selectPreviousSubscription),
});

const initialState: SliceState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const previousSubscriptionReducer = { [name]: slice.reducer };
export const previousSubscriptionThunk = modelThunk.thunk;
