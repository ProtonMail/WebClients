import type {
    ApplyNewsletterSubscriptionsFilter,
    NewsletterSubscription,
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

export interface SubscriptionPagination {
    PageSize?: number;
    AnchorID?: string;
    AnchorLastReceivedTime?: string;
    Active?: ActiveValues;
}

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

export interface NewsletterSubscriptionsTabState {
    ids: string[];
    totalCount: number;
    paginationData: SubscriptionPagination | undefined;
    loading: boolean;
    sorting: SortSubscriptionsValue;
}

export interface NewsletterSubscriptionsInterface {
    byId: Record<string, NewsletterSubscription>;
    tabs: {
        [SubscriptionTabs.Active]: NewsletterSubscriptionsTabState;
        [SubscriptionTabs.Unsubscribe]: NewsletterSubscriptionsTabState;
    };
    selectedTab: SubscriptionTabs;
    selectedSubscriptionId?: string;
}
