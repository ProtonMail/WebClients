import { getPlanNameFromIDs, isPlan } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import type { ADDON_NAMES, PLANS } from '../constants';
import type { EntitlementCatalog } from '../entitlements/interface';
import { createEntitlementResolverForSelection } from '../entitlements/resolver';
import type { PlanIDs } from '../interface';
import { isValidPlanName } from '../type-guards';
import { isManagedExternally } from './helpers/external-management';
import { getPlanIDs } from './helpers/plan-ids';
import type { Subscription } from './interface';
import type { MultiSubscriptionContext } from './multi-subscription-context';

type CatalogContext = Pick<MultiSubscriptionContext, 'entitlementCatalog'>;

const isB2CLumoSubscription = ({ entitlementCatalog }: CatalogContext, subscription: Subscription): boolean =>
    createEntitlementResolverForSelection(entitlementCatalog, subscription).isLumoOnlyB2C;

export const isB2CLumoPlan = (
    { entitlementCatalog }: CatalogContext,
    planName: PLANS | ADDON_NAMES | undefined
): boolean =>
    planName !== undefined &&
    isValidPlanName(planName) &&
    createEntitlementResolverForSelection(entitlementCatalog, planName).isLumoOnlyB2C;

const isMultiUserOrB2BSelection = (
    entitlementCatalog: EntitlementCatalog | undefined,
    selection: Subscription | PlanIDs
): boolean => {
    return createEntitlementResolverForSelection(entitlementCatalog, selection).isMultiUserOrB2B;
};

const getStoreB2CLumoSubscription = ({
    subscriptions,
    entitlementCatalog,
}: Pick<MultiSubscriptionContext, 'subscriptions' | 'entitlementCatalog'>): Subscription | undefined => {
    return subscriptions.find(
        (subscription) =>
            isManagedExternally(subscription) && isB2CLumoSubscription({ entitlementCatalog }, subscription)
    );
};

const areAllManagedExternally = (subscriptions: Subscription[]): boolean => {
    return subscriptions.length > 0 && subscriptions.every((subscription) => isManagedExternally(subscription));
};

export const canModifySubscriptions = ({
    subscriptions,
    entitlementCatalog,
}: Pick<MultiSubscriptionContext, 'subscriptions' | 'entitlementCatalog'>): boolean => {
    if (!areAllManagedExternally(subscriptions)) {
        return true;
    }

    const [onlySubscription, ...otherSubscriptions] = subscriptions;
    return otherSubscriptions.length === 0 && isB2CLumoSubscription({ entitlementCatalog }, onlySubscription);
};

const toPlanIDs = (selectedPlan: PLANS | ADDON_NAMES | PlanIDs | Plan): PlanIDs => {
    if (isPlan(selectedPlan)) {
        return { [selectedPlan.Name]: 1 };
    }

    if (typeof selectedPlan === 'string') {
        return { [selectedPlan]: 1 };
    }

    return selectedPlan;
};

export const isForbiddenForStoreLumoSubscriber = (
    context: MultiSubscriptionContext,
    selectedPlan: PLANS | ADDON_NAMES | PlanIDs | Plan
): boolean => {
    const storeLumoSubscription = getStoreB2CLumoSubscription(context);
    if (!storeLumoSubscription) {
        return false;
    }

    const selectedPlanIDs = toPlanIDs(selectedPlan);

    const selectedPlanName = getPlanNameFromIDs(selectedPlanIDs);
    if (selectedPlanName !== undefined && isB2CLumoPlan(context, selectedPlanName)) {
        return !getPlanIDs(storeLumoSubscription)[selectedPlanName];
    }

    return isMultiUserOrB2BSelection(context.entitlementCatalog, selectedPlanIDs);
};
