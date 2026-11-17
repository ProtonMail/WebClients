import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import { type ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../constants';
import { EntitlementName } from '../entitlements/entitlement-names';
import type { EntitlementCatalog } from '../entitlements/interface';
import { createEntitlementResolverForSelection } from '../entitlements/resolver';
import type { PlanIDs } from '../interface';
import { hasAddonFromPlanIDs } from '../plan/addons';
import { isValidPlanName } from '../type-guards';
import { isManagedExternally } from './helpers/external-management';
import { getPlanIDs, toPlanIDs } from './helpers/plan-ids';
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

const hasMultiUserOrB2BSubscription = ({
    subscriptions,
    entitlementCatalog,
}: Pick<MultiSubscriptionContext, 'subscriptions' | 'entitlementCatalog'>): boolean => {
    return subscriptions.some((subscription) => isMultiUserOrB2BSelection(entitlementCatalog, subscription));
};

export const hasB2CLumoSubscription = (
    context: Pick<MultiSubscriptionContext, 'subscriptions' | 'entitlementCatalog'>
) => context.subscriptions.some((subscription) => isB2CLumoSubscription(context, subscription));

const hasLumoSeatsOutsideB2CLumoPlan = ({ subscriptions, entitlementCatalog }: MultiSubscriptionContext): boolean => {
    return subscriptions.some(
        (subscription) =>
            !isB2CLumoSubscription({ entitlementCatalog }, subscription) &&
            createEntitlementResolverForSelection(entitlementCatalog, subscription).hasEntitlement(
                EntitlementName.MaxLumoSeats
            )
    );
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

export const isSingleUserB2CPlan = (entitlementCatalog: EntitlementCatalog | undefined, planIDs: PlanIDs): boolean => {
    const planName = getPlanNameFromIDs(planIDs);
    if (!entitlementCatalog || !planName) {
        return false;
    }

    return !isMultiUserOrB2BSelection(entitlementCatalog, { [planName]: 1 });
};

/**
 * Temporary: this becomes irrelevant once `GET payments/v6/plans` ships, because its response carries `Eligible` per
 * plan and per price.
 */
export const canSelectB2CLumoPlan = (context: MultiSubscriptionContext): boolean => {
    return (
        context.lumoMultiSubscriptions &&
        !!context.entitlementCatalog &&
        !getStoreB2CLumoSubscription(context) &&
        !hasMultiUserOrB2BSubscription(context) &&
        !hasLumoSeatsOutsideB2CLumoPlan(context)
    );
};

export const shouldReplaceB2CLumoPlanWithAddon = (
    context: MultiSubscriptionContext,
    newPlanName: PLANS | ADDON_NAMES | undefined
): boolean => {
    return (
        isB2CLumoPlan(context, newPlanName) && !canSelectB2CLumoPlan(context) && !getStoreB2CLumoSubscription(context)
    );
};

export const canRunAlongside = (context: MultiSubscriptionContext, planIDs: PlanIDs): boolean => {
    if (!context.lumoMultiSubscriptions || hasAddonFromPlanIDs(ADDON_PREFIXES.LUMO, planIDs)) {
        return false;
    }

    if (isB2CLumoPlan(context, getPlanNameFromIDs(planIDs))) {
        return canSelectB2CLumoPlan(context) && !hasB2CLumoSubscription(context);
    }

    return (
        !isMultiUserOrB2BSelection(context.entitlementCatalog, planIDs) &&
        context.subscriptions.every((subscription) => isB2CLumoSubscription(context, subscription))
    );
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

const holdsLumoAddonOnSamePlan = (currentPlanIDs: PlanIDs, planIDs: PlanIDs): boolean => {
    return (
        hasAddonFromPlanIDs(ADDON_PREFIXES.LUMO, currentPlanIDs) &&
        getPlanNameFromIDs(currentPlanIDs) === getPlanNameFromIDs(planIDs)
    );
};

export const isLumoAddonExcluded = (
    {
        lumoMultiSubscriptions,
        entitlementCatalog,
    }: Pick<MultiSubscriptionContext, 'lumoMultiSubscriptions' | 'entitlementCatalog'>,
    planIDs: PlanIDs,
    currentPlanIDs: PlanIDs
): boolean => {
    return (
        lumoMultiSubscriptions &&
        isSingleUserB2CPlan(entitlementCatalog, planIDs) &&
        !holdsLumoAddonOnSamePlan(currentPlanIDs, planIDs)
    );
};

export const LUMO_TIER_PLANS = [PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA] as const;

export type LumoTierPlan = (typeof LUMO_TIER_PLANS)[number];

export const isLumoTierPlan = (planName: string): planName is LumoTierPlan =>
    LUMO_TIER_PLANS.some((tierPlan) => tierPlan === planName);

const LUMO_ADDON_TIER = PLANS.LUMO;

const getLumoTierRank = (subscription: Subscription): number => {
    const planIDs = getPlanIDs(subscription);
    const tierPlan = LUMO_TIER_PLANS.find((planName) => (planIDs[planName] ?? 0) > 0);
    if (tierPlan) {
        return LUMO_TIER_PLANS.indexOf(tierPlan);
    }

    return hasAddonFromPlanIDs(ADDON_PREFIXES.LUMO, planIDs) ? LUMO_TIER_PLANS.indexOf(LUMO_ADDON_TIER) : -1;
};

export const getLumoTierUpgrades = (
    context: Pick<MultiSubscriptionContext, 'subscriptions' | 'entitlementCatalog'>
): LumoTierPlan[] => {
    const { subscriptions, entitlementCatalog } = context;
    if (subscriptions.length > 0 && !entitlementCatalog) {
        return [];
    }

    if (hasMultiUserOrB2BSubscription(context)) {
        return [];
    }

    const highestRank = Math.max(-1, ...subscriptions.map(getLumoTierRank));
    return LUMO_TIER_PLANS.slice(highestRank + 1);
};
