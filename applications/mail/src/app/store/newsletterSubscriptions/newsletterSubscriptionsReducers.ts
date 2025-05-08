import type { PayloadAction } from '@reduxjs/toolkit';

import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { formatSubscriptionResponse, updateSubscriptionKeysIfCorrectID } from './helpers';
import type { SubscriptionTabs } from './interface';
import type { filterSubscriptionList, unsubscribeSubscription } from './newsletterSubscriptionsActions';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

export const setSelectedSubscriptionReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<NewsletterSubscription>
) => {
    if (!state.value) {
        return;
    }

    state.value.selectedSubscription = action.payload;
};

export const setFilteredSubscriptionsReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<SubscriptionTabs>
) => {
    if (!state.value) {
        return;
    }

    state.value.filteredSubscriptions = state.value.subscriptions.filter((subscription: NewsletterSubscription) => {
        const isUnsubscribed = !!subscription.UnsubscribedTime;
        return action.payload === 'active' ? !isUnsubscribed : isUnsubscribed;
    });

    state.value.selectedTab = action.payload;
};

export const sortSubscriptionPending = (state: NewsletterSubscriptionsStateType) => {
    if (state.value) {
        state.value.loading = true;
    }
};

export const sortSubscriptionFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<GetNewsletterSubscriptionsApiResponse>
) => {
    state.value = formatSubscriptionResponse(action.payload);
};

export const sortSubscriptionRejected = (state: NewsletterSubscriptionsStateType) => {
    if (state.value) {
        state.value.loading = false;
    }
};

export const filterSubscriptionListPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.pending>
) => {
    if (!state.value) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;

    // We show the mark as read status when marking future subscriptions as read.
    const MarkAsRead = !!action.meta.arg.data.MarkAsRead && action.meta.arg.data.ApplyTo === 'All';
    const ApplyTo = action.meta.arg.data.ApplyTo;
    const DestinationFolder = action.meta.arg.data.DestinationFolder;

    const updateParams = {
        idToUpdate: subscriptionId,
        keys: { MarkAsRead, ApplyTo, DestinationFolder },
    };

    state.value.subscriptions = state.value.subscriptions.map((subscription) =>
        updateSubscriptionKeysIfCorrectID({
            ...updateParams,
            subscription,
        })
    );

    state.value.filteredSubscriptions = state.value.filteredSubscriptions.map((subscription) =>
        updateSubscriptionKeysIfCorrectID({
            ...updateParams,
            subscription,
        })
    );
};

export const filterSubscriptionListFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.fulfilled>
) => {
    if (!state.value) {
        return;
    }

    const updatedSub = action.payload.NewsletterSubscription;

    state.value.subscriptions = state.value.subscriptions.map((subscription) =>
        subscription.ID === updatedSub.ID ? updatedSub : subscription
    );

    state.value.filteredSubscriptions = state.value.filteredSubscriptions.map((subscription) =>
        subscription.ID === updatedSub.ID ? updatedSub : subscription
    );
};

export const filterSubscriptionListRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.rejected>
) => {
    const previousState = action.payload?.previousState;
    if (!state.value || !previousState) {
        return;
    }

    state.value.subscriptions = state.value.subscriptions.map((subscription) =>
        subscription.ID === previousState.ID ? previousState : subscription
    );

    state.value.filteredSubscriptions = state.value.filteredSubscriptions.map((subscription) =>
        subscription.ID === previousState.ID ? previousState : subscription
    );
};

export const unsubscribeSubscriptionPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.pending>
) => {
    if (!state.value) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    const updateParams = {
        idToUpdate: subscriptionId,
        keys: { UnsubscribedTime: Date.now() },
    };

    state.value.subscriptions = state.value.subscriptions.map((subscription) =>
        updateSubscriptionKeysIfCorrectID({
            ...updateParams,
            subscription,
        })
    );

    state.value.filteredSubscriptions = state.value.filteredSubscriptions.filter(
        (subscription) => subscription.ID !== subscriptionId
    );
};

export const unsubscribeSubscriptionRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.rejected>
) => {
    const previousState = action.payload?.previousState;
    if (!state.value || !previousState) {
        return;
    }

    state.value.subscriptions = state.value.subscriptions.map((subscription) =>
        subscription.ID === previousState.ID ? previousState : subscription
    );

    // We remove the subscription in the pending reducer, we need to add it back in case of failure
    state.value.filteredSubscriptions.push(previousState);
};
