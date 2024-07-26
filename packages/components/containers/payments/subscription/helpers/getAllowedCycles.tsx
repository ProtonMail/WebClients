import type { FreeSubscription, PLANS } from '@proton/shared/lib/constants';
import { ADDON_NAMES, CYCLE } from '@proton/shared/lib/constants';
import { getPlanFromIds } from '@proton/shared/lib/helpers/planIDs';
import { getPlan, isTrial } from '@proton/shared/lib/helpers/subscription';
import type { PlanIDs, PlansMap, Subscription } from '@proton/shared/lib/interfaces';

import { notHigherThanAvailableOnBackend } from './payment';

// todo: that's not a long-term solution, because we already have cycles like 3, 15, 18, 30
// which might appear for certain promotions.
function capMaximumCycle(
    maximumCycle: CYCLE,
    planIDs: PlanIDs,
    plansMap: PlansMap,
    subscription: Subscription | FreeSubscription | undefined
): CYCLE {
    const cappedPlans: {
        plan: PLANS | ADDON_NAMES;
        cycle: CYCLE;
    }[] = [
        { plan: ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_DRIVEPLUS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_PASS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN2024, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN_PASS_BUNDLE, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_MAIL_BUSINESS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_PASS_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN_BIZ, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_PASS_BIZ, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_FAMILY, cycle: CYCLE.YEARLY },
    ];

    // filter a capped plan from the list of capped plans if it is present in planIDs
    const plan = cappedPlans.find((cappedPlan) => planIDs[cappedPlan.plan]);

    let result: CYCLE = maximumCycle;
    if (plan) {
        result = Math.min(maximumCycle, plan.cycle);
    }

    // if user already has a subscription or upcoming subscription with higher cycle, then we let user see it
    result = Math.max(result, subscription?.Cycle ?? 0, subscription?.UpcomingSubscription?.Cycle ?? 0);

    // however no matter what happens, we can't show a higher cycle than actually exist on the backend
    return notHigherThanAvailableOnBackend(planIDs, plansMap, result);
}

export const getAllowedCycles = ({
    subscription,
    minimumCycle,
    maximumCycle,
    planIDs,
    defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY],
    disableUpcomingCycleCheck,
    plansMap,
}: {
    subscription: Subscription | FreeSubscription | undefined;
    minimumCycle: CYCLE;
    maximumCycle: CYCLE;
    planIDs: PlanIDs;
    defaultCycles?: CYCLE[];
    disableUpcomingCycleCheck?: boolean;
    plansMap: PlansMap;
}): CYCLE[] => {
    const isTrialSubscription = isTrial(subscription);
    const sortedCycles = defaultCycles.sort((a, b) => b - a);
    const currentPlanName: PLANS | undefined = getPlan(subscription)?.Name;
    const newPlanName: PLANS | undefined = getPlanFromIds(planIDs);
    const isSamePlan = currentPlanName === newPlanName;

    const adjustedMaximumCycle = capMaximumCycle(maximumCycle, planIDs, plansMap, subscription);

    const result = sortedCycles.filter((cycle) => {
        const isHigherThanCurrentSubscription: boolean = cycle >= (subscription?.Cycle ?? 0);

        // disableUpcomingCycleCheck is an escape hatch to allow the selection of the cycle which is **lower** than upcoming one
        // but higher than current one
        // Example: user has current subscription 1 month and upcoming 12 months. Now they want to buy Scribe addon.
        // Normally, we would not show them the current one, because we consider that downgrading of the cycle.
        // But in this case, we want them to buy same 1 month subscription but with Scribe addon.
        const isHigherThanUpcoming: boolean =
            cycle >= (subscription?.UpcomingSubscription?.Cycle ?? 0) || !!disableUpcomingCycleCheck;

        const isEligibleForSelection: boolean =
            (isHigherThanCurrentSubscription && isHigherThanUpcoming) || isTrialSubscription || !isSamePlan;

        return cycle >= minimumCycle && cycle <= adjustedMaximumCycle && isEligibleForSelection;
    });

    return result;
};
