import { createSlice } from '@reduxjs/toolkit';

import { fetchPreviousSubscription } from '@proton/payments/core/api/api';
import type { PreviousSubscription } from '@proton/payments/core/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const name = 'previousSubscription' as const;

type PreviousSubscriptionModel =
    | {
          hasHadSubscription: false;
          previousSubscription: null;
      }
    | {
          hasHadSubscription: true;
          previousSubscription: PreviousSubscription;
      };

export interface PreviousSubscriptionState extends UserState {
    [name]: ModelState<PreviousSubscriptionModel>;
}

type SliceState = PreviousSubscriptionState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const defaultPreviousSubscriptionValue: PreviousSubscriptionModel = {
    hasHadSubscription: false,
    previousSubscription: null,
};

export const selectPreviousSubscription = (state: PreviousSubscriptionState) => state[name];

const modelThunk = createAsyncModelThunk<Model, PreviousSubscriptionState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const user = await dispatch(userThunk());

        // For now, if user already has a subscription then we pretend that the previous one didn't exist, because it's
        // not important for the current business logic. If you do have a case when it's important to know current AND
        // previous subscription, the consider removing this condition. Keeping this condition helps to save some API
        // load.
        if (user.isPaid) {
            return defaultPreviousSubscriptionValue;
        }

        try {
            const previousSubscription = await fetchPreviousSubscription(extraArgument.api);
            if (previousSubscription) {
                return { hasHadSubscription: true, previousSubscription };
            } else {
                return { hasHadSubscription: false, previousSubscription: null };
            }
        } catch (error) {
            return defaultPreviousSubscriptionValue;
        }
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
