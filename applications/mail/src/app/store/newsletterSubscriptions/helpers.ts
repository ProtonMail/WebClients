import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { DEFAULT_SORTING } from './constants';
import type { NewsletterSubscriptionsTabState, SortSubscriptionsValue } from './interface';

export const normalizeSubscriptions = (subscriptions: NewsletterSubscription[]) => {
    const byId: Record<string, NewsletterSubscription> = {};
    const ids: string[] = [];
    for (const sub of subscriptions) {
        byId[sub.ID] = sub;
        ids.push(sub.ID);
    }
    return { byId, ids };
};

export const getTabData = (
    ids: string[],
    apiData: GetNewsletterSubscriptionsApiResponse,
    loading = false,
    sorting?: SortSubscriptionsValue
): NewsletterSubscriptionsTabState => {
    return {
        ids,
        loading,
        sorting: sorting ?? DEFAULT_SORTING,
        totalCount: apiData.PageInfo.Total ?? 0,
        paginationQueryString: apiData.PageInfo.NextPage?.QueryString ?? null,
    };
};

export const getSortParams = (sortOption?: SortSubscriptionsValue) => {
    if (!sortOption) {
        return undefined;
    }

    switch (sortOption) {
        case 'last-read':
            return 'Sort[UnreadMessageCount]=ASC';
        case 'most-read':
            return 'Sort[UnreadMessageCount]=DESC';
        case 'alphabetical':
            return 'Sort[Name]=ASC';
        case 'recently-received':
            return 'Sort[LastReceivedTime]=DESC';
        default:
            return undefined;
    }
};
