import { type ADDON_NAMES, PLANS, PLAN_TYPES } from '../constants';
import type { FeatureLimitKey, PlanIDs } from '../interface';
import { isIpAddon, isLumoAddon, isMemberAddon, isScribeAddon } from './addons';
import { isMultiUserPersonalPlan } from './helpers';
import type { Plan, PlansMap } from './interface';

export const getPlanMaxIPs = (plan: Plan) => {
    if (plan.Name === PLANS.VPN_BUSINESS) {
        return 1;
    }

    if (isIpAddon(plan.Name)) {
        return 1;
    }

    return 0;
};

export const getPlanMaxLumo = (plan: Plan) => {
    return isLumoAddon(plan.Name) ? 1 : 0;
};

const getPlanMaxAIs = (plan: Plan) => {
    return isScribeAddon(plan.Name) ? 1 : 0;
};

export const getPlanFeatureLimit = (plan: Plan, key: FeatureLimitKey): number => {
    let result: number;

    if (key === 'MaxIPs') {
        result = getPlanMaxIPs(plan);
    } else if (key === 'MaxAI') {
        result = getPlanMaxAIs(plan);
    } else if (key === 'MaxLumo') {
        result = getPlanMaxLumo(plan);
    } else {
        result = plan[key];
    }

    return result ?? 0;
};

type PlansQuantity = {
    plan: Plan;
    quantity: number;
}[];

export function getPlansQuantity(planIDs: PlanIDs, plansMap: PlansMap): PlansQuantity {
    return Object.entries(planIDs)
        .map(([planName, quantity]) => {
            const plan = plansMap[planName as PLANS | ADDON_NAMES];
            return plan === undefined ? undefined : { plan, quantity };
        })
        .filter((elem) => elem !== undefined);
}

export function getPlansLimit(plans: PlansQuantity, maxKey: FeatureLimitKey): number {
    return plans.reduce((acc, { plan, quantity }) => {
        return acc + quantity * getPlanFeatureLimit(plan, maxKey);
    }, 0);
}

export function getAddonMultiplier(addonMaxKey: FeatureLimitKey, addon: Plan): number {
    return Math.max(1, getPlanFeatureLimit(addon, addonMaxKey));
}

export function getPlanMembers(plan: Plan, quantity: number, view = true): number {
    const hasMembers = plan.Type === PLAN_TYPES.PLAN || (plan.Type === PLAN_TYPES.ADDON && isMemberAddon(plan.Name));

    let membersNumberInPlan = 0;
    if (isMultiUserPersonalPlan(plan) && view) {
        membersNumberInPlan = 1;
    } else if (hasMembers) {
        membersNumberInPlan = plan.MaxMembers || 1;
    }

    return membersNumberInPlan * quantity;
}

export function getMembersFromPlanIDs(planIDs: PlanIDs, plansMap: PlansMap, view = true): number {
    return (Object.entries(planIDs) as [PLANS | ADDON_NAMES, number][]).reduce((acc, [name, quantity]) => {
        const plan = plansMap[name];
        if (!plan) {
            return acc;
        }

        return acc + getPlanMembers(plan, quantity, view);
    }, 0);
}
