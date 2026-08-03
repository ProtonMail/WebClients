import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';

import type { NewsletterSubscriptionsInterface } from './interface';

export const newsletterSubscriptionName = 'newsletterSubscriptions' as const;

export type NewsletterSubscriptionsStateType = ModelState<NewsletterSubscriptionsInterface>;

export interface NewsletterSubscriptionsState {
    [newsletterSubscriptionName]: NewsletterSubscriptionsStateType;
}
