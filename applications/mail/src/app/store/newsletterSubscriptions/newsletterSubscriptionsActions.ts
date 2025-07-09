import { createAsyncThunk } from '@reduxjs/toolkit';

import {
    applyNewsletterSubscriptionFilter,
    deleteNewsletterSubscriptionByID,
    getNewsletterSubscription,
    unsubscribeNewsletterSubscription,
    updateNewsletterSubscription,
} from '@proton/shared/lib/api/newsletterSubscription';
import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
    POSTSubscriptionAPIResponse,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { type MailThunkExtra } from '../store';
import { getPaginationQueryString } from './constants';
import {
    type DeleteNewsletterSubscriptionPayload,
    type FilterSubscriptionPayload,
    type SortSubscriptionsValue,
    SubscriptionTabs,
    type UnsubscribePayload,
    type UpdateSubscriptionPayload,
} from './interface';
import { newsletterSubscriptionName } from './newsletterSubscriptionsSlice';

export const sortSubscriptionList = createAsyncThunk<
    GetNewsletterSubscriptionsApiResponse,
    SortSubscriptionsValue,
    MailThunkExtra
>('newsletterSubscriptions/sortList', async (payload, thunkExtra) => {
    try {
        const store = thunkExtra.getState()[newsletterSubscriptionName].value;
        if (!store) {
            throw new Error('No newsletter subscription state');
        }

        const tab = store.selectedTab;

        // The only pagination data we need is the active which define the tab the user has selected
        return await thunkExtra.extra.api<GetNewsletterSubscriptionsApiResponse>(
            getNewsletterSubscription({
                paginationString: getPaginationQueryString(tab === SubscriptionTabs.Active, payload),
            })
        );
    } catch (error) {
        throw error;
    }
});

export const unsubscribeSubscription = createAsyncThunk<
    void,
    UnsubscribePayload,
    MailThunkExtra & { rejectValue: { previousState: NewsletterSubscription; originalIndex: number } }
>('newsletterSubscriptions/unsubscribe', async (payload, thunkExtra) => {
    try {
        return await thunkExtra.extra.api(unsubscribeNewsletterSubscription(payload.subscription.ID));
    } catch (error) {
        return thunkExtra.rejectWithValue({
            previousState: payload.subscription,
            originalIndex: payload.subscriptionIndex ?? -1,
        });
    }
});

export const filterSubscriptionList = createAsyncThunk<
    POSTSubscriptionAPIResponse,
    FilterSubscriptionPayload,
    MailThunkExtra & { rejectValue: { previousState: NewsletterSubscription; originalIndex: number } }
>('newsletterSubscriptions/filterList', async (payload, thunkExtra) => {
    try {
        const data = await thunkExtra.extra.api<POSTSubscriptionAPIResponse>(
            applyNewsletterSubscriptionFilter(payload.subscription.ID, payload.data)
        );

        // We force the event loop here to update the filters,
        // can be removed if we use an async thunk in the filters slice
        void thunkExtra.extra.eventManager.call();
        return data;
    } catch (error) {
        return thunkExtra.rejectWithValue({
            previousState: payload.subscription,
            originalIndex: payload.subscriptionIndex ?? -1,
        });
    }
});

export const deleteNewsletterSubscription = createAsyncThunk<
    void,
    DeleteNewsletterSubscriptionPayload,
    MailThunkExtra & { rejectValue: { previousState: NewsletterSubscription; originalIndex: number } }
>('newsletterSubscriptions/delete', async (payload, thunkExtra) => {
    try {
        return await thunkExtra.extra.api(deleteNewsletterSubscriptionByID(payload.subscription.ID));
    } catch (error) {
        return thunkExtra.rejectWithValue({
            previousState: payload.subscription,
            originalIndex: payload.subscriptionIndex ?? -1,
        });
    }
});

/**
 * Fetch the next page of the active tab with data present on the store
 */
export const fetchNextNewsletterSubscriptionsPage = createAsyncThunk<
    GetNewsletterSubscriptionsApiResponse,
    void,
    MailThunkExtra
>('newsletterSubscriptions/fetchNextPage', async (_payload, thunkExtra) => {
    try {
        const store = thunkExtra.getState()[newsletterSubscriptionName].value;
        if (!store) {
            throw new Error('No newsletter subscription state');
        }

        const tab = store.selectedTab;
        return await thunkExtra.extra.api<GetNewsletterSubscriptionsApiResponse>(
            getNewsletterSubscription({ paginationString: store.tabs[tab].paginationQueryString })
        );
    } catch (error) {
        throw error;
    }
});

export const updateSubscription = createAsyncThunk<
    POSTSubscriptionAPIResponse,
    UpdateSubscriptionPayload,
    MailThunkExtra & { rejectValue: { previousState: NewsletterSubscription; originalIndex: number } }
>('newsletterSubscriptions/update', async (payload, thunkExtra) => {
    try {
        return await thunkExtra.extra.api<POSTSubscriptionAPIResponse>(
            updateNewsletterSubscription(payload.subscription.ID, payload.data)
        );
    } catch (error) {
        return thunkExtra.rejectWithValue({
            previousState: payload.subscription,
            originalIndex: payload.subscriptionIndex ?? -1,
        });
    }
});
