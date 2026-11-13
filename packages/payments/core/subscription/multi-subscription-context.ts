import type { EntitlementCatalog } from '../entitlements/interface';
import { isPaidSubscription } from '../type-guards';
import { getSubscriptionsArray } from './helpers/external-management';
import type { MaybeFreeSubscription, Subscription } from './interface';

export interface MultiSubscriptionContext {
    lumoMultiSubscriptions: boolean;
    subscriptions: Subscription[];
    entitlementCatalog: EntitlementCatalog | undefined;
}

export const toSubscriptionList = (subscription: MaybeFreeSubscription | null | undefined): Subscription[] => {
    if (!subscription || !isPaidSubscription(subscription)) {
        return [];
    }

    return getSubscriptionsArray(subscription).map((it) => ({ ...it, SecondarySubscriptions: undefined }));
};

export const createMultiSubscriptionContext = ({
    lumoMultiSubscriptions,
    subscription,
    entitlementCatalog,
}: {
    lumoMultiSubscriptions: boolean;
    subscription: MaybeFreeSubscription | null | undefined;
    entitlementCatalog: EntitlementCatalog | undefined;
}): MultiSubscriptionContext => ({
    lumoMultiSubscriptions: lumoMultiSubscriptions && entitlementCatalog !== undefined,
    subscriptions: toSubscriptionList(subscription),
    entitlementCatalog,
});

export const noSubscriptionContext = createMultiSubscriptionContext({
    lumoMultiSubscriptions: false,
    subscription: undefined,
    entitlementCatalog: undefined,
});
