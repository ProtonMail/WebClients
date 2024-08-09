import {
    ADDON_NAMES,
    DOMAIN_ADDON_PREFIX,
    type FreeSubscription,
    IP_ADDON_PREFIX,
    MEMBER_ADDON_PREFIX,
    PLANS,
    SCRIBE_ADDON_PREFIX,
    isFreeSubscription,
} from '../constants';
import type { Addon, PlanIDs, SubscriptionModel } from '../interfaces';

type AddonOrName = Addon | ADDON_NAMES | PLANS;

function isAddonType(addonOrName: AddonOrName, addonPrefix: string): boolean {
    let addonName: ADDON_NAMES | PLANS;
    if (typeof addonOrName === 'string') {
        addonName = addonOrName;
    } else {
        addonName = addonOrName.Name;
    }

    return addonName.startsWith(addonPrefix);
}

export const isScribeAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, SCRIBE_ADDON_PREFIX);
};

export function hasScribeAddon(subscriptionOrPlanIds: SubscriptionModel | FreeSubscription | undefined): boolean {
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

export const isDriveOrgSizeAddon: AddonGuard = (addonOrName): boolean => {
    return DRIVE_ORG_SIZE_ADDONS.some((name) => addonOrName === name);
};

export const isOrgSizeAddon: AddonGuard = (addonOrName): boolean => {
    return ORG_SIZE_ADDONS.some((name) => addonOrName === name);
};

export const isMemberAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, MEMBER_ADDON_PREFIX);
};

export const isDomainAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, DOMAIN_ADDON_PREFIX);
};

export const isIpAddon: AddonGuard = (addonOrName): boolean => {
    return isAddonType(addonOrName, IP_ADDON_PREFIX);
};

export const removeAddon = (originalPlanIDs: PlanIDs, addonGuard: AddonGuard): PlanIDs => {
    const planIDs: PlanIDs = { ...originalPlanIDs };

    // if guard returns true, it means that the addon should be removed
    for (const addonName of Object.keys(planIDs) as (ADDON_NAMES | PLANS)[]) {
        if (addonGuard(addonName)) {
            delete planIDs[addonName];
        }
    }

    return planIDs;
};

export const countAddonsByType = (planIDs: PlanIDs, addonGuard: AddonGuard): number => {
    return Object.keys(planIDs).reduce((acc, key) => {
        const addonName = key as ADDON_NAMES | PLANS;

        if (addonGuard(addonName)) {
            return acc + (planIDs[addonName] ?? 0);
        }
        return acc;
    }, 0);
};

const {
    MAIL,
    DRIVE,
    MAIL_BUSINESS,
    ENTERPRISE,
    BUNDLE,
    BUNDLE_PRO,
    BUNDLE_PRO_2024,
    MAIL_PRO,
    DRIVE_PRO,
    DRIVE_BUSINESS,
    VPN_PRO,
    VPN_BUSINESS,
    PASS_PRO,
    PASS_BUSINESS,
} = PLANS;

export type SupportedAddons = Partial<Record<ADDON_NAMES, boolean>>;

export function getSupportedB2CAddons(planIDs: PlanIDs): SupportedAddons {
    const supported: SupportedAddons = {};

    // Re-enable the scribe addons when/if B2C plans trully support them

    if (planIDs[MAIL]) {
        // supported[ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS] = true;
    }

    if (planIDs[DRIVE]) {
        // supported[ADDON_NAMES.MEMBER_SCRIBE_DRIVEPLUS] = true;
    }

    if (planIDs[BUNDLE]) {
        // supported[ADDON_NAMES.MEMBER_SCRIBE_BUNDLE] = true;
    }

    return supported;
}

export function getSupportedB2BAddons(planIDs: PlanIDs): SupportedAddons {
    const supported: SupportedAddons = {};

    if (planIDs[MAIL_PRO]) {
        supported[ADDON_NAMES.MEMBER_MAIL_PRO] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO] = true;
    }

    if (planIDs[MAIL_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_MAIL_BUSINESS] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS] = true;
    }

    if (planIDs[DRIVE_PRO]) {
        supported[ADDON_NAMES.MEMBER_DRIVE_PRO] = true;
    }

    if (planIDs[DRIVE_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_DRIVE_BUSINESS] = true;
    }

    if (planIDs[BUNDLE_PRO]) {
        supported[ADDON_NAMES.MEMBER_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.DOMAIN_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO] = true;
    }

    if (planIDs[BUNDLE_PRO_2024]) {
        supported[ADDON_NAMES.MEMBER_BUNDLE_PRO_2024] = true;
        supported[ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024] = true;
    }

    if (planIDs[ENTERPRISE]) {
        supported[ADDON_NAMES.MEMBER_ENTERPRISE] = true;
        supported[ADDON_NAMES.DOMAIN_ENTERPRISE] = true;
    }

    if (planIDs[VPN_PRO]) {
        supported[ADDON_NAMES.MEMBER_VPN_PRO] = true;
    }

    if (planIDs[VPN_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_VPN_BUSINESS] = true;
        supported[ADDON_NAMES.IP_VPN_BUSINESS] = true;
    }

    if (planIDs[PASS_PRO]) {
        supported[ADDON_NAMES.MEMBER_PASS_PRO] = true;
    }

    if (planIDs[PASS_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_PASS_BUSINESS] = true;
    }

    return supported;
}

export const getSupportedAddons = (planIDs: PlanIDs): SupportedAddons => {
    const supported: SupportedAddons = {
        ...getSupportedB2CAddons(planIDs),
        ...getSupportedB2BAddons(planIDs),
    };

    return supported;
};
