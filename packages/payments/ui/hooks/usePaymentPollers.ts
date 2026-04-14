import isDeepEqual from 'lodash/isEqual';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useGetSubscription } from '@proton/account/subscription/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { CacheType } from '@proton/redux-utilities';

import { Renew } from '../../core/subscription/constants';
import type { Subscription } from '../../core/subscription/interface';
import { isFreeSubscription } from '../../core/type-guards';
import { usePollCondition } from './usePollCondition';

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
                return !isDeepEqual(initialSubscription, await getSubscription({ cache: CacheType.None }));
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
