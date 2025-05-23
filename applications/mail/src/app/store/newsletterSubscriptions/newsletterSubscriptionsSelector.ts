import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../rootReducer';
import { DEFAULT_SORTING } from './constants';

export const selectNewsletterSubscriptions = (state: MailState) => state.newsletterSubscriptions.value;
export const selectedTab = (state: MailState) => state.newsletterSubscriptions.value?.selectedTab;
const selectedSubscriptionID = (state: MailState) => selectNewsletterSubscriptions(state)?.selectedSubscriptionId;

export const selectAllSubscriptions = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return undefined;
    }

    return store.byId;
});

export const selectTabSubscriptionsList = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return [];
    }

    const tab = store.selectedTab;
    return store.tabs[tab].ids.map((id) => store.byId[id]);
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

export const selectTabSubscriptionPagination = createSelector([selectNewsletterSubscriptions], (store) => {
    if (!store) {
        return undefined;
    }

    const tab = store.selectedTab;
    return store.tabs[tab].paginationData;
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

export const isSubscriptionActiveSelector = (subscriptionId: string) =>
    createSelector([selectedSubscriptionID], (selectedSub) => selectedSub === subscriptionId);
