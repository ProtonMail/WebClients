import { getSortParams } from 'proton-mail/store/newsletterSubscriptions/helpers';
import type {
    SortSubscriptionsValue,
    SubscriptionPagination,
} from 'proton-mail/store/newsletterSubscriptions/interface';

import type { ApplyNewsletterSubscriptionsFilter } from '../interfaces/NewsletterSubscription';

interface GetNewslettersProps {
    sort?: SortSubscriptionsValue;
    pagination?: SubscriptionPagination;
}

export const getNewsletterSubscription = ({ pagination, sort }: GetNewslettersProps) => ({
    url: 'mail/v4/newsletter-subscriptions',
    method: 'GET',
    params: {
        ...pagination,
        ...getSortParams(sort),
    },
});

export const applyNewsletterSubscriptionFilter = (
    subscriptionID: string,
    data: ApplyNewsletterSubscriptionsFilter
) => ({
    url: `mail/v4/newsletter-subscriptions/${subscriptionID}/filter`,
    method: 'POST',
    data,
});

export const unsubscribeNewsletterSubscription = (subscriptionID: string) => ({
    url: `mail/v4/newsletter-subscriptions/${subscriptionID}/unsubscribe`,
    method: 'POST',
});
