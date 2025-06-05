import type { PayloadAction } from '@reduxjs/toolkit';

import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getPaginationDataFromNextPage, normalizeSubscriptions } from './helpers';
import { type SortSubscriptionsValue, SubscriptionTabs } from './interface';
import type {
    fetchNextNewsletterSubscriptionsPage,
    filterSubscriptionList,
    unsubscribeSubscription,
} from './newsletterSubscriptionsActions';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

export const setSelectedElementIdReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<string | undefined>
) => {
    if (!state.value) {
        return;
    }

    state.value.selectedElementId = action.payload;
};

export const setSortingOrderReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<SortSubscriptionsValue>
) => {
    if (!state.value) {
        return;
    }

    const tab = state.value.selectedTab;
    state.value.tabs[tab].sorting = action.payload;
};

export const setSelectedTabReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<SubscriptionTabs>
) => {
    if (!state.value) {
        return;
    }

    state.value.selectedTab = action.payload;
};

export const setSelectedSubscriptionReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<NewsletterSubscription>
) => {
    if (!state.value) {
        return;
    }

    state.value.selectedSubscriptionId = action.payload.ID;
    state.value.selectedElementId = undefined;
};

export const unsubscribeSubscriptionPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.pending>
) => {
    if (!state.value) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    const originalIndex = state.value.tabs.active.ids.indexOf(subscriptionId);

    state.value.byId[subscriptionId] = {
        ...state.value.byId[subscriptionId],
        UnsubscribedTime: Date.now(),
    };

    if (originalIndex !== -1) {
        state.value.tabs.active.ids.splice(originalIndex, 1);
        state.value.tabs.active.totalCount = Math.max(0, state.value.tabs.active.totalCount - 1);
    }

    // We unselect the subscription if it's the one currently selected
    if (state.value.selectedSubscriptionId === subscriptionId) {
        state.value.selectedSubscriptionId = undefined;
    }

    state.value.tabs.unsubscribe.ids.unshift(subscriptionId);
    state.value.tabs.unsubscribe.totalCount += 1;
};

export const unsubscribeSubscriptionRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.rejected>
) => {
    const { previousState, originalIndex } = action.payload || {};
    if (!state.value || !previousState || originalIndex === undefined || originalIndex < 0) {
        return;
    }

    const subscriptionId = previousState.ID;

    state.value.byId[subscriptionId] = previousState;

    const unsubscribedId = state.value.tabs.unsubscribe.ids.indexOf(subscriptionId);
    if (unsubscribedId !== -1) {
        state.value.tabs.unsubscribe.ids.splice(unsubscribedId, 1);
        state.value.tabs.unsubscribe.totalCount = Math.max(0, state.value.tabs.unsubscribe.totalCount - 1);
    }

    // We select the previous subscription if we had an error
    if (!state.value.selectedSubscriptionId) {
        state.value.selectedSubscriptionId = subscriptionId;
    }

    state.value.tabs.active.ids.splice(originalIndex, 0, subscriptionId);
    state.value.tabs.active.totalCount += 1;
};

export const sortSubscriptionPending = (state: NewsletterSubscriptionsStateType) => {
    if (!state.value) {
        return;
    }

    state.value.tabs.active.loading = true;
    state.value.tabs.unsubscribe.loading = true;
};

export const sortSubscriptionFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<GetNewsletterSubscriptionsApiResponse>
) => {
    if (!state.value) {
        return;
    }

    const normalizedData = normalizeSubscriptions(action.payload.NewsletterSubscriptions);

    state.value.byId = {
        ...state.value.byId,
        ...normalizedData.byId,
    };

    const tab = state.value.selectedTab;
    state.value.tabs[tab].ids = [...normalizedData.ids];
    state.value.tabs[tab].paginationData = getPaginationDataFromNextPage(
        tab === 'active' ? '1' : '0',
        action.payload.PageInfo.NextPage
    );

    state.value.tabs.active.loading = false;
    state.value.tabs.unsubscribe.loading = false;
};

export const sortSubscriptionRejected = (state: NewsletterSubscriptionsStateType) => {
    if (!state.value) {
        return;
    }

    state.value.tabs.active.loading = false;
    state.value.tabs.unsubscribe.loading = false;
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
    const MoveToFolder = action.meta.arg.data.DestinationFolder ?? '';

    state.value.byId[subscriptionId] = {
        ...state.value.byId[subscriptionId],
        MarkAsRead,
        MoveToFolder,
    };
};

export const filterSubscriptionListFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.fulfilled>
) => {
    if (!state.value) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    state.value.byId[subscriptionId] = {
        ...action.payload.NewsletterSubscription,
    };
};

export const filterSubscriptionListRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.rejected>
) => {
    const { previousState, originalIndex } = action.payload || {};
    if (!state.value || !previousState || originalIndex === undefined) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    state.value.byId[subscriptionId] = {
        ...state.value.byId[subscriptionId],
        ...previousState,
    };
};

export const fetchNextNewsletterSubscriptionsPageFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof fetchNextNewsletterSubscriptionsPage.fulfilled>
) => {
    if (!state.value) {
        return;
    }

    const normalizedData = normalizeSubscriptions(action.payload.NewsletterSubscriptions);

    state.value.byId = {
        ...state.value.byId,
        ...normalizedData.byId,
    };

    const tab = state.value.selectedTab;
    state.value.tabs[tab].ids = [...state.value.tabs[tab].ids, ...normalizedData.ids];
    state.value.tabs[tab].paginationData = getPaginationDataFromNextPage(
        tab === SubscriptionTabs.Active ? '1' : '0',
        action.payload.PageInfo.NextPage
    );
};
