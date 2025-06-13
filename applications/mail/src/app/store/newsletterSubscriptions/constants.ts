import {
    type NewsletterSubscriptionsInterface,
    type NewsletterSubscriptionsTabState,
    SortSubscriptionsValue,
    type SubscriptionCounts,
    SubscriptionTabs,
} from './interface';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

export const DEFAULT_SUBSCRIPTION_COUNTS: SubscriptionCounts = {
    active: 0,
    unsubscribe: 0,
};

export const DEFAULT_PAGINATION_PAGE_SIZE = 100;
export const MAX_FOLDER_NAME_LENGTH = 100;
export const DEFAULT_SORTING = SortSubscriptionsValue.RecentlyReceived;

const initialTabState: NewsletterSubscriptionsTabState = {
    ids: [],
    totalCount: 0,
    paginationData: undefined,
    loading: true,
    sorting: DEFAULT_SORTING,
};

export const initialStateValue: NewsletterSubscriptionsInterface = {
    byId: {},
    tabs: {
        active: { ...initialTabState, paginationData: { ...initialTabState.paginationData, Active: '1' } },
        unsubscribe: { ...initialTabState, paginationData: { ...initialTabState.paginationData, Active: '0' } },
    },
    selectedTab: SubscriptionTabs.Active,
    selectedSubscriptionId: undefined,
    selectedElementId: undefined,
    deletingSubscriptionId: undefined,
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
