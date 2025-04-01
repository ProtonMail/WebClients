import {
    ADDON_NAMES,
    ADDON_PREFIXES,
    type Addon,
    type FreeSubscription,
    PLANS,
    type PlanIDs,
    type Subscription,
    isFreeSubscription,
} from '@proton/payments';

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

export const isDriveOrgSizeAddon: AddonGuard = (addonOrName): boolean => {
    return DRIVE_ORG_SIZE_ADDONS.some((name) => addonOrName === name);
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
    // B2C
    MAIL,
    DRIVE,
    PASS,
    PASS_FAMILY,
    VPN,
    VPN2024,
    BUNDLE,
    FAMILY,
    DUO,
    // B2B
    MAIL_BUSINESS,
    ENTERPRISE,
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

    if (planIDs[MAIL]) {
        supported[ADDON_NAMES.LUMO_MAIL] = true;
    }

    if (planIDs[DRIVE]) {
        supported[ADDON_NAMES.LUMO_DRIVE] = true;
    }

    if (planIDs[PASS]) {
        supported[ADDON_NAMES.LUMO_PASS] = true;
    }

    if (planIDs[PASS_FAMILY]) {
        supported[ADDON_NAMES.LUMO_PASS_FAMILY] = true;
    }

    if (planIDs[VPN]) {
        supported[ADDON_NAMES.LUMO_VPN] = true;
    }

    if (planIDs[VPN2024]) {
        supported[ADDON_NAMES.LUMO_VPN2024] = true;
    }

    if (planIDs[BUNDLE]) {
        supported[ADDON_NAMES.LUMO_BUNDLE] = true;
    }

    if (planIDs[FAMILY]) {
        supported[ADDON_NAMES.LUMO_FAMILY] = true;
    }

    if (planIDs[DUO]) {
        supported[ADDON_NAMES.LUMO_DUO] = true;
    }

    return supported;
}

export function getSupportedB2BAddons(planIDs: PlanIDs): SupportedAddons {
    const supported: SupportedAddons = {};

    if (planIDs[MAIL_PRO]) {
        supported[ADDON_NAMES.MEMBER_MAIL_PRO] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO] = true;
        supported[ADDON_NAMES.LUMO_MAIL_PRO] = true;
    }

    if (planIDs[MAIL_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_MAIL_BUSINESS] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS] = true;
        supported[ADDON_NAMES.LUMO_MAIL_BUSINESS] = true;
    }

    if (planIDs[DRIVE_PRO]) {
        supported[ADDON_NAMES.MEMBER_DRIVE_PRO] = true;
        supported[ADDON_NAMES.LUMO_DRIVE_PRO] = true;
    }

    if (planIDs[DRIVE_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_DRIVE_BUSINESS] = true;
        supported[ADDON_NAMES.LUMO_DRIVE_BUSINESS] = true;
    }

    if (planIDs[BUNDLE_PRO]) {
        supported[ADDON_NAMES.MEMBER_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.DOMAIN_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.IP_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.LUMO_BUNDLE_PRO] = true;
    }

    if (planIDs[BUNDLE_PRO_2024]) {
        supported[ADDON_NAMES.MEMBER_BUNDLE_PRO_2024] = true;
        supported[ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024] = true;
        supported[ADDON_NAMES.IP_BUNDLE_PRO_2024] = true;
        supported[ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024] = true;
        supported[ADDON_NAMES.LUMO_BUNDLE_PRO_2024] = true;
    }

    if (planIDs[ENTERPRISE]) {
        supported[ADDON_NAMES.MEMBER_ENTERPRISE] = true;
        supported[ADDON_NAMES.DOMAIN_ENTERPRISE] = true;
    }

    if (planIDs[VPN_PRO]) {
        supported[ADDON_NAMES.MEMBER_VPN_PRO] = true;
        supported[ADDON_NAMES.LUMO_VPN_PRO] = true;
    }

    if (planIDs[VPN_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_VPN_BUSINESS] = true;
        supported[ADDON_NAMES.IP_VPN_BUSINESS] = true;
        supported[ADDON_NAMES.LUMO_VPN_BUSINESS] = true;
    }

    if (planIDs[PASS_PRO]) {
        supported[ADDON_NAMES.MEMBER_PASS_PRO] = true;
        supported[ADDON_NAMES.LUMO_PASS_PRO] = true;
    }

    if (planIDs[PASS_BUSINESS]) {
        supported[ADDON_NAMES.MEMBER_PASS_BUSINESS] = true;
        supported[ADDON_NAMES.LUMO_PASS_BUSINESS] = true;
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

export const getPlansWithAddons = (): PLANS[] => {
    return Object.values(PLANS).filter((plan) => Object.keys(getSupportedAddons({ [plan]: 1 })).length > 0);
};
