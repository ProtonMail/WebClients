import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type {
    CreateEventItemUpdate,
    DeleteEventItemUpdate,
    UpdateEventItemUpdate,
} from '@proton/shared/lib/helpers/updateCollection';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getReceivedMessagesCount } from 'proton-mail/components/view/NewsletterSubscription/helper';

import { type NewsletterSubscriptionsInterface, SortSubscriptionsValue } from './interface';
import type { unsubscribeSubscription, updateSubscription } from './newsletterSubscriptionsActions';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

export const filterNewsletterSubscriptionList = (list: string[], idToRemove?: string) => {
    return list.filter((id) => id !== idToRemove);
};

export const moveIdToTop = (list: string[], id: string) => {
    return [id, ...list.filter((item) => item !== id)];
};

export const getStoreValue = (state: NewsletterSubscriptionsStateType) => {
    return state.value;
};

export const getSelectedTabStateValue = (stateValue: NewsletterSubscriptionsInterface) => {
    return stateValue.tabs[stateValue.selectedTab];
};

export const updateSubscriptionState = (
    byId: Record<string, NewsletterSubscription>,
    subscriptionId: string,
    update: Partial<NewsletterSubscription>
) => {
    byId[subscriptionId] = {
        ...byId[subscriptionId],
        ...update,
        ID: subscriptionId,
    };
};

export const handleUpdateRejection = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof updateSubscription.rejected> | ReturnType<typeof unsubscribeSubscription.rejected>
) => {
    const stateValue = getStoreValue(state);
    const { previousState, originalIndex } = action.payload || {};
    if (!stateValue || !previousState || originalIndex === undefined || originalIndex < 0) {
        return;
    }

    const subscriptionId = previousState.ID;

    stateValue.byId[subscriptionId] = previousState;

    const unsubscribedId = stateValue.tabs.unsubscribe.ids.indexOf(subscriptionId);
    if (unsubscribedId !== -1) {
        stateValue.tabs.unsubscribe.ids.splice(unsubscribedId, 1);
        stateValue.tabs.unsubscribe.totalCount = safeDecreaseCount(stateValue.tabs.unsubscribe.totalCount);
    }

    // We select the previous subscription if we had an error
    if (!stateValue.selectedSubscriptionId) {
        stateValue.selectedSubscriptionId = subscriptionId;
    }

    stateValue.tabs.active.ids.splice(originalIndex, 0, subscriptionId);
    stateValue.tabs.active.totalCount = safeIncreaseCount(stateValue.tabs.active.totalCount);
    stateValue.unsubscribingSubscriptionId = undefined;
};

export const handleUnsubscribePending = (
    state: NewsletterSubscriptionsStateType,
    action: ReturnType<typeof unsubscribeSubscription.pending> | ReturnType<typeof updateSubscription.pending>
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
        stateValue.unsubscribingSubscriptionId = subscriptionId;
    }

    stateValue.tabs.unsubscribe.ids.unshift(subscriptionId);
    stateValue.tabs.unsubscribe.totalCount = safeIncreaseCount(stateValue.tabs.unsubscribe.totalCount);
};

export const handleCreateServerEvent = (
    state: NewsletterSubscriptionsStateType,
    update: CreateEventItemUpdate<NewsletterSubscription, 'NewsletterSubscription'>
) => {
    const stateValue = getStoreValue(state);

    if (!stateValue) {
        return;
    }

    if (update.NewsletterSubscription.UnsubscribedTime) {
        stateValue.tabs.unsubscribe.ids = moveIdToTop(stateValue.tabs.unsubscribe.ids, update.ID);
        stateValue.tabs.unsubscribe.totalCount = safeIncreaseCount(stateValue.tabs.unsubscribe.totalCount);
    } else {
        stateValue.tabs.active.ids = moveIdToTop(stateValue.tabs.active.ids, update.ID);
        stateValue.tabs.active.totalCount = safeIncreaseCount(stateValue.tabs.active.totalCount);
    }

    stateValue.byId[update.ID] = update.NewsletterSubscription;
};

export const handleUpdateServerEvent = (
    state: NewsletterSubscriptionsStateType,
    update: UpdateEventItemUpdate<NewsletterSubscription, 'NewsletterSubscription'>
) => {
    const stateValue = getStoreValue(state);

    if (!stateValue) {
        return;
    }

    const subscriptionInStore = stateValue.byId[update.ID];

    if (!subscriptionInStore) {
        // If the NewsletterSubscription item is not present in the store, we create it
        handleCreateServerEvent(state, {
            ID: update.ID,
            Action: EVENT_ACTIONS.CREATE,
            NewsletterSubscription: update.NewsletterSubscription as NewsletterSubscription,
        });
        return;
    }

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
};

export const handleDeleteServerEvent = (state: NewsletterSubscriptionsStateType, update: DeleteEventItemUpdate) => {
    const stateValue = getStoreValue(state);
    if (!stateValue) {
        return;
    }

    if (stateValue.selectedSubscriptionId === update.ID) {
        stateValue.selectedSubscriptionId = undefined;
        stateValue.selectedElementId = undefined;
    }

    // Always remove from both tabs
    stateValue.tabs.active.ids = filterNewsletterSubscriptionList(stateValue.tabs.active.ids, update.ID);
    stateValue.tabs.unsubscribe.ids = filterNewsletterSubscriptionList(stateValue.tabs.unsubscribe.ids, update.ID);

    // We want to make sure the subscription is in the store before changing the counts and deleting it
    if (stateValue.byId[update.ID]) {
        if (stateValue.byId[update.ID].UnsubscribedTime) {
            stateValue.tabs.unsubscribe.totalCount = safeDecreaseCount(stateValue.tabs.unsubscribe.totalCount);
        } else {
            stateValue.tabs.active.totalCount = safeDecreaseCount(stateValue.tabs.active.totalCount);
        }
    }

    delete stateValue.byId[update.ID];
};
