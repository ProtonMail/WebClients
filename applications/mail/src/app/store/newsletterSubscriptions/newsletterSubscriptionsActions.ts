import { createAsyncThunk } from '@reduxjs/toolkit';

import {
    applyNewsletterSubscriptionFilter,
    getNewsletterSubscription,
    unsubscribeNewsletterSubscription,
} from '@proton/shared/lib/api/newsletterSubscription';
import type {
    FilterSubscriptionAPIResponse,
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { type MailThunkExtra } from '../store';
import type { FilterSubscriptionPayload, SortSubscriptionsValue, UnsubscribePayload } from './interface';

export const sortSubscriptionList = createAsyncThunk<
    GetNewsletterSubscriptionsApiResponse,
    SortSubscriptionsValue,
    MailThunkExtra
>('newsletterSubscriptions/sortList', async (value, thunkExtra) => {
    try {
        // We don't give pagination information here since changing the sort order override the store
        return await thunkExtra.extra.api<GetNewsletterSubscriptionsApiResponse>(
            getNewsletterSubscription({ sort: value })
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
    FilterSubscriptionAPIResponse,
    FilterSubscriptionPayload,
    MailThunkExtra & { rejectValue: { previousState: NewsletterSubscription; originalIndex: number } }
>('newsletterSubscriptions/filterList', async (payload, thunkExtra) => {
    try {
        return await thunkExtra.extra.api<FilterSubscriptionAPIResponse>(
            applyNewsletterSubscriptionFilter(payload.subscription.ID, payload.data)
        );
    } catch (error) {
        return thunkExtra.rejectWithValue({
            previousState: payload.subscription,
            originalIndex: payload.subscriptionIndex ?? -1,
        });
    }
});
