import {
    type ADDON_NAMES,
    CYCLE,
    type Currency,
    type FreeSubscription,
    PLANS,
    type PlanIDs,
    hasCycle,
} from '@proton/payments';
import { getPlanFromIDs } from '@proton/shared/lib/helpers/planIDs';
import { isRegularCycle, isTrial } from '@proton/shared/lib/helpers/subscription';
import type { PlansMap, Subscription } from '@proton/shared/lib/interfaces';

import { isSamePlanCheckout } from './isSamePlanCheckout';
import { notHigherThanAvailableOnBackend } from './payment';

export type PlanCapRule = {
    plan: PLANS | ADDON_NAMES;
    cycle: CYCLE;
    currencyPredicate?: Currency | ((currency: Currency) => boolean);
};

const defaultRules: PlanCapRule[] = [
    { plan: PLANS.MAIL, cycle: CYCLE.YEARLY },
    { plan: PLANS.VPN, cycle: CYCLE.YEARLY },
    { plan: PLANS.VPN2024, cycle: CYCLE.YEARLY },
    { plan: PLANS.DRIVE, cycle: CYCLE.YEARLY },
    { plan: PLANS.WALLET, cycle: CYCLE.YEARLY },
    { plan: PLANS.LUMO, cycle: CYCLE.YEARLY },
    { plan: PLANS.PASS, cycle: CYCLE.YEARLY },
    { plan: PLANS.PASS_FAMILY, cycle: CYCLE.YEARLY },

    { plan: PLANS.BUNDLE, cycle: CYCLE.YEARLY },
    { plan: PLANS.DUO, cycle: CYCLE.YEARLY },
    { plan: PLANS.FAMILY, cycle: CYCLE.YEARLY },
    { plan: PLANS.VISIONARY, cycle: CYCLE.YEARLY },

    { plan: PLANS.PASS_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.PASS_BUSINESS, cycle: CYCLE.YEARLY },
    // { plan: PLANS.MAIL_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.MAIL_BUSINESS, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_PRO_2024, cycle: CYCLE.YEARLY },
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
}: {
    maximumCycle: CYCLE;
    planIDs: PlanIDs;
    currency: Currency;
    plansMap: PlansMap;
    subscription: Subscription | FreeSubscription | undefined;
    cycleParam?: CYCLE;
    rules?: PlanCapRule[];
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

    // filter a capped plan from the list of capped plans if it is present in planIDs
    const planCapRule = rules.find((cappedPlan) => planIDs[cappedPlan.plan]);

    let result: CYCLE = maximumCycle;
    if (planCapRule && currencyMatches(planCapRule)) {
        result = Math.min(maximumCycle, planCapRule.cycle);
    }

    // if user already has a subscription or upcoming subscription with higher cycle, then we let user see it
    result = Math.max(
        result,
        subscription?.Cycle ?? 0,
        subscription?.UpcomingSubscription?.Cycle ?? 0,
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

        const isEligibleForSelection: boolean =
            (isHigherThanCurrentSubscription && isHigherThanUpcoming) ||
            isTrialSubscription ||
            !isSamePlan ||
            !!allowDowncycling;

        return cycle >= minimumCycle && cycle <= adjustedMaximumCycle && isEligibleForSelection;
    });

    return result;
};
