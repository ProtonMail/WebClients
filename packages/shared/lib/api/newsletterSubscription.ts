import type {
    ApplyNewsletterSubscriptionsFilter,
    UpdateNewsletterSubscription,
} from '../interfaces/NewsletterSubscription';

interface GetNewslettersProps {
    paginationString: string | null;
}

export const getNewsletterSubscription = ({ paginationString }: GetNewslettersProps) => ({
    url: `mail/v4/newsletter-subscriptions${paginationString ? `?${paginationString}` : ''}`,
    method: 'GET',
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

export const updateNewsletterSubscription = (subscriptionID: string, data: UpdateNewsletterSubscription) => ({
    url: `mail/v4/newsletter-subscriptions/${subscriptionID}`,
    method: 'POST',
    data,
});

export const deleteNewsletterSubscriptionByID = (subscriptionID: string) => ({
    url: `mail/v4/newsletter-subscriptions/${subscriptionID}`,
    method: 'DELETE',
});
