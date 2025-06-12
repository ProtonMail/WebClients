import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getNewsletterSubscription } from '@proton/shared/lib/api/newsletterSubscription';
import type { GetNewsletterSubscriptionsApiResponse } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { setParams } from '../elements/elementsActions';
import { DEFAULT_PAGINATION_PAGE_SIZE, initialState, initialStateValue } from './constants';
import { getTabData, normalizeSubscriptions } from './helpers';
import { type NewsletterSubscriptionsInterface, SortSubscriptionsValue, SubscriptionTabs } from './interface';
import {
    fetchNextNewsletterSubscriptionsPage,
    filterSubscriptionList,
    sortSubscriptionList,
    unsubscribeSubscription,
    updateSubscription,
} from './newsletterSubscriptionsActions';
import {
    deleteSubscriptionAnimationEndedReducer,
    fetchNextNewsletterSubscriptionsPageFulfilled,
    filterSubscriptionListFulfilled,
    filterSubscriptionListPending,
    filterSubscriptionListRejected,
    removeSubscriptionFromActiveTabReducer,
    setSelectedElementIdReducer,
    setSelectedSubscriptionReducer,
    setSelectedTabReducer,
    setSortingOrderReducer,
    sortSubscriptionFulfilled,
    sortSubscriptionPending,
    sortSubscriptionRejected,
    unsubscribeSubscriptionPending,
    unsubscribeSubscriptionRejected,
    updateSubscriptionFulfilled,
    updateSubscriptionPending,
    updateSubscriptionRejected,
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
    miss: async ({ extraArgument, dispatch }) => {
        try {
            const [active, unsubscribed] = await Promise.all([
                extraArgument.api<GetNewsletterSubscriptionsApiResponse>(
                    getNewsletterSubscription({
                        pagination: {
                            PageSize: DEFAULT_PAGINATION_PAGE_SIZE,
                            Active: '1',
                        },
                        sort: SortSubscriptionsValue.RecentlyReceived,
                    })
                ),
                extraArgument.api<GetNewsletterSubscriptionsApiResponse>(
                    getNewsletterSubscription({
                        pagination: {
                            PageSize: DEFAULT_PAGINATION_PAGE_SIZE,
                            Active: '0',
                        },
                        sort: SortSubscriptionsValue.RecentlyReceived,
                    })
                ),
            ]);

            const normalizedActive = normalizeSubscriptions(active.NewsletterSubscriptions);
            const normalizedUnsubscribed = normalizeSubscriptions(unsubscribed.NewsletterSubscriptions);

            const selectedSubscriptionId = normalizedActive.ids[0];
            dispatch(setParams({ newsletterSubscriptionID: selectedSubscriptionId }));
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
                selectedSubscriptionId,
                selectedElementId: undefined,
                deletingSubscriptionId: undefined,
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
        setSelectedTab: setSelectedTabReducer,
        setSelectedSubscription: setSelectedSubscriptionReducer,
        setSelectedElementId: setSelectedElementIdReducer,
        removeSubscriptionFromActiveTab: removeSubscriptionFromActiveTabReducer,
        deleteSubscriptionAnimationEnded: deleteSubscriptionAnimationEndedReducer,
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

        builder.addCase(updateSubscription.pending, updateSubscriptionPending);
        builder.addCase(updateSubscription.rejected, updateSubscriptionRejected);
        builder.addCase(updateSubscription.fulfilled, updateSubscriptionFulfilled);

        builder.addCase(fetchNextNewsletterSubscriptionsPage.fulfilled, fetchNextNewsletterSubscriptionsPageFulfilled);
    },
});

export const newsletterSubscriptionsActions = slice.actions;
export const newsletterSubscriptionsReducer = { [newsletterSubscriptionName]: slice.reducer };
export const newsletterSubscriptionsThunk = modelThunk.thunk;
