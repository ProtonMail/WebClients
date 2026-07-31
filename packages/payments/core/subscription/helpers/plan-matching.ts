import { ADDON_NAMES, PLANS } from '../../constants';
import type { FreeSubscription } from '../../interface';
import { isFreeSubscription } from '../../type-guards';
import type { Subscription } from '../interface';

type MaybeFreeSubscription = Subscription | FreeSubscription | undefined;

export const hasSomeAddonOrPlan = (
    subscription: MaybeFreeSubscription,
    addonName: ADDON_NAMES | PLANS | (ADDON_NAMES | PLANS)[]
) => {
    if (isFreeSubscription(subscription)) {
        return false;
    }

    if (Array.isArray(addonName)) {
        return (subscription?.Plans || []).some(({ Name }) => addonName.includes(Name as ADDON_NAMES));
    }

    return (subscription?.Plans || []).some(({ Name }) => Name === addonName);
};

export const hasLumo = (subscription: MaybeFreeSubscription) => hasSomeAddonOrPlan(subscription, PLANS.LUMO);

const hasSomePlan = (subscription: MaybeFreeSubscription, planName: PLANS) => {
    if (isFreeSubscription(subscription)) {
        return false;
    }

    return (subscription?.Plans || []).some(({ Name }) => Name === planName);
};

export const hasVisionary = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VISIONARY);
export const hasDeprecatedVPN = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VPN);
export const hasVPN2024 = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VPN2024);
export const hasVPNPassBundle = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.VPN_PASS_BUNDLE);
export const hasMail = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.MAIL);
export const hasMailPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.MAIL_PRO);
export const hasMailBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.MAIL_BUSINESS);
export const hasDrive = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DRIVE);
export const hasDrive1TB = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DRIVE_1TB);
export const hasDriveLite = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DRIVE_LITE);
export const hasDrivePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DRIVE_PRO);
export const hasDriveBusiness = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.DRIVE_BUSINESS);
export const hasPass = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS);
export const hasBundle = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.BUNDLE);
export const hasBundlePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.BUNDLE_PRO);
export const hasBundlePro2024 = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.BUNDLE_PRO_2024);
export const hasBundleBiz2025 = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.BUNDLE_BIZ_2025);
export const hasFamily = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.FAMILY);
export const hasDuo = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DUO);
export const hasVpnPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VPN_PRO);
export const hasVpnBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VPN_BUSINESS);
export const hasVPNPassProfessional = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.VPN_PASS_BUNDLE_BUSINESS);
export const hasPassPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS_PRO);
export const hasPassFamily = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS_FAMILY);
export const hasPassBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS_BUSINESS);
export const hasLumoBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.LUMO_BUSINESS);
export const hasMeetBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.MEET_BUSINESS);
export const hasMeet = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.MEET);
export const hasFree = (subscription: MaybeFreeSubscription) => (subscription?.Plans || []).length === 0;

// including 2 versions of bundlepro + bundlebiz2025
export const hasAnyB2bBundle = (subscription: MaybeFreeSubscription) =>
    hasBundlePro(subscription) || hasBundlePro2024(subscription) || hasBundleBiz2025(subscription);

export const hasFreeOrPlus = (subscription: MaybeFreeSubscription) =>
    hasFree(subscription) ||
    hasMail(subscription) ||
    hasDrive(subscription) ||
    hasDrive1TB(subscription) ||
    hasPass(subscription) ||
    hasVPN2024(subscription) ||
    hasLumo(subscription);

export const hasAnyPlusWithoutVPN = (subscription: MaybeFreeSubscription) =>
    hasMail(subscription) ||
    hasDrive(subscription) ||
    hasDrive1TB(subscription) ||
    hasPass(subscription) ||
    hasLumo(subscription);

const hasAIAssistantCondition = [
    ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
    ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO,
    ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO,
    ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024,
];
export const hasAIAssistant = (subscription: MaybeFreeSubscription) =>
    hasSomeAddonOrPlan(subscription, hasAIAssistantCondition);

const PLANS_WITH_AI_INCLUDED = [PLANS.VISIONARY, PLANS.DUO, PLANS.FAMILY];
export const hasPlanWithAIAssistantIncluded = (subscription: MaybeFreeSubscription) =>
    hasSomeAddonOrPlan(subscription, PLANS_WITH_AI_INCLUDED);

export const hasAllProductsB2CPlan = (subscription: MaybeFreeSubscription) =>
    hasDuo(subscription) || hasFamily(subscription) || hasBundle(subscription) || hasVisionary(subscription);
