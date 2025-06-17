import type { PayloadAction } from '@reduxjs/toolkit';

import type { serverEvent } from '@proton/account';
import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getReceivedMessagesCount } from 'proton-mail/components/view/NewsletterSubscription/helper';

import { normalizeSubscriptions } from './helpers';
import { SortSubscriptionsValue, type SubscriptionTabs } from './interface';
import type {
    fetchNextNewsletterSubscriptionsPage,
    filterSubscriptionList,
    unsubscribeSubscription,
    updateSubscription,
} from './newsletterSubscriptionsActions';
import {
    filterNewsletterSubscriptionList,
    getSelectedTabStateValue,
    getStoreValue,
    handleUpdateRejection,
    moveIdToTop,
    updateSubscriptionState,
} from './newsletterSubscriptionsReducers.helpers';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

export const setSelectedElementIdReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<string | undefined>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    stateValue.selectedElementId = action.payload;
};

export const setSortingOrderReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<SortSubscriptionsValue>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    getSelectedTabStateValue(stateValue).sorting = action.payload;
};

export const setSelectedTabReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<SubscriptionTabs>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    stateValue.selectedTab = action.payload;
    stateValue.selectedElementId = undefined;
    stateValue.selectedSubscriptionId = undefined;
};

export const setSelectedSubscriptionReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<NewsletterSubscription>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    stateValue.selectedSubscriptionId = action.payload.ID;
    stateValue.selectedElementId = undefined;
};

export const removeSubscriptionFromActiveTabReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<string>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const originalIndex = stateValue.tabs.active.ids.indexOf(action.payload);

    if (originalIndex !== -1) {
        stateValue.tabs.active.ids.splice(originalIndex, 1);
    }
};

export const deleteSubscriptionAnimationEndedReducer = (state: NewsletterSubscriptionsStateType) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    stateValue.deletingSubscriptionId = undefined;
};

export const unsubscribeSubscriptionPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.pending>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    const originalIndex = stateValue.tabs.active.ids.indexOf(subscriptionId);

    updateSubscriptionState(stateValue.byId, subscriptionId, {
        UnsubscribedTime: Date.now(),
    });

    // We unselect the subscription if it's the one currently selected
    if (stateValue.selectedSubscriptionId === subscriptionId) {
        stateValue.selectedSubscriptionId = undefined;
    }

    if (originalIndex !== -1) {
        stateValue.tabs.active.totalCount = safeDecreaseCount(stateValue.tabs.active.totalCount);
        // We don't remove the ID of the active tab now, we do this once the animation is done
        stateValue.deletingSubscriptionId = subscriptionId;
    }

    stateValue.tabs.unsubscribe.ids.unshift(subscriptionId);
    stateValue.tabs.unsubscribe.totalCount = safeIncreaseCount(stateValue.tabs.unsubscribe.totalCount);
};

export const unsubscribeSubscriptionRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.rejected>
) => {
    handleUpdateRejection(state, action);
};

export const sortSubscriptionPending = (state: NewsletterSubscriptionsStateType) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    stateValue.tabs.active.loading = true;
    stateValue.tabs.unsubscribe.loading = true;
};

export const sortSubscriptionFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<GetNewsletterSubscriptionsApiResponse>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const normalizedData = normalizeSubscriptions(action.payload.NewsletterSubscriptions);

    stateValue.byId = {
        ...stateValue.byId,
        ...normalizedData.byId,
    };

    getSelectedTabStateValue(stateValue).ids = [...normalizedData.ids];
    getSelectedTabStateValue(stateValue).paginationQueryString = action.payload.PageInfo.NextPage?.QueryString ?? null;

    stateValue.tabs.active.loading = false;
    stateValue.tabs.unsubscribe.loading = false;
};

export const sortSubscriptionRejected = (state: NewsletterSubscriptionsStateType) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    stateValue.tabs.active.loading = false;
    stateValue.tabs.unsubscribe.loading = false;
};

export const filterSubscriptionListPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.pending>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;

    // We show the mark as read status when marking future subscriptions as read.
    const MarkAsRead = !!action.meta.arg.data.MarkAsRead && action.meta.arg.data.ApplyTo === 'All';
    const MoveToFolder = action.meta.arg.data.DestinationFolder ?? null;

    updateSubscriptionState(stateValue.byId, subscriptionId, {
        UnreadMessageCount: MarkAsRead ? 0 : stateValue.byId[subscriptionId].UnreadMessageCount,
        MarkAsRead,
        MoveToFolder,
    });
};

export const filterSubscriptionListFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.fulfilled>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;

    updateSubscriptionState(stateValue.byId, subscriptionId, action.payload.NewsletterSubscription);
};

export const filterSubscriptionListRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof filterSubscriptionList.rejected>
) => {
    const stateValue = getStoreValue(state);
    const { previousState, originalIndex } = action.payload || {};
    if (!stateValue || !previousState || originalIndex === undefined) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    updateSubscriptionState(stateValue.byId, subscriptionId, previousState);
};

export const fetchNextNewsletterSubscriptionsPageFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof fetchNextNewsletterSubscriptionsPage.fulfilled>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const normalizedData = normalizeSubscriptions(action.payload.NewsletterSubscriptions);

    stateValue.byId = {
        ...stateValue.byId,
        ...normalizedData.byId,
    };

    getSelectedTabStateValue(stateValue).ids = [...getSelectedTabStateValue(stateValue).ids, ...normalizedData.ids];
    getSelectedTabStateValue(stateValue).paginationQueryString = action.payload.PageInfo.NextPage?.QueryString ?? null;
};

export const updateSubscriptionPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.pending>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    const originalIndex = stateValue.tabs.active.ids.indexOf(subscriptionId);

    updateSubscriptionState(stateValue.byId, subscriptionId, {
        UnsubscribedTime: Date.now(),
    });

    if (originalIndex !== -1) {
        stateValue.tabs.active.totalCount = safeDecreaseCount(stateValue.tabs.active.totalCount);
        // We don't remove the ID of the active tab now, we do this once the animation is done
        stateValue.deletingSubscriptionId = subscriptionId;
    }

    stateValue.tabs.unsubscribe.ids.unshift(subscriptionId);
    stateValue.tabs.unsubscribe.totalCount = safeIncreaseCount(stateValue.tabs.unsubscribe.totalCount);
};

export const updateSubscriptionRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.rejected>
) => {
    handleUpdateRejection(state, action);
};

export const updateSubscriptionFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.fulfilled>
) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    updateSubscriptionState(stateValue.byId, subscriptionId, action.payload.NewsletterSubscription);
};

export const handleServerEvent = (state: NewsletterSubscriptionsStateType, action: ReturnType<typeof serverEvent>) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    if (action.payload.NewsletterSubscriptions) {
        for (const update of action.payload.NewsletterSubscriptions) {
            // The update event must update the subscription object in the store and handle those two cases
            // 1. The subscription receives a new message, we should move it to the top of the list
            // 2. The subscription is unsubscribed, we should move it to the unsubscribe tab
            if (update.Action === EVENT_ACTIONS.UPDATE) {
                const subscriptionInStore = stateValue.byId[update.ID];
                const nextSubscription = update.NewsletterSubscription;

                const prevCount = getReceivedMessagesCount(subscriptionInStore);
                const nextCount = getReceivedMessagesCount(nextSubscription);

                const recentlyReceivedSelected =
                    stateValue.tabs[stateValue.selectedTab].sorting === SortSubscriptionsValue.RecentlyReceived;

                // We want to move the subscription to the top of the list if the we received a new message
                // and the selected tab is sorted by recently received
                if (prevCount < nextCount && recentlyReceivedSelected) {
                    if (subscriptionInStore.UnsubscribedTime) {
                        stateValue.tabs.unsubscribe.ids = moveIdToTop(stateValue.tabs.unsubscribe.ids, update.ID);
                    } else {
                        stateValue.tabs.active.ids = moveIdToTop(stateValue.tabs.active.ids, update.ID);
                    }
                }

                // We want to move the subscription to the unsubscribe tab if it is unsubscribed
                if (!subscriptionInStore.UnsubscribedTime && nextSubscription.UnsubscribedTime) {
                    stateValue.tabs.active.ids = filterNewsletterSubscriptionList(
                        stateValue.tabs.active.ids,
                        update.NewsletterSubscription.ID
                    );
                    stateValue.tabs.unsubscribe.ids = moveIdToTop(stateValue.tabs.unsubscribe.ids, update.ID);
                    stateValue.tabs.unsubscribe.totalCount = safeIncreaseCount(stateValue.tabs.unsubscribe.totalCount);
                    stateValue.tabs.active.totalCount = safeDecreaseCount(stateValue.tabs.active.totalCount);
                }

                updateSubscriptionState(stateValue.byId, update.ID, update.NewsletterSubscription);
            }

            // For the create event we must add the subscription to the appropriate tab and increase it's total count
            if (update.Action === EVENT_ACTIONS.CREATE) {
                if (update.NewsletterSubscription.UnsubscribedTime) {
                    stateValue.tabs.unsubscribe.ids = moveIdToTop(stateValue.tabs.unsubscribe.ids, update.ID);
                    stateValue.tabs.unsubscribe.totalCount = safeIncreaseCount(stateValue.tabs.unsubscribe.totalCount);
                } else {
                    stateValue.tabs.active.ids = moveIdToTop(stateValue.tabs.active.ids, update.ID);
                    stateValue.tabs.active.totalCount = safeIncreaseCount(stateValue.tabs.active.totalCount);
                }

                stateValue.byId[update.ID] = update.NewsletterSubscription;
            }

            // For the delete event we must remove the subscription from the appropriate tab, unselect it (if it was selected), and decrease it's total count
            if (update.Action === EVENT_ACTIONS.DELETE) {
                if (stateValue.byId[update.ID].UnsubscribedTime) {
                    stateValue.tabs.unsubscribe.totalCount = safeDecreaseCount(stateValue.tabs.unsubscribe.totalCount);
                } else {
                    stateValue.tabs.active.totalCount = safeDecreaseCount(stateValue.tabs.active.totalCount);
                }

                if (stateValue.selectedSubscriptionId === update.ID) {
                    stateValue.selectedSubscriptionId = undefined;
                    stateValue.selectedElementId = undefined;
                }

                // Always remove from both tabs
                stateValue.tabs.active.ids = filterNewsletterSubscriptionList(stateValue.tabs.active.ids, update.ID);

                stateValue.tabs.unsubscribe.ids = filterNewsletterSubscriptionList(
                    stateValue.tabs.unsubscribe.ids,
                    update.ID
                );

                delete stateValue.byId[update.ID];
            }
        }
    }
};
