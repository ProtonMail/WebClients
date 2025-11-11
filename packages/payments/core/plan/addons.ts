import { ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../constants';
import type { FreeSubscription, PlanIDs } from '../interface';
import type { Subscription } from '../subscription/interface';
import { isFreeSubscription } from '../type-guards';
import { getPlanNameFromIDs } from './helpers';
import type { Addon } from './interface';

type AddonOrName = Addon | ADDON_NAMES | PLANS;

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

export const isScribeAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, ADDON_PREFIXES.SCRIBE);
};

export function hasScribeAddon(subscriptionOrPlanIds: Subscription | FreeSubscription | undefined): boolean {
    const subscription = subscriptionOrPlanIds;

    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    const plans = subscription.Plans;
    return plans.some((plan) => isScribeAddon(plan.Name));
}

export type AddonGuard = (addonOrName: AddonOrName) => boolean;

const ORG_SIZE_ADDONS = [
    ADDON_NAMES.MEMBER_VPN_BUSINESS,
    ADDON_NAMES.MEMBER_VPN_PRO,
    ADDON_NAMES.MEMBER_PASS_BUSINESS,
    ADDON_NAMES.MEMBER_PASS_PRO,
];

const DRIVE_ORG_SIZE_ADDONS = [ADDON_NAMES.MEMBER_DRIVE_PRO, ADDON_NAMES.MEMBER_DRIVE_BUSINESS];
const PASS_ORG_SIZE_ADDONS = [
    ADDON_NAMES.MEMBER_PASS_BUSINESS,
    ADDON_NAMES.MEMBER_PASS_PRO,
    ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS,
];

export const isDriveOrgSizeAddon: AddonGuard = (addonOrName): boolean => {
    return DRIVE_ORG_SIZE_ADDONS.some((name) => addonOrName === name);
};

export const isPassOrgSizeAddon: AddonGuard = (addonOrName): boolean => {
    return PASS_ORG_SIZE_ADDONS.some((name) => addonOrName === name);
};

export const isOrgSizeAddon: AddonGuard = (addonOrName): boolean => {
    return ORG_SIZE_ADDONS.some((name) => addonOrName === name);
};

export const isMemberAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, ADDON_PREFIXES.MEMBER);
};

export const isDomainAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, ADDON_PREFIXES.DOMAIN);
};

export const isIpAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, ADDON_PREFIXES.IP);
};

export const isLumoAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, ADDON_PREFIXES.LUMO);
};

export const AddonGuardsMap: Record<ADDON_PREFIXES, AddonGuard> = {
    [ADDON_PREFIXES.DOMAIN]: isDomainAddon,
    [ADDON_PREFIXES.IP]: isIpAddon,
    [ADDON_PREFIXES.MEMBER]: isMemberAddon,
    [ADDON_PREFIXES.SCRIBE]: isScribeAddon,
    [ADDON_PREFIXES.LUMO]: isLumoAddon,
};

export const hasLumoAddonFromPlanIDs = (planIDs: PlanIDs) => {
    return Object.keys(planIDs).some((key) => isLumoAddon(key as any));
};

export type SupportedAddons = Partial<Record<ADDON_NAMES, boolean>>;

export const getSupportedAddons = (planIDs: PlanIDs): SupportedAddons => {
    const planName = getPlanNameFromIDs(planIDs);
    if (!planName) {
        return {};
    }

    const supported: SupportedAddons = {};
    for (const addon of Object.values(ADDON_NAMES)) {
        if (addon.includes(planName)) {
            supported[addon] = true;
        }
    }

    return supported;
};

export const getPlansWithAddons = (): PLANS[] => {
    return Object.values(PLANS).filter((plan) => Object.keys(getSupportedAddons({ [plan]: 1 })).length > 0);
};

export const supportsMemberAddon = (planIDs: PlanIDs): boolean => {
    return (Object.keys(getSupportedAddons(planIDs)) as ADDON_NAMES[]).some(isMemberAddon);
};
