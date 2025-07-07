import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../rootReducer';
import { DEFAULT_SORTING } from './constants';

export const selectNewsletterSubscriptions = (state: MailState) => state.newsletterSubscriptions.value;
export const selectedTab = (state: MailState) => state.newsletterSubscriptions.value?.selectedTab;
export const selectedElementId = (state: MailState) => selectNewsletterSubscriptions(state)?.selectedElementId;
const selectedSubscriptionID = (state: MailState) => selectNewsletterSubscriptions(state)?.selectedSubscriptionId;
export const unsubscribingSubscriptionIdSelector = (state: MailState) =>
    selectNewsletterSubscriptions(state)?.unsubscribingSubscriptionId;

export const allSubscriptionCount = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return 0;
    }

    return Object.keys(store.byId).length;
});

export const selectTabSubscriptionsList = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return [];
    }

    const tab = store.selectedTab;
    return store.tabs[tab].ids.map((id) => store.byId[id]);
});

export const selectedTabSubscriptionsCount = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return 0;
    }

    const tab = store.selectedTab;
    return store.tabs[tab].totalCount;
});

export const selectTabLoadingState = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return [];
    }

    const tab = store.selectedTab;
    return store.tabs[tab].loading;
});

export const selectTabSortingState = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return DEFAULT_SORTING;
    }

    const tab = store.selectedTab;
    return store.tabs[tab].sorting;
});

export const selectTabSubscriptionPaginationQueryString = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return undefined;
    }

    const tab = store.selectedTab;
    return store.tabs[tab].paginationQueryString;
});

export const getFilteredSubscriptionIndex = (subscriptionID: string) => {
    return createSelector([selectNewsletterSubscriptions], (store) => {
        if (!store) {
            return -1;
        }

        const tab = store.selectedTab;
        return store.tabs[tab].ids.findIndex((id) => id === subscriptionID);
    });
};

export const selectSubscriptionsCount = (state: MailState) => {
    const subscriptionStore = selectNewsletterSubscriptions(state);

    if (!subscriptionStore) {
        return {
            active: 0,
            unsubscribe: 0,
        };
    }

    return {
        active: subscriptionStore.tabs.active.totalCount,
        unsubscribe: subscriptionStore.tabs.unsubscribe.totalCount,
    };
};

export const selectedSubscriptionSelector = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store || !store.selectedSubscriptionId) {
        return undefined;
    }

    return store.byId[store.selectedSubscriptionId];
});

export const selectedSubscriptionIdSelector = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return undefined;
    }

    return store.selectedSubscriptionId;
});

export const isSubscriptionActiveSelector = (subscriptionId: string) =>
    createSelector([selectedSubscriptionID], (selectedSub) => selectedSub === subscriptionId);
