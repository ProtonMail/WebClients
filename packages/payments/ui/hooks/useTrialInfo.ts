import { useSubscription } from '@proton/account/subscription/hooks';

import { type SubscriptionExistsTrialInfo, getTrialInfo } from '../../core/trials';
import { isFreeSubscription } from '../../core/type-guards';

export function useTrialInfo(): Partial<SubscriptionExistsTrialInfo> {
    const [subscription] = useSubscription();

    if (!subscription || isFreeSubscription(subscription)) {
        return {};
    }

    // Once we have multi-subs, simply pass an array of all subscriptions here.
    return getTrialInfo([subscription]) as SubscriptionExistsTrialInfo;
}
