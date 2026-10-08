import { useMemo } from 'react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { type SubscriptionExistsTrialInfo, getTrialInfo } from '@proton/payments/core/trials';
import { isFreeSubscription } from '@proton/payments/core/type-guards';

export function useTrialInfo(): Partial<SubscriptionExistsTrialInfo> {
    const [subscription] = useSubscription();
    const [entitlementCatalog] = useEntitlementCatalog();

    return useMemo(() => {
        if (!subscription || isFreeSubscription(subscription)) {
            return {};
        }

        // Once we have multi-subs, simply pass an array of all subscriptions here.
        return getTrialInfo(entitlementCatalog, [subscription]) as SubscriptionExistsTrialInfo;
    }, [subscription, entitlementCatalog]);
}
