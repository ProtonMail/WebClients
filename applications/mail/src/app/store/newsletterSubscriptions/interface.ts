import type {
    ApplyNewsletterSubscriptionsFilter,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

export type SubscriptionTabs = 'active' | 'unsubscribe';

export interface SubscriptionCounts {
    active: number;
    unsubscribe: number;
}

export interface NewsletterSubscriptionsInterface {
    counts: SubscriptionCounts;
    subscriptions: NewsletterSubscription[];
    filteredSubscriptions: NewsletterSubscription[];
    selectedSubscription?: NewsletterSubscription;
    loading: boolean;
    selectedTab: SubscriptionTabs;
}

export type SortSubscriptionsValue =
    | 'last-read'
    | 'most-read'
    | 'most-frequent'
    | 'alphabetical'
    | 'recently-read'
    | 'recently-received';

export interface FilterSubscriptionPayload {
    subscription: NewsletterSubscription;
    subscriptionIndex?: number;
    data: ApplyNewsletterSubscriptionsFilter;
}

export interface UnsubscribePayload {
    subscription: NewsletterSubscription;
    subscriptionIndex?: number;
}

export interface UpdateSubscriptionParams {
    idToUpdate: string;
    subscription: NewsletterSubscription;
    keys: Partial<NewsletterSubscription>;
}
