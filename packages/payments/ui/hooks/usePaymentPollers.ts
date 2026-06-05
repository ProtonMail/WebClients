import isDeepEqual from 'lodash/isEqual';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useGetSubscription } from '@proton/account/subscription/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { CacheType } from '@proton/redux-utilities/interface';

import { Renew } from '../../core/subscription/constants';
import type { Subscription } from '../../core/subscription/interface';
import { isFreeSubscription } from '../../core/type-guards';
import { usePollCondition } from './usePollCondition';

/**
 * Returns factory functions for payments. They are useful for the cases when we modify the subscription, payment
 * methods, credits or subscription renew enabled, etc and we must make sure that frontend has the latest data. The
 * pollers functions return a promise that resolves to true if the data has changed, or false if it hasn't. They run in
 * a loop with a delay until the data changes or the retry counter runs out.
 */
export const usePaymentPollers = () => {
    const poll = usePollCondition();
    const getSubscription = useGetSubscription();
    const getPaymentMethods = useGetPaymentMethods();
    const getUser = useGetUser();

    const createSubscriptionPoller = () => {
        const initialSubscriptionPromise = getSubscription();

        const pollSubscription = async () => {
            const initialSubscription = await initialSubscriptionPromise;
            return poll(async () => {
                // handles the case for free-to-paid upgrades.
                // 1) cached user free, force-fetched user is free. In this case we can't fetch the subscription yet, so
                //    we return false to continue the polling.
                // 2) cached user free, force-fetched user is paid. In this case we can fetch the subscription, because
                //    the backend tells us that the user recently became paid.
                // 3) cached user paid. No need to force-fetch the user, so we can fetch the subscription now.
                const cachedUser = await getUser();
                if (cachedUser.isFree) {
                    const currentUser = await getUser({ cache: CacheType.None });
                    if (currentUser.isFree) {
                        return false;
                    }
                }

                // Force-fetching the subscription and compare it to what was cached. If the new subscription is
                // different, then we need to return true to stop polling.
                const currentSubscription = await getSubscription({ cache: CacheType.None });
                return !isDeepEqual(initialSubscription, currentSubscription);
            });
        };

        return pollSubscription;
    };

    const createPaymentMethodsPoller = () => {
        const initialPaymentMethodsPromise = getPaymentMethods();

        const pollPaymentMethods = async () => {
            const initialPaymentMethods = await initialPaymentMethodsPromise;
            return poll(async () => {
                return !isDeepEqual(initialPaymentMethods, await getPaymentMethods({ cache: CacheType.None }));
            });
        };

        return pollPaymentMethods;
    };

    const createCreditsPoller = () => {
        const initialUserPromise = getUser();

        const pollCredits = async () => {
            const initialCredits = (await initialUserPromise).Credit;
            return poll(async () => {
                return initialCredits !== (await getUser({ cache: CacheType.None })).Credit;
            });
        };

        return pollCredits;
    };

    const createSubscriptionRenewEnabledPoller = () => {
        const initialSubscriptionPromise = getSubscription();

        const pollSubscriptionRenewEnabled = async () => {
            const initialSubscription = await initialSubscriptionPromise;

            if (isFreeSubscription(initialSubscription)) {
                return false;
            }

            return poll(async () => {
                return ((await getSubscription({ cache: CacheType.None })) as Subscription).Renew === Renew.Enabled;
            });
        };

        return pollSubscriptionRenewEnabled;
    };

    return {
        createSubscriptionPoller,
        createPaymentMethodsPoller,
        createCreditsPoller,
        createSubscriptionRenewEnabledPoller,
    };
};
