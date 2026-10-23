import { useMemo } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { type SubscriptionExistsTrialInfo, getTrialInfo } from '@proton/payments/core/trials';

export function useTrialInfo(): Partial<SubscriptionExistsTrialInfo> {
    const [subscriptions] = useAllSubscriptions();
    const [entitlementCatalog] = useEntitlementCatalog();

    return useMemo(() => {
        if (!subscriptions || subscriptions.length === 0) {
            return {};
        }

        return getTrialInfo(entitlementCatalog, subscriptions) as SubscriptionExistsTrialInfo;
    }, [subscriptions, entitlementCatalog]);
}
