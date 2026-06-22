import {
    type ADDON_NAMES,
    CYCLE,
    type Currency,
    type FreeSubscription,
    PLANS,
    type PlanIDs,
    type PlansMap,
    type Subscription,
    getPlanFromIDs,
    hasCycle,
    isRegularCycle,
    notHigherThanAvailableOnBackend,
} from '@proton/payments';
import { isBF2025Offer } from '@proton/payments/core/checkout';
import type { CouponConfigRendered } from '@proton/payments/ui/coupon-config/useCouponConfig';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import { isSamePlanCheckout } from './isSamePlanCheckout';

type AllowedCyclePerPlan = {
    planName: PLANS;
    cycle: CYCLE;
};

const defaultPlansWithIrregularCycles: AllowedCyclePerPlan[] = [
    // Plans for the Cape promotion. vpn2024 and bundle2022 must support 6 months cycle.
    {
        planName: PLANS.VPN2024,
        cycle: CYCLE.SIX,
    },
    {
        planName: PLANS.BUNDLE,
        cycle: CYCLE.SIX,
    },
];

export function planSupportsIrregularCycle(
    { cycle, planIDs }: { cycle: CYCLE; planIDs: PlanIDs },
    plansWithIrregularCycles: AllowedCyclePerPlan[] = defaultPlansWithIrregularCycles
): boolean {
    for (const plan of plansWithIrregularCycles) {
        if (planIDs[plan.planName] && plan.cycle === cycle) {
            return true;
        }
    }

    return false;
}

export const isSupportedCycle = ({
    cycle,
    planIDs,
    plansMap,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
}): boolean => {
    if (isBF2025Offer({ planIDs, cycle, coupon: undefined })) {
        return true;
    }

    if (!isRegularCycle(cycle) && !planSupportsIrregularCycle({ cycle, planIDs })) {
        return false;
    }

    const plan = getPlanFromIDs(planIDs, plansMap);
    if (!plan) {
        return false;
    }

    return hasCycle(plan, cycle);
};

type CycleCapper = (
    subscription: Subscription | FreeSubscription | undefined,
    app: ProductParam | undefined,
    planIDs: PlanIDs
) => CYCLE;

export type PlanCapRule = {
    plan: PLANS | ADDON_NAMES;
    cycle: CYCLE | CycleCapper;
    currencyPredicate?: Currency | ((currency: Currency) => boolean);
};

const defaultRules: PlanCapRule[] = [
    { plan: PLANS.LUMO, cycle: CYCLE.YEARLY },
    { plan: PLANS.PASS_FAMILY, cycle: CYCLE.YEARLY },

    { plan: PLANS.PASS_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.PASS_BUSINESS, cycle: CYCLE.YEARLY },
    { plan: PLANS.MAIL_BUSINESS, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_PRO_2024, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_BIZ_2025, cycle: CYCLE.YEARLY },
];

function capMaximumCycle({
    maximumCycle,
    planIDs,
    currency,
    plansMap,
    subscription,
    cycleParam,
    rules = defaultRules,
    app,
}: {
    maximumCycle: CYCLE;
    planIDs: PlanIDs;
    currency: Currency;
    plansMap: PlansMap;
    subscription: Subscription | FreeSubscription | undefined;
    cycleParam?: CYCLE;
    rules?: PlanCapRule[];
    app?: ProductParam;
}): CYCLE {
    const currencyMatches = (rule: PlanCapRule) => {
        if (!rule.currencyPredicate) {
            return true;
        }

        if (typeof rule.currencyPredicate === 'function') {
            return rule.currencyPredicate(currency);
        }

        return rule.currencyPredicate === currency;
    };

    const getCycle = (rule: PlanCapRule) => {
        if (typeof rule.cycle === 'function') {
            return rule.cycle(subscription, app, planIDs);
        }

        return rule.cycle;
    };

    let result: CYCLE = maximumCycle;
    rules
        // filter a capped plan from the list of capped plans if it is present in planIDs
        .filter((rule) => planIDs[rule.plan])
        .forEach((rule) => {
            // there can be multiple rules for the same plan. We need to take the one that matches the currency.
            if (currencyMatches(rule)) {
                result = Math.min(maximumCycle, getCycle(rule));
            }
        });

    // if user already has a subscription or upcoming subscription with higher cycle, then we let user see it
    const isSamePlan = isSamePlanCheckout(subscription, planIDs);
    const subscriptionCycle = isSamePlan
        ? Math.max(subscription?.Cycle ?? 0, subscription?.UpcomingSubscription?.Cycle ?? 0)
        : 0;

    result = Math.max(
        result,
        subscriptionCycle,
        cycleParam &&
            isSupportedCycle({
                cycle: cycleParam,
                planIDs,
                plansMap,
            })
            ? cycleParam
            : 0
    );

    // however no matter what happens, we can't show a higher cycle than actually exist on the backend
    return notHigherThanAvailableOnBackend(planIDs, plansMap, result);
}

export const getAllowedCycles = ({
    subscription,
    minimumCycle = CYCLE.MONTHLY,
    maximumCycle = CYCLE.TWO_YEARS,
    planIDs,
    currency,
    defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY],
    plansMap,
    rules,
    cycleParam,
    app,
    couponConfig,
}: {
    subscription: Subscription | FreeSubscription | undefined;
    minimumCycle?: CYCLE;
    maximumCycle?: CYCLE;
    planIDs: PlanIDs;
    currency: Currency;
    defaultCycles?: CYCLE[];
    plansMap: PlansMap;
    rules?: PlanCapRule[];
    cycleParam?: CYCLE;
    app?: ProductParam;
    couponConfig?: CouponConfigRendered;
}): CYCLE[] => {
    const plan = getPlanFromIDs(planIDs, plansMap);
    if (!plan) {
        return [];
    }

    const sortedCycles = defaultCycles.sort((a, b) => b - a);
    const availableCycles = sortedCycles.filter((cycle) => {
        return hasCycle(plan, cycle);
    });

    const adjustedMaximumCycle = capMaximumCycle({
        maximumCycle,
        planIDs,
        currency,
        plansMap,
        subscription,
        rules,
        cycleParam,
        app,
    });

    const result = availableCycles.filter((cycle) => {
        const allowedByCouponConfig =
            !couponConfig || !couponConfig.availableCycles || couponConfig.availableCycles.includes(cycle);

        return cycle >= minimumCycle && cycle <= adjustedMaximumCycle && allowedByCouponConfig;
    });

    return result;
};
