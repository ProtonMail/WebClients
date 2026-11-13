import type { EntitlementCatalog } from '../entitlements/interface';
import { type ProductFlag, productFlags } from '../entitlements/product-flags';
import { createEntitlementResolverForSelection } from '../entitlements/resolver';
import type { PlanIDs } from '../interface';
import { getWebSubscriptions, isManagedExternally } from './helpers/external-management';
import type { Subscription } from './interface';
import { canRunAlongside } from './lumo-purchase-rules';
import type { MultiSubscriptionContext } from './multi-subscription-context';

export type PurchaseOutcome =
    { type: 'new-subscription' } | { type: 'replaces'; subscription: Subscription } | { type: 'refused' };

const refused: PurchaseOutcome = { type: 'refused' };

const getGrantedProductFlags = (
    entitlementCatalog: EntitlementCatalog | undefined,
    selection: Subscription | PlanIDs
): ProductFlag[] => {
    const entitlements = createEntitlementResolverForSelection(entitlementCatalog, selection);
    return productFlags.filter((flag) => entitlements.hasEntitlement(flag));
};

const sharesAProduct = (
    entitlementCatalog: EntitlementCatalog | undefined,
    subscription: Subscription,
    planIDs: PlanIDs
): boolean => {
    const purchasedProducts = getGrantedProductFlags(entitlementCatalog, planIDs);
    return getGrantedProductFlags(entitlementCatalog, subscription).some((flag) => purchasedProducts.includes(flag));
};

const getOnlyWebSubscription = (subscriptions: Subscription[]): Subscription | undefined => {
    const webSubscriptions = getWebSubscriptions(subscriptions);
    return webSubscriptions.length === 1 ? webSubscriptions[0] : undefined;
};

export const getPurchaseOutcome = (context: MultiSubscriptionContext, planIDs: PlanIDs): PurchaseOutcome => {
    const { subscriptions, entitlementCatalog } = context;
    if (subscriptions.length === 0 || canRunAlongside(context, planIDs)) {
        return { type: 'new-subscription' };
    }

    const subscriptionsSharingAProduct = subscriptions.filter((subscription) =>
        sharesAProduct(entitlementCatalog, subscription, planIDs)
    );
    if (subscriptionsSharingAProduct.length > 1) {
        return refused;
    }

    const replacedSubscription = subscriptionsSharingAProduct[0] ?? getOnlyWebSubscription(subscriptions);
    if (!replacedSubscription || isManagedExternally(replacedSubscription)) {
        return refused;
    }

    const remainingSubscriptions = subscriptions.filter((subscription) => subscription !== replacedSubscription);
    const allowedNextToTheRemainingSubscriptions =
        remainingSubscriptions.length === 0 ||
        canRunAlongside({ ...context, subscriptions: remainingSubscriptions }, planIDs);
    if (!allowedNextToTheRemainingSubscriptions) {
        return refused;
    }

    return { type: 'replaces', subscription: replacedSubscription };
};
