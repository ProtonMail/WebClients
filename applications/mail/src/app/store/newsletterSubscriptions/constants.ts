import { getSortParams } from './helpers';
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

export const getPaginationQueryString = (active: boolean = true, sort: SortSubscriptionsValue = DEFAULT_SORTING) => {
    return `PageSize=${DEFAULT_PAGINATION_PAGE_SIZE}&Active=${active ? '1' : '0'}&Spam=0&${getSortParams(sort)}&Sort[ID]=DESC`;
};

const initialTabState: NewsletterSubscriptionsTabState = {
    ids: [],
    totalCount: 0,
    loading: true,
    sorting: DEFAULT_SORTING,
    paginationQueryString: null,
};

export const initialStateValue: NewsletterSubscriptionsInterface = {
    byId: {},
    tabs: {
        active: initialTabState,
        unsubscribe: initialTabState,
    },
    selectedTab: SubscriptionTabs.Active,
    selectedSubscriptionId: undefined,
    selectedElementId: undefined,
    unsubscribingSubscriptionId: undefined,
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
