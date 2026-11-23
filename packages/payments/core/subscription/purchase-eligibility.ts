import { hasLumo } from '@proton/shared/lib/payments/subscription/helpers/plan-matching';

import type { ADDON_NAMES, PLANS } from '../constants';
import type { EntitlementCatalog } from '../entitlements/interface';
import { type ProductFlag, productFlags } from '../entitlements/product-flags';
import { createEntitlementResolverForSelection } from '../entitlements/resolver';
import type { PlanIDs } from '../interface';
import { getWebSubscriptions, isManagedExternally } from './helpers/external-management';
import type { Subscription } from './interface';
import { canModifySubscriptions, canRunAlongside, canSelectB2CLumoPlan, isB2CLumoPlan } from './lumo-purchase-rules';
import type { MultiSubscriptionContext } from './multi-subscription-context';

export function canModify(multiSubscriptionContext: MultiSubscriptionContext) {
    if (multiSubscriptionContext.lumoMultiSubscriptions) {
        return canModifySubscriptions(multiSubscriptionContext);
    }

    const { subscriptions } = multiSubscriptionContext;
    return (
        subscriptions.length === 0 ||
        subscriptions.some((subscription) => !isManagedExternally(subscription)) ||
        (subscriptions.length === 1 && hasLumo(subscriptions[0]))
    );
}

export function canStartPurchase(
    multiSubscriptionContext: MultiSubscriptionContext,
    requestedPlanName: PLANS | ADDON_NAMES | undefined
): boolean {
    return (
        canModify(multiSubscriptionContext) ||
        (canSelectB2CLumoPlan(multiSubscriptionContext) && isB2CLumoPlan(multiSubscriptionContext, requestedPlanName))
    );
}

type SubscriptionActions =
    | {
          canModify: true;
          cantModifyReason: undefined;
      }
    | {
          canModify: false;
          cantModifyReason: 'subscription_managed_externally';
      };

export function getAvailableSubscriptionActions(
    multiSubscriptionContext: MultiSubscriptionContext
): SubscriptionActions {
    if (canModify(multiSubscriptionContext)) {
        return { canModify: true, cantModifyReason: undefined };
    }

    return { canModify: false, cantModifyReason: 'subscription_managed_externally' };
}

export type PurchaseOutcome =
    | { type: 'new-subscription' }
    | { type: 'replaces'; subscription: Subscription }
    | { type: 'refused' };

const refused: PurchaseOutcome = { type: 'refused' };

export const getGrantedProductFlags = (
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
        (!context.lumoMultiSubscriptions && remainingSubscriptions.every(isManagedExternally)) ||
        canRunAlongside({ ...context, subscriptions: remainingSubscriptions }, planIDs);
    if (!allowedNextToTheRemainingSubscriptions) {
        return refused;
    }

    return { type: 'replaces', subscription: replacedSubscription };
};

export const getChangedSubscription = (
    context: MultiSubscriptionContext,
    planIDs: PlanIDs
): Subscription | undefined => {
    const outcome = getPurchaseOutcome(context, planIDs);
    return outcome.type === 'replaces' ? outcome.subscription : undefined;
};

export const getSubscriptionChangedByPlan = (
    context: MultiSubscriptionContext,
    planName: keyof PlanIDs
): Subscription | undefined => getChangedSubscription(context, { [planName]: 1 });
