import type { ADDON_PREFIXES } from '../constants';
import { ADDON_NAMES, PLANS, PLAN_TYPES } from '../constants';
import type { Currency, PlanIDs } from '../interface';
import { PlanState } from './constants';
import type { Plan, PlansMap, StrictPlan } from './interface';

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

export const hasPlanIDs = (planIDs: PlanIDs) => Object.values(planIDs).some((quantity) => quantity > 0);

export const hasFreePlanIDs = (planIDs: PlanIDs) => !hasPlanIDs(planIDs) || Boolean(planIDs[PLANS.FREE]);

export function getPlanFromIDs(planIDs: PlanIDs, plansMap: PlansMap): Plan | undefined {
    const planName = getPlanNameFromIDs(planIDs);
    return planName ? plansMap[planName] : undefined;
}

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

export function getAddonNameByPlan(addonPrefix: ADDON_PREFIXES, planName: PLANS) {
    return Object.values(ADDON_NAMES)
        .filter((addonName) => addonName.startsWith(addonPrefix))
        .find((addonName) => addonName.includes(planName));
}

const b2bPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.MAIL_PRO,
    PLANS.MAIL_BUSINESS,
    PLANS.DRIVE_PRO,
    PLANS.DRIVE_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
    PLANS.BUNDLE_BIZ_2025,
    PLANS.VPN_PRO,
    PLANS.VPN_BUSINESS,
    PLANS.PASS_PRO,
    PLANS.PASS_BUSINESS,
    PLANS.LUMO_BUSINESS,
    PLANS.VPN_PASS_BUNDLE_BUSINESS,
    PLANS.MEET_BUSINESS,
]);
export const getIsB2BAudienceFromPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }

    return b2bPlans.has(planName);
};

export const getIsB2BAudienceFromPlanIDs = (planIDs: PlanIDs) => getIsB2BAudienceFromPlan(getPlanNameFromIDs(planIDs));

const vpnB2BPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.VPN_PRO,
    PLANS.VPN_BUSINESS,
    PLANS.VPN_PASS_BUNDLE_BUSINESS,
]);
export const getIsVpnB2BPlan = (planName: PLANS | ADDON_NAMES) => vpnB2BPlans.has(planName);

const vpnPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.VPN,
    PLANS.VPN2024,
    PLANS.VPN_PASS_BUNDLE,
    PLANS.VPN_PRO,
    PLANS.VPN_BUSINESS,
    PLANS.VPN_PASS_BUNDLE_BUSINESS,
]);
export const getIsVpnPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return vpnPlans.has(planName);
};

const consumerVpnPlans: Set<PLANS | ADDON_NAMES> = new Set([PLANS.VPN, PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE]);
/**
 * @public - do not remove in the dead code cleanups
 */
export const getIsConsumerVpnPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return consumerVpnPlans.has(planName);
};

const passPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.PASS,
    PLANS.PASS_FAMILY,
    PLANS.VPN_PASS_BUNDLE,
    PLANS.PASS_PRO,
    PLANS.PASS_BUSINESS,
]);

/**
 * @public - do not remove in the dead code cleanups
 */
export const getIsPassPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return passPlans.has(planName);
};

const passB2bPlans: Set<PLANS | ADDON_NAMES> = new Set([PLANS.PASS_PRO, PLANS.PASS_BUSINESS]);
export const getIsPassB2BPlan = (planName?: PLANS | ADDON_NAMES) => {
    if (!planName) {
        return false;
    }
    return passB2bPlans.has(planName);
};

const consumerPassPlans: Set<PLANS | ADDON_NAMES> = new Set([PLANS.PASS, PLANS.PASS_FAMILY, PLANS.VPN_PASS_BUNDLE]);
export const getIsConsumerPassPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return consumerPassPlans.has(planName);
};

const sentinelPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.VISIONARY,
    PLANS.BUNDLE,
    PLANS.FAMILY,
    PLANS.DUO,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
    PLANS.BUNDLE_BIZ_2025,
    PLANS.PASS,
    PLANS.PASS_FAMILY,
    PLANS.VPN_PASS_BUNDLE,
    PLANS.PASS_BUSINESS,
    PLANS.MAIL_BUSINESS,
]);
export const getIsSentinelPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return sentinelPlans.has(planName);
};

export const planSupportsSSO = (planName: PLANS | undefined, isSsoForPbsEnabled: boolean) => {
    if (!planName) {
        return;
    }
    const plans = [PLANS.VPN_BUSINESS, PLANS.PASS_BUSINESS, PLANS.VPN_PASS_BUNDLE_BUSINESS];
    if (isSsoForPbsEnabled) {
        plans.push(PLANS.BUNDLE_BIZ_2025, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_PRO);
    }
    return plans.some((ssoPlanName) => ssoPlanName === planName);
};

export const upsellPlanSSO = (planName?: PLANS) => {
    return planName && [PLANS.VPN_PRO, PLANS.PASS_PRO].some((ssoPlanName) => ssoPlanName === planName);
};

export const getHasProPlan = (planName?: PLANS) => {
    return (
        planName &&
        [PLANS.VPN_PRO, PLANS.PASS_PRO, PLANS.MAIL_PRO, PLANS.DRIVE_PRO].some((ssoPlanName) => ssoPlanName === planName)
    );
};

export const getHasBusinessProductPlan = (planName?: PLANS) => {
    return (
        planName &&
        [
            PLANS.MAIL_BUSINESS,
            PLANS.PASS_BUSINESS,
            PLANS.VPN_BUSINESS,
            PLANS.LUMO_BUSINESS,
            PLANS.VPN_PASS_BUNDLE_BUSINESS,
            PLANS.MEET_BUSINESS,
        ].some((otherPlanName) => otherPlanName === planName)
    );
};

export const getHasSomeDrivePlusPlan = (planName?: PLANS | ADDON_NAMES) => {
    return planName && [PLANS.DRIVE, PLANS.DRIVE_1TB].some((otherPlanName) => otherPlanName === planName);
};

export const getHasPlusPlan = (planName?: PLANS | ADDON_NAMES) => {
    return (
        planName &&
        [
            PLANS.MAIL,
            PLANS.VPN,
            PLANS.VPN2024,
            PLANS.PASS,
            PLANS.DRIVE,
            PLANS.DRIVE_1TB,
            PLANS.VPN_PASS_BUNDLE,
            PLANS.PASS_LIFETIME,
            PLANS.LUMO,
            PLANS.MEET,
        ].some((otherPlanName) => otherPlanName === planName)
    );
};

const lifetimePlans: Set<PLANS | ADDON_NAMES> = new Set([PLANS.PASS_LIFETIME]);
export const isLifetimePlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }

    return lifetimePlans.has(planName);
};

export function isLifetimePlanSelected(planIDs: PlanIDs): boolean {
    const planName = getPlanNameFromIDs(planIDs);
    return isLifetimePlan(planName);
}

export function isPlan(plan: any): plan is Plan {
    if (!plan) {
        return false;
    }

    const planName = plan.Name;
    if (!planName) {
        return false;
    }

    return Object.values(PLANS).includes(planName);
}

export function isMultiUserPersonalPlan(plan: Plan | PlanIDs | PLANS | ADDON_NAMES) {
    const planName = (() => {
        if (isPlan(plan)) {
            return plan.Name;
        }

        if (typeof plan === 'string') {
            return plan;
        }

        return getPlanNameFromIDs(plan);
    })();

    if (!planName) {
        return false;
    }

    const plans: (PLANS | ADDON_NAMES)[] = [PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.PASS_FAMILY];
    return plans.includes(planName);
}
