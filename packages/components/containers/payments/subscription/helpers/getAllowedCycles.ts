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
    isTrial,
    notHigherThanAvailableOnBackend,
} from '@proton/payments';
import { isBF2025Offer } from '@proton/payments/core/checkout';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { CouponConfigRendered } from '../coupon-config/useCouponConfig';
import { isSamePlanCheckout } from './isSamePlanCheckout';

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

    if (planIDs[PLANS.VPN2024] && cycle === CYCLE.SIX) {
        return true;
    }

    if (!isRegularCycle(cycle)) {
        return false;
    }

    const plan = getPlanFromIDs(planIDs, plansMap);
    if (!plan) {
        return false;
    }

    return hasCycle(plan, cycle);
};

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
    disableUpcomingCycleCheck,
    allowDowncycling,
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
    disableUpcomingCycleCheck?: boolean;
    allowDowncycling?: boolean;
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

    const isTrialSubscription = isTrial(subscription);

    const isSamePlan = isSamePlanCheckout(subscription, planIDs);

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
        const isHigherThanCurrentSubscription: boolean = cycle >= (subscription?.Cycle ?? 0);
        // disableUpcomingCycleCheck is an escape hatch to allow the selection of the cycle which is **lower** than
        // upcoming one but higher than current one
        // Example: user has current subscription 1 month and upcoming 12 months. Now they want to buy Scribe addon.
        // Normally, we would not show them the current one, because we consider that downgrading of the cycle.
        // But in this case, we want them to buy same 1 month subscription but with Scribe addon.
        const isHigherThanUpcoming: boolean =
            cycle >= (subscription?.UpcomingSubscription?.Cycle ?? 0) || !!disableUpcomingCycleCheck;

        const allowedByCouponConfig =
            !couponConfig || !couponConfig.availableCycles || couponConfig.availableCycles.includes(cycle);

        const isEligibleForSelection: boolean =
            (isHigherThanCurrentSubscription && isHigherThanUpcoming) ||
            isTrialSubscription ||
            !isSamePlan ||
            !!allowDowncycling;

        return (
            cycle >= minimumCycle && cycle <= adjustedMaximumCycle && isEligibleForSelection && allowedByCouponConfig
        );
    });

    return result;
};
