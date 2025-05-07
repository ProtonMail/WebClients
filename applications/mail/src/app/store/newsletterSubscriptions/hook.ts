import { createHooks } from '@proton/redux-utilities';

import type { NewsletterSubscriptionsInterface } from './interface';
import { newsletterSubscriptionsThunk, selectNewsletterSubscriptions } from './newsletterSubscriptionsSlice';

const hooks = createHooks(newsletterSubscriptionsThunk, selectNewsletterSubscriptions);

// This is technically incorrect but all apps assume that it's preloaded
export const useNewsletterSubscriptions = hooks.useValue as unknown as () => [
    NewsletterSubscriptionsInterface,
    boolean,
];
export const useGetNewsletterSubscription = hooks.useGet;
