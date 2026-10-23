import { useMemo } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getSubscriptionForApp } from '@proton/payments/core/subscription/subscription-for-app';

export const useSubscriptionForApp = (): [Subscription | undefined, boolean] => {
    const [allSubscriptions, loadingAllSubscriptions] = useAllSubscriptions();
    const [entitlementCatalog, loadingEntitlementCatalog] = useEntitlementCatalog();
    const { APP_NAME } = useConfig();

    const subscription = useMemo(
        () => getSubscriptionForApp(allSubscriptions ?? [], entitlementCatalog, APP_NAME),
        [allSubscriptions, entitlementCatalog, APP_NAME]
    );

    return [subscription, loadingAllSubscriptions || loadingEntitlementCatalog];
};
