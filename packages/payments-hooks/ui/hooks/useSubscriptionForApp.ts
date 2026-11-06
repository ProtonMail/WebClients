import { useMemo } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getSubscriptionForApp } from '@proton/payments/core/subscription/subscription-for-app';
import type { APP_NAMES } from '@proton/shared/lib/constants';

export const useSubscriptionForApp = (app?: APP_NAMES): [Subscription | undefined, boolean] => {
    const [allSubscriptions, loadingAllSubscriptions] = useAllSubscriptions();
    const [entitlementCatalog, loadingEntitlementCatalog] = useEntitlementCatalog();
    const { APP_NAME } = useConfig();
    const appName = app ?? APP_NAME;

    const subscription = useMemo(
        () => getSubscriptionForApp(allSubscriptions ?? [], entitlementCatalog, appName),
        [allSubscriptions, entitlementCatalog, appName]
    );

    return [subscription, loadingAllSubscriptions || loadingEntitlementCatalog];
};
