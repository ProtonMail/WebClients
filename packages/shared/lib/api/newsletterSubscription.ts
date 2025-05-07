import { getSortParams } from 'proton-mail/store/newsletterSubscriptions/helpers';
import type { SortSubscriptionsValue } from 'proton-mail/store/newsletterSubscriptions/interface';

import type { ApplyNewsletterSubscriptionsFilter } from '../interfaces/NewsletterSubscription';

export const getNewsletterSubscription = (sort?: SortSubscriptionsValue) => ({
    url: 'mail/v4/newsletter-subscriptions',
    method: 'GET',
    params: {
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
