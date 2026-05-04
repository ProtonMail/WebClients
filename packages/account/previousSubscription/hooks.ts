import { createHooks } from '@proton/redux-utilities/hooks';

import { defaultPreviousSubscriptionValue, previousSubscriptionThunk, selectPreviousSubscription } from './index';

const hooks = createHooks(previousSubscriptionThunk, selectPreviousSubscription);

/**
 * Returns the user's previous subscription as a discriminated union:
 * - `{ hasHadSubscription: false, previousSubscription: null }` when the user has no relevant previous subscription
 *   (including paid users — see the thunk in `./index.ts` for why).
 * - `{ hasHadSubscription: true, previousSubscription: PreviousSubscription }` when a previous subscription was found.
 *
 * `hasHadSubscription` being true on a free user indicates they have churned.
 */
export const usePreviousSubscription = () => {
    const [value, loading] = hooks.useValue();
    return [value || defaultPreviousSubscriptionValue, loading] as const;
};

export const useGetPreviousSubscription = hooks.useGet;
