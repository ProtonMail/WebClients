import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type {
    NewsletterSubscriptionsInterface,
    SortSubscriptionsValue,
    SubscriptionCounts,
    UpdateSubscriptionParams,
} from './interface';

export const formatSubscriptionResponse = (
    data: GetNewsletterSubscriptionsApiResponse
): NewsletterSubscriptionsInterface => {
    const activeSubs = data.NewsletterSubscriptions.filter((subscription) => !subscription.UnsubscribedTime);

    const counts: SubscriptionCounts = {
        active: activeSubs.length,
        unsubscribe: data.NewsletterSubscriptions.length - activeSubs.length,
    };

    return {
        counts,
        subscriptions: data.NewsletterSubscriptions,
        selectedSubscription: activeSubs[0],
        filteredSubscriptions: activeSubs,
        loading: false,
    };
};

export const getSortParams = (sortOption?: SortSubscriptionsValue) => {
    if (!sortOption) {
        return undefined;
    }

    switch (sortOption) {
        case 'last-read':
            return {
                UnreadMessageCount: 'ASC',
            };
        case 'most-read':
            return {
                UnreadMessageCount: 'DESC',
            };
        case 'alphabetical':
            return {
                Name: 'ASC',
            };
        case 'recently-received':
            return {
                LastReceivedTime: 'DESC',
            };
        default:
            return undefined;
    }
};

export const updateSubscriptionKeysIfCorrectID = ({
    idToUpdate,
    subscription,
    keys,
}: UpdateSubscriptionParams): NewsletterSubscription => {
    if (idToUpdate === subscription.ID) {
        return {
            ...subscription,
            ...keys,
        };
    }
    return subscription;
};
