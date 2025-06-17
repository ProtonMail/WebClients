import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type { NewsletterSubscriptionsInterface } from './interface';
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
    stateValue.deletingSubscriptionId = undefined;
};
