import type {
    ApplyNewsletterSubscriptionsFilter,
    NewsletterSubscription,
    UpdateNewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

export enum SubscriptionTabs {
    Active = 'active',
    Unsubscribe = 'unsubscribe',
}
export type ActiveValues = '0' | '1';

export interface SubscriptionCounts {
    active: number;
    unsubscribe: number;
}

export enum SortSubscriptionsValue {
    LastRead = 'last-read',
    MostRead = 'most-read',
    MostFrequent = 'most-frequent',
    Alphabetical = 'alphabetical',
    RecentlyRead = 'recently-read',
    RecentlyReceived = 'recently-received',
}

export interface UpdateSubscriptionParams {
    idToUpdate: string;
    subscription: NewsletterSubscription;
    keys: Partial<NewsletterSubscription>;
}

export interface NewsletterSubscriptionsTabState {
    ids: string[];
    totalCount: number;
    loading: boolean;
    sorting: SortSubscriptionsValue;
    paginationQueryString: string | null;
}

export interface NewsletterSubscriptionsInterface {
    byId: Record<string, NewsletterSubscription>;
    tabs: {
        [SubscriptionTabs.Active]: NewsletterSubscriptionsTabState;
        [SubscriptionTabs.Unsubscribe]: NewsletterSubscriptionsTabState;
    };
    selectedTab: SubscriptionTabs;
    selectedSubscriptionId: string | undefined;
    selectedElementId: string | undefined;
    unsubscribingSubscriptionId: string | undefined;
}

interface ActionsWithRollback {
    subscription: NewsletterSubscription;
    subscriptionIndex?: number;
}

export interface FilterSubscriptionPayload extends ActionsWithRollback {
    data: ApplyNewsletterSubscriptionsFilter;
}

export interface UnsubscribePayload extends ActionsWithRollback {}

export interface UpdateSubscriptionPayload extends ActionsWithRollback {
    data: UpdateNewsletterSubscription;
}
