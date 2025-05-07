import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getNewsletterSubscription } from '@proton/shared/lib/api/newsletterSubscription';
import type { GetNewsletterSubscriptionsApiResponse } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { initialState, initialStateValue } from './constants';
import { formatSubscriptionResponse } from './helpers';
import type { NewsletterSubscriptionsInterface } from './interface';
import {
    filterSubscriptionList,
    sortSubscriptionList,
    unsubscribeSubscription,
} from './newsletterSubscriptionsActions';
import {
    filterSubscriptionListFulfilled,
    filterSubscriptionListPending,
    filterSubscriptionListRejected,
    setFilteredSubscriptionsReducer,
    setSelectedSubscriptionReducer,
    sortSubscriptionFulfilled,
    sortSubscriptionPending,
    sortSubscriptionRejected,
    unsubscribeSubscriptionPending,
    unsubscribeSubscriptionRejected,
} from './newsletterSubscriptionsReducers';

export const name = 'newsletterSubscription' as const;

export type NewsletterSubscriptionsStateType = ModelState<NewsletterSubscriptionsInterface>;

export interface NewsletterSubscriptionsState {
    [name]: NewsletterSubscriptionsStateType;
}
export const selectNewsletterSubscriptions = (state: NewsletterSubscriptionsState) => state[name];

const modelThunk = createAsyncModelThunk<
    NewsletterSubscriptionsInterface,
    NewsletterSubscriptionsState,
    ProtonThunkArguments
>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        try {
            const data = await extraArgument.api<GetNewsletterSubscriptionsApiResponse>(getNewsletterSubscription());
            return formatSubscriptionResponse(data);
        } catch (error) {
            return { ...initialStateValue, loading: false };
        }
    },
    previous: previousSelector(selectNewsletterSubscriptions),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {
        setSelectedSubscription: setSelectedSubscriptionReducer,
        setFilteredSubscriptions: setFilteredSubscriptionsReducer,
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(sortSubscriptionList.pending, sortSubscriptionPending);
        builder.addCase(sortSubscriptionList.fulfilled, sortSubscriptionFulfilled);
        builder.addCase(sortSubscriptionList.rejected, sortSubscriptionRejected);
        builder.addCase(filterSubscriptionList.pending, filterSubscriptionListPending);
        builder.addCase(filterSubscriptionList.fulfilled, filterSubscriptionListFulfilled);
        builder.addCase(filterSubscriptionList.rejected, filterSubscriptionListRejected);
        builder.addCase(unsubscribeSubscription.pending, unsubscribeSubscriptionPending);
        builder.addCase(unsubscribeSubscription.rejected, unsubscribeSubscriptionRejected);
        // TODO future add a fulfilled reduced when the backend returns the updated subscription
    },
});

export const newsletterSubscriptionsActions = slice.actions;
export const newsletterSubscriptionsReducer = { [name]: slice.reducer };
export const newsletterSubscriptionsThunk = modelThunk.thunk;
