import { addWeeks, fromUnixTime, isBefore } from 'date-fns';

import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { Audience, type Organization, type UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import {
    ADDON_NAMES,
    COUPON_CODES,
    CYCLE,
    DEFAULT_CURRENCY,
    PLANS,
    PLAN_NAMES,
    type PLAN_SERVICES,
    PLAN_TYPES,
} from '../constants';
import { isRegionalCurrency } from '../helpers';
import type { Currency, FreeSubscription, PlanIDs } from '../interface';
import { getSupportedAddons, hasLumoAddonFromPlanIDs, isIpAddon, isLumoAddon, isMemberAddon } from '../plan/addons';
import {
    getHasPlusPlan,
    getIsB2BAudienceFromPlan,
    getPlanFromPlanIDs,
    getPlanNameFromIDs,
    isForbiddenModification,
} from '../plan/helpers';
import type { PlansMap, SubscriptionPlan } from '../plan/interface';
import { clearPlanIDs } from '../planIDs';
import { isFreeSubscription } from '../type-guards';
import { SubscriptionPlatform, TaxInclusive } from './constants';
import { FREE_PLAN } from './freePlans';
import type { Subscription, SubscriptionCheckResponse } from './interface';
import { SelectedPlan } from './selected-plan';

export function getPlan(subscription: Subscription | FreeSubscription | undefined, service?: PLAN_SERVICES) {
    const result = (subscription?.Plans || []).find(
        ({ Services, Type }) => Type === PLAN_TYPES.PLAN && (service === undefined ? true : hasBit(Services, service))
    );
    if (result) {
        return result as SubscriptionPlan & { Name: PLANS };
    }
    return result;
}

export function hasLifetimeCoupon(subscription: Subscription | FreeSubscription | undefined) {
    return subscription?.CouponCode === COUPON_CODES.LIFETIME;
}

export function hasAnniversary2025Coupon(subscription: Subscription | FreeSubscription | undefined) {
    return (
        [COUPON_CODES.COMMUNITYSPECIALDEAL25, COUPON_CODES.PROTONBDAYSALE25, COUPON_CODES.PROTONBDAYSALEB25] as string[]
    ).includes(subscription?.CouponCode || '');
}

export function hasSep2025Coupon(subscription: Subscription | FreeSubscription | undefined) {
    return (
        [
            COUPON_CODES.SEP25SALE,
            COUPON_CODES.SEP25BUNDLESALE,
            COUPON_CODES.SEP25SALECS,
            COUPON_CODES.SEP25BUNDLESALECS,
        ] as string[]
    ).includes(subscription?.CouponCode || '');
}

export function getSubscriptionPlanTitle(
    user: UserModel,
    subscription: Subscription | FreeSubscription | undefined
): {
    planTitle?: string;
    planName?: PLANS;
} {
    const primaryPlan = (() => {
        if (user.isPaid && !isFreeSubscription(subscription)) {
            return getPlan(subscription) ?? FREE_PLAN;
        } else if (user.hasPassLifetime) {
            return {
                Title: PLAN_NAMES[PLANS.PASS_LIFETIME],
                Name: PLANS.PASS_LIFETIME,
            };
        } else if (user.isFree) {
            return FREE_PLAN;
        }
    })();

    const planTitle = hasLifetimeCoupon(subscription) ? 'Lifetime' : primaryPlan?.Title;

    return {
        planTitle,
        planName: primaryPlan?.Name,
    };
}

export function getSubscriptionPlanTitles(
    user: UserModel,
    subscription: Subscription | FreeSubscription | undefined
): ReturnType<typeof getSubscriptionPlanTitle>[] {
    if (isFreeSubscription(subscription)) {
        return [getSubscriptionPlanTitle(user, subscription)];
    }

    return [
        getSubscriptionPlanTitle(user, subscription),
        ...(subscription?.SecondarySubscriptions?.map((sub) => getSubscriptionPlanTitle(user, sub)) ?? []),
    ];
}

const blackFriday2024Discounts: Set<string> = new Set([
    COUPON_CODES.BLACK_FRIDAY_2024,
    COUPON_CODES.BLACK_FRIDAY_2024_MONTH,
    COUPON_CODES.BLACK_FRIDAY_2024_PCMAG,
    COUPON_CODES.BLACK_FRIDAY_2024_HB,
    COUPON_CODES.BLACK_FRIDAY_2024_VPNLIGHTNING,
    COUPON_CODES.BLACK_FRIDAY_2024_PASS_LIFE,
]);
export const getHas2024OfferCoupon = (coupon: string | undefined | null): boolean => {
    if (!coupon) {
        return false;
    }
    return blackFriday2024Discounts.has(coupon?.toUpperCase());
};

type MaybeFreeSubscription = Subscription | FreeSubscription | undefined;

export const getAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).filter(({ Type }) => Type === PLAN_TYPES.ADDON);
export const hasAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).some(({ Type }) => Type === PLAN_TYPES.ADDON);

export const getPlanName = (subscription: Subscription | FreeSubscription | undefined, service?: PLAN_SERVICES) => {
    const plan = getPlan(subscription, service);
    return plan?.Name;
};

export const getPlanTitle = (subscription: Subscription | FreeSubscription | undefined) => {
    const plan = getPlan(subscription);
    return plan?.Title;
};

export const hasSomePlan = (subscription: MaybeFreeSubscription, planName: PLANS) => {
    if (isFreeSubscription(subscription)) {
        return false;
    }

    return (subscription?.Plans || []).some(({ Name }) => Name === planName);
};

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

export const hasMigrationDiscount = (subscription?: Subscription) => {
    return subscription?.CouponCode?.startsWith('MIGRATION');
};

export const isManagedExternally = (
    subscription: Subscription | FreeSubscription | Pick<Subscription, 'External'> | undefined | null
): boolean => {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    return subscription.External === SubscriptionPlatform.Android || subscription.External === SubscriptionPlatform.iOS;
};

/**
 * If user has multisubs, then this function will transform the nested secondary subscriptions into a flat array.
 * This is useful for functions that need to iterate over all subscriptions.
 */
export const getSubscriptionsArray = (subscription: Subscription): Subscription[] => {
    return [subscription, ...(subscription.SecondarySubscriptions ?? [])];
};

/**
 * returns true if any of the multisubs is managed externally
 */
export function isAnyManagedExternally(
    subscriptions: Subscription[] | Subscription | FreeSubscription | undefined | null
): boolean {
    if (!subscriptions || isFreeSubscription(subscriptions)) {
        return false;
    }

    if (Array.isArray(subscriptions)) {
        return subscriptions.some(isManagedExternally);
    }

    return getSubscriptionsArray(subscriptions).some(isManagedExternally);
}

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
export const hasDrivePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DRIVE_PRO);
export const hasDriveBusiness = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.DRIVE_BUSINESS);
export const hasPass = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS);
export const hasLumoPlan = (subscription: MaybeFreeSubscription) => hasSomeAddonOrPlan(subscription, PLANS.LUMO);
export const hasBundle = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.BUNDLE);
export const hasBundlePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.BUNDLE_PRO);
export const hasBundlePro2024 = (subscription: MaybeFreeSubscription) =>
    hasSomePlan(subscription, PLANS.BUNDLE_PRO_2024);
export const hasFamily = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.FAMILY);
export const hasDuo = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.DUO);
export const hasVpnPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VPN_PRO);
export const hasVpnBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.VPN_BUSINESS);
export const hasPassPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS_PRO);
export const hasPassFamily = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS_FAMILY);
export const hasPassBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PLANS.PASS_BUSINESS);
export const hasFree = (subscription: MaybeFreeSubscription) => (subscription?.Plans || []).length === 0;

export const hasAnyBundlePro = (subscription: MaybeFreeSubscription) =>
    hasBundlePro(subscription) || hasBundlePro2024(subscription);

const hasAIAssistantCondition = [
    ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
    ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO,
    ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO,
    ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024,
];
export const hasAIAssistant = (subscription: MaybeFreeSubscription) =>
    hasSomeAddonOrPlan(subscription, hasAIAssistantCondition);

export const PLANS_WITH_AI_INCLUDED = [PLANS.VISIONARY, PLANS.DUO, PLANS.FAMILY];
export const hasPlanWithAIAssistantIncluded = (subscription: MaybeFreeSubscription) =>
    hasSomeAddonOrPlan(subscription, PLANS_WITH_AI_INCLUDED);

export const hasAllProductsB2CPlan = (subscription: MaybeFreeSubscription) =>
    hasDuo(subscription) || hasFamily(subscription) || hasBundle(subscription) || hasVisionary(subscription);

export const getUpgradedPlan = (subscription: Subscription | undefined, app: ProductParam) => {
    if (hasFree(subscription)) {
        switch (app) {
            case APPS.PROTONPASS:
                return PLANS.PASS;
            case APPS.PROTONDRIVE:
                return PLANS.DRIVE;
            case APPS.PROTONVPN_SETTINGS:
                return PLANS.VPN2024;
            default:
            case APPS.PROTONMAIL:
                return PLANS.MAIL;
        }
    }
    if (hasBundle(subscription) || hasBundlePro(subscription) || hasBundlePro2024(subscription)) {
        return PLANS.BUNDLE_PRO_2024;
    }
    return PLANS.BUNDLE;
};

const canCheckItemPaidChecklistCondition: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.MAIL,
    PLANS.DRIVE,
    PLANS.FAMILY,
    PLANS.DUO,
    PLANS.BUNDLE,
]);
export const canCheckItemPaidChecklist = (subscription: Subscription | undefined) => {
    return subscription?.Plans?.some(({ Name }) => canCheckItemPaidChecklistCondition.has(Name));
};

const canCheckItemGetStartedCondition: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.VPN,
    PLANS.VPN2024,
    PLANS.PASS,
    PLANS.VPN_PASS_BUNDLE,
]);
export const canCheckItemGetStarted = (subscription: Subscription | undefined) => {
    return subscription?.Plans?.some(({ Name }) => canCheckItemGetStartedCondition.has(Name));
};

export const hasLumoMobileSubscription = (subscription?: MaybeFreeSubscription) => {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    if (isManagedExternally(subscription) && hasLumoPlan(subscription)) {
        return true;
    }

    for (const secondarySubscription of subscription.SecondarySubscriptions ?? []) {
        if (isManagedExternally(secondarySubscription) && hasLumoPlan(secondarySubscription)) {
            return true;
        }
    }

    return false;
};

export const getCanAccessFamilyPlans = (subscription?: MaybeFreeSubscription) => {
    return !hasLumoMobileSubscription(subscription);
};

const getCanAccessDuoPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.MAIL,
    PLANS.DRIVE,
    PLANS.DRIVE_1TB,
    PLANS.PASS,
    PLANS.PASS_FAMILY,
    PLANS.VPN,
    PLANS.VPN2024,
    PLANS.LUMO,
    PLANS.BUNDLE,
    PLANS.MAIL_PRO,
    PLANS.VISIONARY,
    PLANS.MAIL_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
]);

export const getCanSubscriptionAccessDuoPlan = (subscription?: MaybeFreeSubscription) => {
    if (hasLumoMobileSubscription(subscription)) {
        return false;
    }

    return hasFree(subscription) || subscription?.Plans?.some(({ Name }) => getCanAccessDuoPlanCondition.has(Name));
};

const getCanAccessPassFamilyPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([PLANS.PASS]);
export const getCanSubscriptionAccessPassFamilyPlan = (subscription?: MaybeFreeSubscription) => {
    return (
        hasFree(subscription) || subscription?.Plans?.some(({ Name }) => getCanAccessPassFamilyPlanCondition.has(Name))
    );
};

export const getIsB2BAudienceFromSubscription = (subscription: Subscription | undefined) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsB2BAudienceFromPlan(Name));
};

export const getHasVpnB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasVpnPro(subscription) || hasVpnBusiness(subscription);
};

export const getHasSomeVpnPlan = (subscription: MaybeFreeSubscription) => {
    return (
        hasDeprecatedVPN(subscription) ||
        hasVPN2024(subscription) ||
        hasVPNPassBundle(subscription) ||
        hasVpnPro(subscription) ||
        hasVpnBusiness(subscription)
    );
};

export const getHasConsumerVpnPlan = (subscription: MaybeFreeSubscription) => {
    return hasDeprecatedVPN(subscription) || hasVPN2024(subscription) || hasVPNPassBundle(subscription);
};

export const getHasPassB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasPassPro(subscription) || hasPassBusiness(subscription);
};

export const getHasDriveB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasDrivePro(subscription) || hasDriveBusiness(subscription);
};

const externalMemberB2BPlans: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.VPN_PRO,
    PLANS.VPN_BUSINESS,
    PLANS.DRIVE_PRO,
    PLANS.DRIVE_BUSINESS,
    PLANS.PASS_PRO,
    PLANS.PASS_BUSINESS,
]);
export const getHasExternalMemberCapableB2BPlan = (subscription: MaybeFreeSubscription) => {
    return subscription?.Plans?.some((plan) => externalMemberB2BPlans.has(plan.Name)) || false;
};

export const getHasMailB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasMailPro(subscription) || hasMailBusiness(subscription);
};

export const getHasInboxB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasAnyBundlePro(subscription) || getHasMailB2BPlan(subscription);
};

export const getPlanIDs = (subscription: MaybeFreeSubscription | null): PlanIDs => {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { Name, Quantity }) => {
        acc[Name] = (acc[Name] || 0) + Quantity;
        return acc;
    }, {});
};

export const isTrial = (subscription: Subscription | FreeSubscription | undefined, plan?: PLANS): boolean => {
    if (isFreeSubscription(subscription) || !subscription) {
        return false;
    }

    const trial = !!subscription.IsTrial;

    if (!plan) {
        return !!subscription.IsTrial;
    }

    return trial && getPlanName(subscription) === plan;
};

const autoRenewTrialPlans: Set<PLANS | ADDON_NAMES> = new Set([PLANS.VPN2024, PLANS.BUNDLE]);

// Remove the plan check once subscription.Renew is correctly set
export const isAutoRenewTrial = (subscription: Subscription | undefined) => {
    return (
        // (isTrial(subscription) && subscription?.Renew) ||
        isTrial(subscription) && subscription?.Plans?.some((plan) => autoRenewTrialPlans.has(plan.Name))
    );
};

export const isTrialExpired = (subscription: Subscription | undefined) => {
    const now = new Date();
    return now > fromUnixTime(subscription?.PeriodEnd || 0);
};

export const willTrialExpire = (subscription: Subscription | undefined) => {
    const now = new Date();
    return isBefore(fromUnixTime(subscription?.PeriodEnd || 0), addWeeks(now, 1));
};

export const getHasMemberCapablePlan = (
    organization: Organization | undefined,
    subscription: Subscription | undefined
) => {
    const supportedAddons = getSupportedAddons(getPlanIDs(subscription));
    return (organization?.MaxMembers || 0) > 1 || (Object.keys(supportedAddons) as ADDON_NAMES[]).some(isMemberAddon);
};

export const allCycles = Object.freeze(
    Object.values(CYCLE)
        .filter((cycle): cycle is CYCLE => typeof cycle === 'number')
        .sort((a, b) => a - b)
);
export const regularCycles = Object.freeze([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]);
export const customCycles = Object.freeze(allCycles.filter((cycle) => !regularCycles.includes(cycle)));

export const isRegularCycle = (cycle: CYCLE) => {
    return regularCycles.includes(cycle);
};

export const getValidCycle = (cycle: number): CYCLE | undefined => {
    return allCycles.includes(cycle) ? cycle : undefined;
};

const getValidAudienceCondition = [Audience.B2B, Audience.B2C, Audience.FAMILY];
export const getValidAudience = (audience: string | undefined | null): Audience | undefined => {
    return getValidAudienceCondition.find((realAudience) => realAudience === audience);
};

export const hasCustomCycle = (subscription?: Subscription) => {
    if (!subscription) {
        return false;
    }
    return customCycles.includes(subscription.Cycle);
};

export function getNormalCycleFromCustomCycle(cycle: CYCLE): CYCLE;
export function getNormalCycleFromCustomCycle(cycle: undefined): undefined;
export function getNormalCycleFromCustomCycle(cycle: CYCLE | undefined): CYCLE | undefined;
export function getNormalCycleFromCustomCycle(cycle: CYCLE | undefined): CYCLE | undefined {
    if (!cycle) {
        return undefined;
    }

    if (regularCycles.includes(cycle)) {
        return cycle;
    }

    // find the closest lower regular cycle
    for (let i = regularCycles.length - 1; i >= 0; i--) {
        const regularCycle = regularCycles[i];

        if (regularCycle < cycle) {
            return regularCycle;
        }
    }

    // well, that should be unreachable, but let it be just in case
    return CYCLE.MONTHLY;
}

export function getLongerCycle(cycle: CYCLE): CYCLE;
export function getLongerCycle(cycle: CYCLE | undefined): CYCLE | undefined {
    if (!cycle) {
        return undefined;
    }
    if (cycle === CYCLE.MONTHLY) {
        return CYCLE.YEARLY;
    }
    if (cycle === CYCLE.YEARLY) {
        return CYCLE.TWO_YEARS;
    }

    if (cycle === CYCLE.FIFTEEN || cycle === CYCLE.THIRTY) {
        return CYCLE.TWO_YEARS;
    }

    return cycle;
}

export interface PricingForCycles {
    [CYCLE.MONTHLY]: number;
    [CYCLE.THREE]: number;
    [CYCLE.SIX]: number;
    [CYCLE.YEARLY]: number;
    [CYCLE.EIGHTEEN]: number;
    [CYCLE.TWO_YEARS]: number;
    [CYCLE.FIFTEEN]: number;
    [CYCLE.THIRTY]: number;
}

export interface AggregatedPricing {
    all: PricingForCycles;
    defaultMonthlyPrice: number;
    defaultMonthlyPriceWithoutAddons: number;
    /**
     * That's pricing that counts only aggregate of cost for members. That's useful for rendering of
     * "per user per month" pricing.
     * Examples:
     * - If you have a B2C plan with 1 user, then this price will be the same as `all`.
     * - If you have Mail Plus plan with several users, then this price will be the same as `all`, because each
     *     additional member counts to the price of members.
     * - If you have Bundle Pro with several users and with the default (minimum) number of custom domains, then
     *     this price will be the same as `all`.
     *
     * Here things become different:
     * - If you have Bundle Pro with several users and with more than the default (minimum) number of custom domains,
     *     then this price will be `all - extra custom domains price`.
     * - For VPN Business the behavior is more complex. It also has two addons: member and IPs/servers. By default it
     *     has 2 members and 1 IP. The price for members should exclude price for the 1 default IP.
     */
    members: PricingForCycles;
    membersNumber: number;
    plans: PricingForCycles;
}

export const getHasCoupon = (subscription: Subscription | undefined, coupon: string) => {
    return [subscription?.CouponCode, subscription?.UpcomingSubscription?.CouponCode].includes(coupon);
};

export function isCancellableOnlyViaSupport(subscription: Subscription | undefined) {
    if (isTrial(subscription)) {
        // Always allow canceling trials without contacting support
        return false;
    }

    const vpnB2BPlans = [PLANS.VPN_BUSINESS, PLANS.VPN_PRO];
    const isVpnB2BPlan = vpnB2BPlans.includes(getPlanName(subscription) as PLANS);
    if (isVpnB2BPlan) {
        return true;
    }

    const otherPlansWithIpAddons = [PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024];
    if (otherPlansWithIpAddons.includes(getPlanName(subscription) as PLANS)) {
        const hasIpAddons = (Object.keys(getPlanIDs(subscription)) as (PLANS | ADDON_NAMES)[]).some((plan) =>
            isIpAddon(plan)
        );
        return hasIpAddons;
    }

    return false;
}

/**
 * Checks if subscription can be cancelled by a user. Cancellation means that the user will be downgraded at the end
 * of the current billing cycle. In contrast, "Downgrade subscription" button means that the user will be downgraded
 * immediately. Note that B2B subscriptions also have "Cancel subscription" button, but it behaves differently, so
 * we don't consider B2B subscriptions cancellable for the purpose of this function.
 */
export const hasCancellablePlan = (subscription: Subscription | undefined) => {
    return !isCancellableOnlyViaSupport(subscription);
};

export function hasMaximumCycle(subscription?: Subscription | FreeSubscription): boolean {
    return (
        subscription?.Cycle === CYCLE.TWO_YEARS ||
        subscription?.Cycle === CYCLE.THIRTY ||
        subscription?.UpcomingSubscription?.Cycle === CYCLE.TWO_YEARS ||
        subscription?.UpcomingSubscription?.Cycle === CYCLE.THIRTY
    );
}

export const getMaximumCycleForApp = (app: ProductParam, currency?: Currency) => {
    if (app === APPS.PROTONPASS || app === APPS.PROTONWALLET) {
        return CYCLE.YEARLY;
    }
    // Even though this returns the same value as the final return, adding this explicitly because VPN wants to keep the two year cycle
    if (app === APPS.PROTONVPN_SETTINGS) {
        return CYCLE.TWO_YEARS;
    }

    return currency && isRegionalCurrency(currency) ? CYCLE.YEARLY : CYCLE.TWO_YEARS;
};

export function isTaxInclusive(checkResponse?: Pick<SubscriptionCheckResponse, 'TaxInclusive'>): boolean {
    return checkResponse?.TaxInclusive === TaxInclusive.INCLUSIVE;
}

export function isTaxExclusive(checkResponse?: Pick<SubscriptionCheckResponse, 'TaxInclusive'>): boolean {
    return checkResponse?.TaxInclusive === TaxInclusive.EXCLUSIVE;
}

export const PASS_LAUNCH_OFFER = 'passlaunch';

export function hasPassLaunchOffer(subscription: Subscription | FreeSubscription | undefined): boolean {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    const plan = getPlan(subscription);

    const isLaunchOffer = plan?.Offer === PASS_LAUNCH_OFFER;

    return isLaunchOffer && subscription.Cycle === CYCLE.YEARLY && plan?.Name === PLANS.PASS;
}

export function getIsUpcomingSubscriptionUnpaid(subscription: Subscription): boolean {
    const current = subscription;
    const upcoming = subscription.UpcomingSubscription;

    // Two possible cases here: addon downgrade (for example, Scribe) and scheduled downcycling.
    // 1. Addon downgrade: user decreases the number of addons,
    //     then the upcoming subscription will have the same cycle as the current subscription
    // "current.Cycle === upcoming.Cycle" checks that
    //
    // 2. Scheduled downcycling: user changes, for example, from 12 months to 1 month,
    //     then the upcoming subscription will have a lower cycle than the current subscription
    // "current.Cycle > upcoming.Cycle" checks that
    //
    // In both cases, the upcoming subscription will be unpaid until it starts.
    // see PAY-2060, PAY-2080, and PAY-3027.
    return !!current && !!upcoming && current.Cycle >= upcoming.Cycle;
}

export function getRenewalTime(subscription: Subscription): number {
    const current = subscription;
    const upcoming = subscription.UpcomingSubscription;
    const latestSubscription = upcoming ?? current;
    const isUpcomingSubscriptionUnpaid = getIsUpcomingSubscriptionUnpaid(subscription);

    return upcoming && isUpcomingSubscriptionUnpaid ? upcoming.PeriodStart : latestSubscription.PeriodEnd;
}

export function isSubscriptionUnchanged(
    subscription: Subscription | FreeSubscription | null | undefined,
    planIds: PlanIDs,
    cycle?: CYCLE
): boolean {
    const subscriptionPlanIds = getPlanIDs(subscription);

    const planIdsUnchanged = isDeepEqual(subscriptionPlanIds, planIds);
    // Cycle is optional, so if it is not provided, we assume it is unchanged
    const cycleUnchanged = !cycle || cycle === subscription?.Cycle;

    return planIdsUnchanged && cycleUnchanged;
}

export const hasLumoAddon = (subscription: MaybeFreeSubscription) => {
    const currentPlanIDs = getPlanIDs(subscription);

    return hasLumoAddonFromPlanIDs(currentPlanIDs);
};

export function isForbiddenLumoPlus({
    subscription,
    newPlanName,
    plansMap,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    newPlanName: PLANS | ADDON_NAMES | undefined;
    plansMap: PlansMap;
}) {
    if (!subscription || newPlanName !== PLANS.LUMO) {
        return false;
    }
    const currentPlanIDs = getPlanIDs(subscription);
    const currentPlanSupportedAddons = getSupportedAddons(currentPlanIDs);

    const currentPlanKey = getPlanNameFromIDs(currentPlanIDs);
    const currentPlan = currentPlanKey ? plansMap[currentPlanKey] : undefined;
    const lumoAddonForCurrentPlan = Object.keys(currentPlanSupportedAddons).find((key) => isLumoAddon(key as any));
    const lumoAddon = lumoAddonForCurrentPlan ? plansMap[lumoAddonForCurrentPlan as keyof typeof plansMap] : undefined;
    if (currentPlan && lumoAddon) {
        const newPlanIDs = {
            ...currentPlanIDs,
            [lumoAddon.Name]: currentPlanIDs[lumoAddon.Name] || 1, // Keep current addons or add at least one.
        };
        const currentPlanSelected = SelectedPlan.createNormalized(
            newPlanIDs,
            plansMap,
            subscription.Cycle || CYCLE.MONTHLY,
            subscription.Currency || DEFAULT_CURRENCY
        );

        return {
            planName: currentPlanSelected.getPlanName(),
            planIDs: currentPlanSelected.planIDs,
        };
    }
    return false;
}

export function isForbiddenPlusToPlus({
    subscription,
    newPlanIDs,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    newPlanIDs: PlanIDs;
}): boolean {
    if (!subscription) {
        return false;
    }
    const subscribedPlan = getPlan(subscription?.UpcomingSubscription ?? subscription);
    const subscribedPlans = [subscribedPlan].filter(isTruthy).filter(
        /**
         Ignore pass lifetime, they should always be allowed to change to another plus plan
         **/ (plan) => plan.Name !== PLANS.PASS_LIFETIME
    );
    const isSubscribedToAPlusPlan = subscribedPlans.some((subscribedPlan) => getHasPlusPlan(subscribedPlan.Name));
    const newPlanName = getPlanNameFromIDs(newPlanIDs);
    const isNotSamePlanName = !subscribedPlans.some((subscribedPlan) => subscribedPlan.Name === newPlanName);
    const allowPlusToPlusTransitions = [
        {
            // Going from any plan
            from: ['*'],
            // To Pass lifetime
            to: [PLANS.PASS_LIFETIME],
        },
        {
            // Going from Drive 200 GB or Drive 1 TB
            from: [PLANS.DRIVE, PLANS.DRIVE_1TB],
            // To Drive 200 GB or Drive 1 TB should be allowed
            to: [PLANS.DRIVE, PLANS.DRIVE_1TB],
        },
        {
            // Going from VPN Plus or Pass plus
            from: [PLANS.VPN, PLANS.VPN2024, PLANS.PASS],
            // To VPN + Pass bundle
            to: [PLANS.VPN_PASS_BUNDLE],
        },
        {
            // Going from legacy vpn
            from: [PLANS.VPN],
            // To new vpn
            to: [PLANS.VPN2024],
        },
    ];
    const allowPlusToPlusTransition = allowPlusToPlusTransitions.some(({ from, to }) => {
        return subscribedPlans.some(
            (subscribedPlan) =>
                subscribedPlan.Name &&
                newPlanName &&
                (from.includes(subscribedPlan.Name) || from.includes('*')) &&
                to.includes(newPlanName)
        );
    });
    const isNewPlanAPlusPlan = getHasPlusPlan(newPlanName);

    const isSubscribedToLumoPlus = subscribedPlans.some((subscribedPlan) => subscribedPlan.Name === PLANS.LUMO);
    const newPlanIDsHaveLumoAddon = hasLumoAddonFromPlanIDs(clearPlanIDs(newPlanIDs)) && isNewPlanAPlusPlan;
    const lumoPlusToAnotherPlusWithLumoAddon = isSubscribedToLumoPlus && newPlanIDsHaveLumoAddon;

    // case for multi-subs. If user has Lumo Plus on mobile then they are ALLOWED to buy other Plus plans on web. After
    // that, they will have one mobile and one web subscription.
    const lumoPlusMobileToAnotherPlus =
        isSubscribedToLumoPlus && isNewPlanAPlusPlan && isManagedExternally(subscription);

    return Boolean(
        isSubscribedToAPlusPlan &&
            isNewPlanAPlusPlan &&
            isNotSamePlanName &&
            !allowPlusToPlusTransition &&
            !lumoPlusToAnotherPlusWithLumoAddon &&
            !lumoPlusMobileToAnotherPlus
    );
}

export function getIsPlanTransitionForbidden({
    subscription,
    plansMap,
    planIDs,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    planIDs: PlanIDs;
    plansMap: PlansMap;
}) {
    const newPlan = getPlanFromPlanIDs(plansMap, planIDs);
    const newPlanName = newPlan?.Name;

    const lumoForbidden = isForbiddenLumoPlus({ plansMap, subscription, newPlanName });
    if (lumoForbidden) {
        return { type: 'lumo-plus', newPlanIDs: lumoForbidden.planIDs, newPlanName: lumoForbidden.planName } as const;
    }

    if (isForbiddenPlusToPlus({ subscription, newPlanIDs: planIDs })) {
        return { type: 'plus-to-plus', newPlanName } as const;
    }

    return null;
}

function isSubscriptionPrepaid(subscription: Subscription): boolean {
    // InvoiceID idicates whether the subscription was alread prepaid. If there is no InvoiceID, then the upcoming
    // subscription is unpaid.
    return !!subscription?.InvoiceID;
}

/**
 * Variable cycle offers are marked by automatically created unpaid scheduled subscriptions with different cycles than
 * the current susbcription. For example when user subscribes to vpn2024 24m then the backend will create a scheduled
 * 12m subscription. User will be billed when the upcoming 12m term starts. Another example is when user subscribes to
 * bundle2022 6m - the backend will also create scheduled 12m subscription. P2-634 is the relevant ticket.
 */
function isVariableCycleOffer(subscription: Subscription | FreeSubscription | null | undefined): boolean {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    const current = subscription;
    const upcoming = subscription.UpcomingSubscription;

    return !!upcoming && current.Cycle !== upcoming.Cycle && !isSubscriptionPrepaid(upcoming);
}

export function isSubcriptionCheckForbidden(
    subscription: Subscription | FreeSubscription | null | undefined,
    planIDs: PlanIDs,
    cycle: CYCLE
): boolean {
    if (!subscription) {
        return false;
    }

    const selectedSameAsCurrent =
        !!subscription && !isFreeSubscription(subscription)
            ? isSubscriptionUnchanged(subscription, planIDs, cycle)
            : false;

    const upcoming = subscription.UpcomingSubscription;
    const hasUpcomingSubscription = !!upcoming;
    const selectedSameAsUpcoming = hasUpcomingSubscription ? isSubscriptionUnchanged(upcoming, planIDs, cycle) : false;

    const variableCycleOffer = isVariableCycleOffer(subscription);

    const isScheduledUnpaidModification =
        hasUpcomingSubscription && !variableCycleOffer && !isSubscriptionPrepaid(upcoming);

    const selectedSameAsCurrentIgnorringCycle =
        !!subscription && !isFreeSubscription(subscription) ? isSubscriptionUnchanged(subscription, planIDs) : false;

    const managedExternally = isManagedExternally(subscription);

    const forbiddenSubscriptionMode =
        /**
         * Consider the table with possible cases:
         * |                                | selectedSameAsCurrent | selectedSameAsUpcoming        |
         * |--------------------------------|-----------------------|-------------------------------|
         * | hasVariableCycleOffer          | check forbidden       | check forbidden               |
         * | hasUpcomingPrepaidSubscription | check forbidden       | check forbidden               |
         * | hasNoUpcomingSubscription      | check forbidden       | n/a                           |
         * | hasScheduledUnpaidDowncycling  | check allowed         | check forbidden               |
         *
         * "check forbidden" means that the /check endpoint will return an error.
         * "check allowed" means that the /check endpoint will work as expected.
         *
         * hasVariableCycleOffer - when user has an automatic scheduled unpaid subscription.
         * For example, when user subscribes to vpn2024 24m then the backend will create a scheduled 12m subscription.
         *
         * hasUpcomingPrepaidSubscription - when user manually created a scheduled subscription and paid for it.
         * This can happen when user subscribes to a higher cycle.
         * For example, if user has 1m bundle2022 and subscribes to 12m bundle2022,
         * then we will charge user immediately for 12m subscription, and it will start only when the 1m ends.
         *
         * hasNoUpcomingSubscription - the simplest case. Just subscription.
         *
         * hasScheduledUnpaidDowncycling - this is a special case for some addons like Scribe.
         * If user has a B2B plan with scribe addons and they want to decrease the number of scribes
         * then it creates a scheduled subscription with lower number of scribes.
         *
         * The four cases described above are handled by the first two disjunctions.
         *
         * The third disjunction is a special case for multi-subs. If user has a mobile subscription (for example, Lumo)
         * and selects the same plan on web (any cycle) then the check is forbidden. Users must not be able to modify
         * the subscription that's managed externally. In some cases, they should be allowed to create a new one, and
         * we call it multi-subs.
         *
         * P2-634 is the relevant ticket.
         */
        (selectedSameAsCurrent && !isScheduledUnpaidModification) ||
        selectedSameAsUpcoming ||
        (selectedSameAsCurrentIgnorringCycle && managedExternally);

    // It's forbidden to change from certain plans to other plans. This constant reflects that.
    const forbiddenModificationAttempt = isForbiddenModification(subscription, planIDs);

    return forbiddenSubscriptionMode || forbiddenModificationAttempt;
}

/**
 * Checks if the current plan can be eligible for multi-subs. It works this way: If user has a mobile Lumo subscription
 * then they can buy another subscription on web. So this function checks if another subscription can be added to the
 * existing susbcription that has one of the plans listed in this function.
 */
function isMobileMultiSubSupported(subscription: Subscription) {
    return hasLumoPlan(subscription);
}

export function canModify(subscription: Subscription | FreeSubscription | null | undefined) {
    return (
        !subscription ||
        isFreeSubscription(subscription) ||
        !isManagedExternally(subscription) ||
        isMobileMultiSubSupported(subscription)
    );
}

type SubscriptionActions = (
    | {
          canModify: true;
          cantModifyReason: undefined;
      }
    | {
          canModify: false;
          cantModifyReason: 'subscription_managed_externally';
      }
) &
    (
        | {
              canCancel: true;
              cantCancelReason: undefined;
          }
        | {
              canCancel: false;
              cantCancelReason: 'subscription_managed_externally';
          }
    );

/**
 * Returns the available subscription actions for the given subscription. Sometimes it's possible to modify the
 * subscription, while it's not possible to cancel it.
 *
 * For example, if user has mobile Lumo subscription then it's possible to add a web subscription (canModify == true
 * allows using the subscription modal). However it's not possible to cancel the mobile subscription on web.
 */
export function getAvailableSubscriptionActions(subscription: Subscription): SubscriptionActions {
    const modificationAllowed = canModify(subscription);
    const managedExternally = isManagedExternally(subscription);

    return {
        canModify: modificationAllowed,
        cantModifyReason: !modificationAllowed ? ('subscription_managed_externally' as const) : undefined,
        canCancel: !managedExternally,
        cantCancelReason: managedExternally ? ('subscription_managed_externally' as const) : undefined,
    } as SubscriptionActions;
}
