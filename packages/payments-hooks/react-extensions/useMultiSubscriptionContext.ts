import { useMemo } from 'react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import type { EntitlementCatalog } from '@proton/payments/core/entitlements/interface';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/interface';
import {
    type MultiSubscriptionContext,
    createMultiSubscriptionContext,
} from '@proton/payments/core/subscription/multi-subscription-context';
import { useFlag } from '@proton/unleash/useFlag';

export const useMultiSubscriptionContext = (
    subscription?: MaybeFreeSubscription,
    entitlementCatalog?: EntitlementCatalog
): MultiSubscriptionContext => {
    const lumoMultiSubscriptions = useFlag('LumoMultiSubscriptions');
    const [storeSubscription] = useSubscription();
    const [storeEntitlementCatalog] = useEntitlementCatalog();

    const accountSubscription = subscription ?? storeSubscription;
    const accountEntitlementCatalog =
        accountSubscription === undefined ? undefined : (entitlementCatalog ?? storeEntitlementCatalog);

    return useMemo(
        () =>
            createMultiSubscriptionContext({
                lumoMultiSubscriptions,
                subscription: accountSubscription,
                entitlementCatalog: accountEntitlementCatalog,
            }),
        [lumoMultiSubscriptions, accountSubscription, accountEntitlementCatalog]
    );
};
