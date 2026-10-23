import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { Addon } from '@proton/shared/lib/payments/plan/interface';

import { ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import { getPlanIDs } from '../subscription/helpers/plan-ids';
import type { Subscription } from '../subscription/interface';

type AddonOrName = Addon | ADDON_NAMES | PLANS;

export type AddonGuard = (addonOrName: AddonOrName) => boolean;

export function isAddonType(addonOrName: AddonOrName, addonPrefix: ADDON_PREFIXES): boolean {
    let addonName: ADDON_NAMES | PLANS;
    if (typeof addonOrName === 'string') {
        addonName = addonOrName;
    } else {
        addonName = addonOrName.Name;
    }

    return addonName.startsWith(addonPrefix);
}

export function getAddonType(addonOrName: AddonOrName): ADDON_PREFIXES | null {
    return Object.values(ADDON_PREFIXES).find((prefix) => isAddonType(addonOrName, prefix)) ?? null;
}

export const hasAddonFromPlanIDs = (addon: ADDON_PREFIXES, planIDs: PlanIDs) => {
    return Object.keys(planIDs).some((key) => isAddonType(key as any, addon));
};

export type SupportedAddons = Partial<Record<ADDON_NAMES, boolean>>;

export const getSupportedAddons = (planIDs: PlanIDs): SupportedAddons => {
    const planName = getPlanNameFromIDs(planIDs);
    if (!planName) {
        return {};
    }

    const supported: SupportedAddons = {};
    for (const addon of Object.values(ADDON_NAMES)) {
        // Addons are in the format `${ADDON_PREFIXES}-${PLAN_NAME}`
        // Not splitting could result in incorrect matching such as `vpnpass2023` matching `pass2023`
        const addonPlan = addon.split('-')[1];
        if (addonPlan === planName) {
            supported[addon] = true;
        }
    }

    return supported;
};

export const getPlansWithAddons = (): PLANS[] => {
    return Object.values(PLANS).filter((plan) => Object.keys(getSupportedAddons({ [plan]: 1 })).length > 0);
};

export const supportsAddonType = (planIDs: PlanIDs, addonPrefix: ADDON_PREFIXES): boolean => {
    return (Object.keys(getSupportedAddons(planIDs)) as ADDON_NAMES[]).some((name) => isAddonType(name, addonPrefix));
};

export const supportsMemberAddon = (planIDs: PlanIDs): boolean => supportsAddonType(planIDs, ADDON_PREFIXES.MEMBER);

export const getSubscriptionSupportingAddon = (
    subscriptions: Subscription[],
    addonPrefix: ADDON_PREFIXES
): Subscription | undefined =>
    subscriptions.find((subscription) => supportsAddonType(getPlanIDs(subscription), addonPrefix));
