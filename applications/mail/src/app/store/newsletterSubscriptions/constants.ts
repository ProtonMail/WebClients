import type { NewsletterSubscriptionsInterface, SubscriptionCounts } from './interface';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

export const DEFAULT_SUBSCRIPTION_COUNTS: SubscriptionCounts = {
    active: 0,
    unsubscribe: 0,
};

export const initialStateValue: NewsletterSubscriptionsInterface = {
    counts: DEFAULT_SUBSCRIPTION_COUNTS,
    subscriptions: [],
    selectedSubscription: undefined,
    filteredSubscriptions: [],
    loading: true,
};

export const DEFAULT_META = {
    fetchedAt: 0,
    fetchedEphemeral: true,
};

export const initialState: NewsletterSubscriptionsStateType = {
    value: initialStateValue,
    error: undefined,
    meta: DEFAULT_META,
};
