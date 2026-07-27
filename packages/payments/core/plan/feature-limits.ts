import { getAddonConfigByName, getPlanInclusionLimit, isSyntheticFeatureLimitKey } from '../addon/addons';
import { type ADDON_NAMES, ADDON_PREFIXES, type PLANS, PLAN_TYPES } from '../constants';
import type { FeatureLimitKey, PlanIDs } from '../interface';
import { isAddonType } from './addons';
import { isMultiUserPersonalPlan } from './helpers';
import type { Plan, PlansMap } from './interface';

// Synthetic feature limits (MaxIPs/MaxAI/MaxLumo/MaxMeet) aren't returned by the API; an addon-plan
// fabricates them via its config's `featureLimit.grants`. lumo grants both MaxLumo and MaxAI.
const getAddonGrant = (plan: Plan, key: FeatureLimitKey): number => {
    const featureLimit = getAddonConfigByName(plan.Name as ADDON_NAMES)?.featureLimit;
    return featureLimit?.kind === 'synthetic' ? (featureLimit.grants[key] ?? 0) : 0;
};

export const getPlanMaxIPs = (plan: Plan) => getAddonGrant(plan, 'MaxIPs');

const getPlanMaxMembers = (plan: Plan) => {
    if (plan.Type === PLAN_TYPES.PLAN) {
        return plan.MaxMembers || 1;
    }

    return isAddonType(plan.Name, ADDON_PREFIXES.MEMBER) ? 1 : 0;
};

export const getPlanFeatureLimit = (plan: Plan, key: FeatureLimitKey): number => {
    // Capacity a base plan bundles in natively (declared per-addon via `includedByPlanOverride`), filling the
    // API gap. Resolved first so it can override an otherwise-floored value (e.g. FREE => 0 members).
    const included = getPlanInclusionLimit(plan.Name as PLANS, key);
    if (included !== null) {
        return included;
    }

    let result: number;

    if (isSyntheticFeatureLimitKey(key)) {
        // Synthetic keys (MaxIPs/MaxAI/MaxLumo/MaxMeet, …) are fabricated by addon configs, not
        // reported on the plan — resolve them generically from the registry's grants.
        result = getAddonGrant(plan, key);
    } else if (key === 'MaxMembers') {
        result = getPlanMaxMembers(plan);
    } else {
        // Native keys are reported directly on the plan.
        result = plan[key as keyof Plan] as number;
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
    const hasMembers =
        plan.Type === PLAN_TYPES.PLAN ||
        (plan.Type === PLAN_TYPES.ADDON && isAddonType(plan.Name, ADDON_PREFIXES.MEMBER));

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
