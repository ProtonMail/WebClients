import type { PayloadAction } from '@reduxjs/toolkit';

import type { serverEvent } from '@proton/account';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getReceivedMessagesCount } from 'proton-mail/components/view/NewsletterSubscription/helper';

import {
    decrementCount,
    filterNewsletterSubscriptionList,
    incrementCount,
    moveIdToTop,
    normalizeSubscriptions,
} from './helpers';
import { SortSubscriptionsValue, type SubscriptionTabs } from './interface';
import type {
    fetchNextNewsletterSubscriptionsPage,
    filterSubscriptionList,
    unsubscribeSubscription,
    updateSubscription,
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
    state.value.selectedElementId = undefined;
    state.value.selectedSubscriptionId = undefined;
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

export const removeSubscriptionFromActiveTabReducer = (
    state: NewsletterSubscriptionsStateType,
    action: PayloadAction<string>
) => {
    if (!state.value) {
        return;
    }

    const originalIndex = state.value.tabs.active.ids.indexOf(action.payload);

    if (originalIndex !== -1) {
        state.value.tabs.active.ids.splice(originalIndex, 1);
    }
};

export const deleteSubscriptionAnimationEndedReducer = (state: NewsletterSubscriptionsStateType) => {
    if (!state.value) {
        return;
    }

    state.value.deletingSubscriptionId = undefined;
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

    // We unselect the subscription if it's the one currently selected
    if (state.value.selectedSubscriptionId === subscriptionId) {
        state.value.selectedSubscriptionId = undefined;
    }

    if (originalIndex !== -1) {
        state.value.tabs.active.totalCount = decrementCount(state.value.tabs.active.totalCount);
        // We don't remove the ID of the active tab now, we do this once the animation is done
        state.value.deletingSubscriptionId = subscriptionId;
    }

    state.value.tabs.unsubscribe.ids.unshift(subscriptionId);
    state.value.tabs.unsubscribe.totalCount = incrementCount(state.value.tabs.unsubscribe.totalCount);
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
        state.value.tabs.unsubscribe.totalCount = decrementCount(state.value.tabs.unsubscribe.totalCount);
    }

    // We select the previous subscription if we had an error
    if (!state.value.selectedSubscriptionId) {
        state.value.selectedSubscriptionId = subscriptionId;
    }

    state.value.tabs.active.ids.splice(originalIndex, 0, subscriptionId);
    state.value.tabs.active.totalCount = incrementCount(state.value.tabs.active.totalCount);
    state.value.deletingSubscriptionId = undefined;
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
    state.value.tabs[tab].paginationQueryString = action.payload.PageInfo.NextPage?.QueryString ?? null;

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
    const MoveToFolder = action.meta.arg.data.DestinationFolder ?? null;

    state.value.byId[subscriptionId] = {
        ...state.value.byId[subscriptionId],
        UnreadMessageCount: MarkAsRead ? 0 : state.value.byId[subscriptionId].UnreadMessageCount,
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
    state.value.tabs[tab].paginationQueryString = action.payload.PageInfo.NextPage?.QueryString ?? null;
};

export const updateSubscriptionPending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.pending>
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
        state.value.tabs.active.totalCount = decrementCount(state.value.tabs.active.totalCount);
        // We don't remove the ID of the active tab now, we do this once the animation is done
        state.value.deletingSubscriptionId = subscriptionId;
    }

    state.value.tabs.unsubscribe.ids.unshift(subscriptionId);
    state.value.tabs.unsubscribe.totalCount = incrementCount(state.value.tabs.unsubscribe.totalCount);
};

export const updateSubscriptionRejected = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.rejected>
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
        state.value.tabs.unsubscribe.totalCount = decrementCount(state.value.tabs.unsubscribe.totalCount);
    }

    // We select the previous subscription if we had an error
    if (!state.value.selectedSubscriptionId) {
        state.value.selectedSubscriptionId = subscriptionId;
    }

    state.value.tabs.active.ids.splice(originalIndex, 0, subscriptionId);
    state.value.tabs.active.totalCount = incrementCount(state.value.tabs.active.totalCount);
};

export const updateSubscriptionFulfilled = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.fulfilled>
) => {
    if (!state.value) {
        return;
    }

    const subscriptionId = action.meta.arg.subscription.ID;
    state.value.byId[subscriptionId] = {
        ...action.payload.NewsletterSubscription,
    };
};

export const handleServerEvent = (state: NewsletterSubscriptionsStateType, action: ReturnType<typeof serverEvent>) => {
    if (!state.value) {
        return;
    }

    if (action.payload.NewsletterSubscriptions) {
        for (const update of action.payload.NewsletterSubscriptions) {
            // The update event must update the subscription object in the store and handle those two cases
            // 1. The subscription receives a new message, we should move it to the top of the list
            // 2. The subscription is unsubscribed, we should move it to the unsubscribe tab
            if (update.Action === EVENT_ACTIONS.UPDATE) {
                const subscriptionInStore = state.value.byId[update.ID];
                const nextSubscription = update.NewsletterSubscription;

                const prevCount = getReceivedMessagesCount(subscriptionInStore);
                const nextCount = getReceivedMessagesCount(nextSubscription);

                const recentlyReceivedSelected =
                    state.value.tabs[state.value.selectedTab].sorting === SortSubscriptionsValue.RecentlyReceived;

                // We want to move the subscription to the top of the list if the we received a new message
                // and the selected tab is sorted by recently received
                if (prevCount < nextCount && recentlyReceivedSelected) {
                    if (subscriptionInStore.UnsubscribedTime) {
                        state.value.tabs.unsubscribe.ids = moveIdToTop(state.value.tabs.unsubscribe.ids, update.ID);
                    } else {
                        state.value.tabs.active.ids = moveIdToTop(state.value.tabs.active.ids, update.ID);
                    }
                }

                // We want to move the subscription to the unsubscribe tab if it is unsubscribed
                if (!subscriptionInStore.UnsubscribedTime && nextSubscription.UnsubscribedTime) {
                    state.value.tabs.active.ids = filterNewsletterSubscriptionList(
                        state.value.tabs.active.ids,
                        update.NewsletterSubscription.ID
                    );
                    state.value.tabs.unsubscribe.ids = moveIdToTop(state.value.tabs.unsubscribe.ids, update.ID);
                    state.value.tabs.unsubscribe.totalCount = incrementCount(state.value.tabs.unsubscribe.totalCount);
                    state.value.tabs.active.totalCount = decrementCount(state.value.tabs.active.totalCount);
                }

                state.value.byId[update.ID] = {
                    ...state.value.byId[update.ID],
                    ...update.NewsletterSubscription,
                };
            }

            // For the create event we must add the subscription to the appropriate tab and increase it's total count
            if (update.Action === EVENT_ACTIONS.CREATE) {
                if (update.NewsletterSubscription.UnsubscribedTime) {
                    state.value.tabs.unsubscribe.ids = moveIdToTop(state.value.tabs.unsubscribe.ids, update.ID);
                    state.value.tabs.unsubscribe.totalCount = incrementCount(state.value.tabs.unsubscribe.totalCount);
                } else {
                    state.value.tabs.active.ids = moveIdToTop(state.value.tabs.active.ids, update.ID);
                    state.value.tabs.active.totalCount = incrementCount(state.value.tabs.active.totalCount);
                }

                state.value.byId[update.ID] = update.NewsletterSubscription;
            }

            // For the delete event we must remove the subscription from the appropriate tab, unselect it (if it was selected), and decrease it's total count
            if (update.Action === EVENT_ACTIONS.DELETE) {
                if (state.value.byId[update.ID].UnsubscribedTime) {
                    state.value.tabs.unsubscribe.totalCount = decrementCount(state.value.tabs.unsubscribe.totalCount);
                } else {
                    state.value.tabs.active.totalCount = decrementCount(state.value.tabs.active.totalCount);
                }

                if (state.value.selectedSubscriptionId === update.ID) {
                    state.value.selectedSubscriptionId = undefined;
                    state.value.selectedElementId = undefined;
                }

                // Always remove from both tabs
                state.value.tabs.active.ids = filterNewsletterSubscriptionList(state.value.tabs.active.ids, update.ID);

                state.value.tabs.unsubscribe.ids = filterNewsletterSubscriptionList(
                    state.value.tabs.unsubscribe.ids,
                    update.ID
                );

                delete state.value.byId[update.ID];
            }
        }
    }
};
