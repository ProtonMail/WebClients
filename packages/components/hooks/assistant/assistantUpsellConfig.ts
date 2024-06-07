import { OpenCallbackProps, SUBSCRIPTION_STEPS } from '@proton/components/index';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import {
    OrganizationWithSettings,
    SubscriptionModel,
    SubscriptionPlan,
    UserModel,
} from '@proton/shared/lib/interfaces';

const getUpgradeCycles = (currentCycle = CYCLE.MONTHLY) => ({
    cycle: currentCycle,
    minimumCycle: currentCycle,
    maximumCycle: currentCycle === CYCLE.MONTHLY ? CYCLE.YEARLY : currentCycle,
});

// Free users are uspell to Mail Plus with the add-on
const freeUserUpsellConfig = (upsellRef: string): OpenCallbackProps => {
    const cycles = getUpgradeCycles();
    return {
        mode: 'upsell-modal',
        planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS]: 1 },
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        withB2CAddons: true,
        disablePlanSelection: true,
        upsellRef,
        ...cycles,
        metrics: {
            source: 'upsells',
        },
    };
};

const paidSingleUserUpsellConfig = (
    upsellRef: string,
    planName: PLANS,
    addonName: ADDON_NAMES,
    cycle?: CYCLE
): OpenCallbackProps => {
    const cycles = getUpgradeCycles(cycle);
    return {
        mode: 'upsell-modal',
        planIDs: { [planName]: 1, [addonName]: 1 },
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        withB2CAddons: true,
        disablePlanSelection: true,
        upsellRef,
        ...cycles,
        metrics: {
            source: 'upsells',
        },
    };
};

const paidMultipleUserUpsellConfig = (
    upsellRef: string,
    addonName: ADDON_NAMES,
    currentPlan?: SubscriptionPlan,
    subscription?: SubscriptionModel,
    organization?: OrganizationWithSettings
): OpenCallbackProps => {
    const cycles = getUpgradeCycles(currentPlan?.Cycle);
    const { MaxMembers = 1, MaxAI = 0 } = organization || {};
    const addonsValue = MaxAI ? MaxAI : MaxMembers;

    return {
        mode: 'upsell-modal',
        planIDs: {
            ...getPlanIDs(subscription),
            [addonName]: addonsValue,
        },
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        withB2CAddons: true,
        disablePlanSelection: true,
        upsellRef,
        ...cycles,
        metrics: {
            source: 'upsells',
        },
    };
};

export const paidUserAssistantAddonName = (planName?: PLANS) => {
    switch (planName) {
        case PLANS.MAIL:
            return ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS;
        case PLANS.DRIVE:
            return ADDON_NAMES.MEMBER_SCRIBE_DRIVEPLUS;
        case PLANS.BUNDLE:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE;
        case PLANS.PASS_PLUS:
            return ADDON_NAMES.MEMBER_SCRIBE_PASS;
        case PLANS.VPN:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN;
        case PLANS.VPN2024:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN2024;
        case PLANS.VPN_PASS_BUNDLE:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN_PASS_BUNDLE;
        case PLANS.BUNDLE_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO;
        case PLANS.MAIL_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO;
        case PLANS.MAIL_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS;
        case PLANS.PASS_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_PASS_PRO;
        case PLANS.VPN_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN_BIZ;
        case PLANS.PASS_BUSINESS:
            return ADDON_NAMES.MEMBER_SCRIBE_PASS_BIZ;
        case PLANS.VPN_PRO:
            return ADDON_NAMES.MEMBER_SCRIBE_VPN_PRO;
        case PLANS.FAMILY:
            return ADDON_NAMES.MEMBER_SCRIBE_FAMILY;
        default:
            return ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS;
    }
};

export const getAssistantUpsellConfig = (
    upsellRef: string,
    user: UserModel,
    isOrgAdmin: boolean,
    currentPlan?: SubscriptionPlan,
    subscription?: SubscriptionModel,
    organization?: OrganizationWithSettings
): OpenCallbackProps | undefined => {
    if (user.isSubUser) {
        return undefined;
    }

    if (isOrgAdmin && currentPlan) {
        const addonName = paidUserAssistantAddonName(currentPlan.Name as PLANS);
        return paidMultipleUserUpsellConfig(upsellRef, addonName, currentPlan, subscription, organization);
    }

    if (user.isPaid && currentPlan) {
        const addonName = paidUserAssistantAddonName(currentPlan.Name as PLANS);
        return paidSingleUserUpsellConfig(upsellRef, currentPlan.Name as PLANS, addonName, currentPlan.Cycle);
    }

    // Return the free user config if the user is not paid and don't have member in its organization
    return freeUserUpsellConfig(upsellRef);
};

export const getAssistantDowngradeConfig = (
    upsellRef: string,
    currentPlan?: SubscriptionPlan
): OpenCallbackProps | undefined => {
    if (!currentPlan) {
        return undefined;
    }

    return {
        mode: 'upsell-modal',
        planIDs: { [currentPlan.Name as PLANS]: 1 },
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
        cycle: currentPlan.Cycle,
        maximumCycle: currentPlan.Cycle,
        minimumCycle: currentPlan.Cycle,
        upsellRef,
        metrics: {
            source: 'upsells',
        },
    };
};
