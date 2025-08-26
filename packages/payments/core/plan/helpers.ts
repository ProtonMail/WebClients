import { type ADDON_NAMES, PLANS, PLAN_TYPES } from '../constants';
import { type Currency, type PlanIDs } from '../interface';
import { isLifetimePlan } from '../subscription/helpers';
import { PlanState } from './constants';
import { type Plan, type PlansMap, type StrictPlan } from './interface';

export function isPlanEnabled(plan: Plan): boolean {
    return plan.State === PlanState.Available;
}

/**
 * Get the plan name from the planIDs object. Useful when you have object like { [PLANS.MAIL]: 1 }.
 *
 * Examples:
 * - { [PLANS.MAIL]: 1 } -> PLANS.MAIL
 * - { [PLANS.MAIL]: 1, [PLANS.BUNDLE]: 1 } -> PLANS.MAIL
 * - { [PLANS.MAIL]: 0, [PLANS.BUNDLE]: 1 } -> PLANS.BUNDLE
 *
 * @param planIDs - The planIDs object.
 * @returns The plan name.
 */
export function getPlanNameFromIDs(planIDs: PlanIDs): PLANS | undefined {
    return Object.values(PLANS).find((key) => {
        // If the planIDs object has non-zero value for the plan, then it exists.
        // There can be at most 1 plan, and others are addons.
        const planNumber = planIDs[key as PLANS] ?? 0;
        return planNumber > 0;
    });
}

export function isLifetimePlanSelected(planIDs: PlanIDs): boolean {
    const planName = getPlanNameFromIDs(planIDs);
    return isLifetimePlan(planName);
}

const b2bPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.MAIL_PRO,
    PLANS.MAIL_BUSINESS,
    PLANS.DRIVE_PRO,
    PLANS.DRIVE_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
    PLANS.VPN_PRO,
    PLANS.VPN_BUSINESS,
    PLANS.PASS_PRO,
    PLANS.PASS_BUSINESS,
]);
export const getIsB2BAudienceFromPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }

    return b2bPlans.has(planName);
};

export const getPlanFromPlanIDs = (plansMap: PlansMap, planIDs: PlanIDs = {}): StrictPlan | undefined => {
    const planID = Object.keys(planIDs).find((planID): planID is keyof PlansMap => {
        const type = plansMap[planID as keyof PlansMap]?.Type;
        return type === PLAN_TYPES.PLAN || type === PLAN_TYPES.PRODUCT;
    });
    if (planID) {
        return plansMap[planID] as StrictPlan;
    }
};

export const getPlanCurrencyFromPlanIDs = (plansMap: PlansMap, planIDs: PlanIDs = {}): Currency | undefined => {
    const plan = getPlanFromPlanIDs(plansMap, planIDs);
    return plan?.Currency;
};
