import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getNewsletterSubscription } from '@proton/shared/lib/api/newsletterSubscription';
import type { GetNewsletterSubscriptionsApiResponse } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { initialState, initialStateValue } from './constants';
import { getTabData, normalizeSubscriptions } from './helpers';
import { type NewsletterSubscriptionsInterface, SubscriptionTabs } from './interface';
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
    setSortingOrderReducer,
    sortSubscriptionFulfilled,
    sortSubscriptionPending,
    sortSubscriptionRejected,
    unsubscribeSubscriptionPending,
    unsubscribeSubscriptionRejected,
} from './newsletterSubscriptionsReducers';

export const newsletterSubscriptionName = 'newsletterSubscriptions' as const;

export type NewsletterSubscriptionsStateType = ModelState<NewsletterSubscriptionsInterface>;

export interface NewsletterSubscriptionsState {
    [newsletterSubscriptionName]: NewsletterSubscriptionsStateType;
}
export const selectNewsletterSubscriptions = (state: NewsletterSubscriptionsState) => state[newsletterSubscriptionName];

const modelThunk = createAsyncModelThunk<
    NewsletterSubscriptionsInterface,
    NewsletterSubscriptionsState,
    ProtonThunkArguments
>(`${newsletterSubscriptionName}/fetch`, {
    miss: async ({ extraArgument }) => {
        try {
            const [active, unsubscribed] = await Promise.all([
                extraArgument.api<GetNewsletterSubscriptionsApiResponse>(getNewsletterSubscription({})),
                extraArgument.api<GetNewsletterSubscriptionsApiResponse>(getNewsletterSubscription({})),
            ]);

            const normalizedActive = normalizeSubscriptions(active.NewsletterSubscriptions);
            const normalizedUnsubscribed = normalizeSubscriptions(unsubscribed.NewsletterSubscriptions);

            return {
                byId: {
                    ...normalizedActive.byId,
                    ...normalizedUnsubscribed.byId,
                },
                tabs: {
                    active: getTabData(normalizedActive.ids, active),
                    unsubscribe: getTabData(normalizedUnsubscribed.ids, unsubscribed),
                },
                selectedTab: SubscriptionTabs.Active,
                selectedSubscriptionId: normalizedActive.ids[0],
            };
        } catch (error) {
            return {
                ...initialStateValue,
                tabs: {
                    ...initialStateValue.tabs,
                    active: { ...initialStateValue.tabs.active, loading: false },
                    unsubscribe: { ...initialStateValue.tabs.unsubscribe, loading: false },
                },
            };
        }
    },
    previous: previousSelector(selectNewsletterSubscriptions),
});

const slice = createSlice({
    name: newsletterSubscriptionName,
    initialState,
    reducers: {
        setSortingOrder: setSortingOrderReducer,
        setFilteredSubscriptions: setFilteredSubscriptionsReducer,
        setSelectedSubscription: setSelectedSubscriptionReducer,
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder.addCase(unsubscribeSubscription.pending, unsubscribeSubscriptionPending);
        builder.addCase(unsubscribeSubscription.rejected, unsubscribeSubscriptionRejected);

        builder.addCase(sortSubscriptionList.pending, sortSubscriptionPending);
        builder.addCase(sortSubscriptionList.fulfilled, sortSubscriptionFulfilled);
        builder.addCase(sortSubscriptionList.rejected, sortSubscriptionRejected);

        builder.addCase(filterSubscriptionList.pending, filterSubscriptionListPending);
        builder.addCase(filterSubscriptionList.fulfilled, filterSubscriptionListFulfilled);
        builder.addCase(filterSubscriptionList.rejected, filterSubscriptionListRejected);
    },
});

export const newsletterSubscriptionsActions = slice.actions;
export const newsletterSubscriptionsReducer = { [newsletterSubscriptionName]: slice.reducer };
export const newsletterSubscriptionsThunk = modelThunk.thunk;
