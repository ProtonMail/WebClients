import { useMemo } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialSubscription } from '@proton/payments/core/trials';

export function useReferralTrialSubscription(): [Subscription | undefined, boolean] {
    const [subscriptions, loadingSubscriptions] = useAllSubscriptions();
    const [entitlementCatalog] = useEntitlementCatalog();

    const referralTrialSubscription = useMemo(
        () => getTrialSubscription(entitlementCatalog, subscriptions ?? [], { isReferralTrial: true }) ?? undefined,
        [entitlementCatalog, subscriptions]
    );

    return [referralTrialSubscription, loadingSubscriptions];
}
