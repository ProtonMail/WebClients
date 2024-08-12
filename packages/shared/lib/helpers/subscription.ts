import { addWeeks, fromUnixTime, isBefore } from 'date-fns';

import { isSplittedUser, onSessionMigrationChargebeeStatus } from '@proton/components/payments/core';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getSupportedAddons, isIpAddon, isMemberAddon } from '@proton/shared/lib/helpers/addons';

import type { FreeSubscription } from '../constants';
import {
    ADDON_NAMES,
    APPS,
    COUPON_CODES,
    CYCLE,
    IPS_INCLUDED_IN_PLAN,
    PLANS,
    PLAN_SERVICES,
    PLAN_TYPES,
    isFreeSubscription,
} from '../constants';
import type {
    Organization,
    Plan,
    PlanIDs,
    PlansMap,
    Pricing,
    Subscription,
    SubscriptionModel,
    SubscriptionPlan,
    UserModel,
} from '../interfaces';
import { Audience, ChargebeeEnabled, External } from '../interfaces';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;

const {
    VISIONARY,
    MAIL,
    MAIL_PRO,
    MAIL_BUSINESS,
    DRIVE,
    DRIVE_PRO,
    DRIVE_BUSINESS,
    PASS,
    WALLET,
    VPN,
    VPN2024,
    VPN_PASS_BUNDLE,
    ENTERPRISE,
    BUNDLE,
    BUNDLE_PRO,
    BUNDLE_PRO_2024,
    FAMILY,
    DUO,
    VPN_PRO,
    VPN_BUSINESS,
    PASS_PRO,
    PASS_BUSINESS,
} = PLANS;

const {
    MEMBER_SCRIBE_MAILPLUS,
    MEMBER_SCRIBE_MAIL_BUSINESS,
    MEMBER_SCRIBE_DRIVEPLUS,
    MEMBER_SCRIBE_BUNDLE,
    MEMBER_SCRIBE_PASS,
    MEMBER_SCRIBE_VPN,
    MEMBER_SCRIBE_VPN2024,
    MEMBER_SCRIBE_VPN_PASS_BUNDLE,
    MEMBER_SCRIBE_MAIL_PRO,
    MEMBER_SCRIBE_BUNDLE_PRO,
    MEMBER_SCRIBE_BUNDLE_PRO_2024,
    MEMBER_SCRIBE_PASS_PRO,
    MEMBER_SCRIBE_VPN_BIZ,
    MEMBER_SCRIBE_PASS_BIZ,
    MEMBER_SCRIBE_VPN_PRO,
    MEMBER_SCRIBE_FAMILY,
    MEMBER_SCRIBE_DUO,
} = ADDON_NAMES;

type MaybeFreeSubscription = Subscription | FreeSubscription | undefined;

export const getPlan = (subscription: Subscription | FreeSubscription | undefined, service?: PLAN_SERVICES) => {
    const result = (subscription?.Plans || []).find(
        ({ Services, Type }) => Type === PLAN && (service === undefined ? true : hasBit(Services, service))
    );
    if (result) {
        return result as SubscriptionPlan & { Name: PLANS };
    }
    return result;
};

export const getAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).filter(({ Type }) => Type === ADDON);
export const hasAddons = (subscription: Subscription | undefined) =>
    (subscription?.Plans || []).some(({ Type }) => Type === ADDON);

export const getPlanName = (subscription: Subscription | undefined, service?: PLAN_SERVICES) => {
    const plan = getPlan(subscription, service);
    return plan?.Name;
};

export const getPlanTitle = (subscription: Subscription | undefined) => {
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

export const hasLifetime = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.LIFETIME;
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

    return subscription.External === External.Android || subscription.External === External.iOS;
};

export const hasVisionary = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VISIONARY);
export const hasVPN = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN);
export const hasVPN2024 = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN2024);
export const hasVPNPassBundle = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN_PASS_BUNDLE);
export const hasMail = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, MAIL);
export const hasMailPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, MAIL_PRO);
export const hasMailBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, MAIL_BUSINESS);
export const hasDrive = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, DRIVE);
export const hasDrivePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, DRIVE_PRO);
export const hasDriveBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, DRIVE_BUSINESS);
export const hasPass = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PASS);
export const hasWallet = (subscription: MaybeFreeSubscription) => hasSomeAddonOrPlan(subscription, WALLET);
export const hasEnterprise = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, ENTERPRISE);
export const hasBundle = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, BUNDLE);
export const hasBundlePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, BUNDLE_PRO);
export const hasBundlePro2024 = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, BUNDLE_PRO_2024);
export const hasFamily = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, FAMILY);
export const hasDuo = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, DUO);
export const hasVpnPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN_PRO);
export const hasVpnBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN_BUSINESS);
export const hasPassPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PASS_PRO);
export const hasPassBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PASS_BUSINESS);
export const hasFree = (subscription: MaybeFreeSubscription) => (subscription?.Plans || []).length === 0;

export const hasAnyBundlePro = (subscription: MaybeFreeSubscription) =>
    hasBundlePro(subscription) || hasBundlePro2024(subscription);

const hasAIAssistantCondition = [
    MEMBER_SCRIBE_MAILPLUS,
    MEMBER_SCRIBE_MAIL_BUSINESS,
    MEMBER_SCRIBE_DRIVEPLUS,
    MEMBER_SCRIBE_BUNDLE,
    MEMBER_SCRIBE_PASS,
    MEMBER_SCRIBE_VPN,
    MEMBER_SCRIBE_VPN2024,
    MEMBER_SCRIBE_VPN_PASS_BUNDLE,
    MEMBER_SCRIBE_MAIL_PRO,
    MEMBER_SCRIBE_BUNDLE_PRO,
    MEMBER_SCRIBE_BUNDLE_PRO_2024,
    MEMBER_SCRIBE_PASS_PRO,
    MEMBER_SCRIBE_VPN_BIZ,
    MEMBER_SCRIBE_PASS_BIZ,
    MEMBER_SCRIBE_VPN_PRO,
    MEMBER_SCRIBE_FAMILY,
    MEMBER_SCRIBE_DUO,
];
export const hasAIAssistant = (subscription: MaybeFreeSubscription) =>
    hasSomeAddonOrPlan(subscription, hasAIAssistantCondition);

export const PLANS_WITH_AI_INCLUDED = [VISIONARY];
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
                return PLANS.VPN;
            case APPS.PROTONWALLET:
                return PLANS.WALLET;
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

const b2bPlans: Set<PLANS | ADDON_NAMES> = new Set([
    MAIL_PRO,
    MAIL_BUSINESS,
    DRIVE_PRO,
    DRIVE_BUSINESS,
    BUNDLE_PRO,
    BUNDLE_PRO_2024,
    ENTERPRISE,
    VPN_PRO,
    VPN_BUSINESS,
    PASS_PRO,
    PASS_BUSINESS,
]);
export const getIsB2BAudienceFromPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }

    return b2bPlans.has(planName);
};

const canCheckItemPaidChecklistCondition: Set<PLANS | ADDON_NAMES> = new Set([MAIL, DRIVE, FAMILY, DUO, BUNDLE]);
export const canCheckItemPaidChecklist = (subscription: Subscription | undefined) => {
    return subscription?.Plans?.some(({ Name }) => canCheckItemPaidChecklistCondition.has(Name));
};

const canCheckItemGetStartedCondition: Set<PLANS | ADDON_NAMES> = new Set([
    VPN,
    VPN2024,
    WALLET,
    PASS,
    VPN_PASS_BUNDLE,
]);
export const canCheckItemGetStarted = (subscription: Subscription | undefined) => {
    return subscription?.Plans?.some(({ Name }) => canCheckItemGetStartedCondition.has(Name));
};

const getIsVpnB2BPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([VPN_PRO, VPN_BUSINESS]);
export const getIsVpnB2BPlan = (planName: PLANS | ADDON_NAMES) => getIsVpnB2BPlanCondition.has(planName);

const getIsVpnPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([VPN, VPN2024, VPN_PASS_BUNDLE, VPN_PRO, VPN_BUSINESS]);
export const getIsVpnPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return getIsVpnPlanCondition.has(planName);
};

const getIsConsumerVpnPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([VPN, VPN2024, VPN_PASS_BUNDLE]);
export const getIsConsumerVpnPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return getIsConsumerVpnPlanCondition.has(planName);
};

const getIsPassB2BPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([PASS_PRO, PASS_BUSINESS]);
export const getIsPassB2BPlan = (planName?: PLANS | ADDON_NAMES) => {
    if (!planName) {
        return false;
    }
    return getIsPassB2BPlanCondition.has(planName);
};

const getIsPassPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([PASS, VPN_PASS_BUNDLE, PASS_PRO, PASS_BUSINESS]);
export const getIsPassPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return getIsPassPlanCondition.has(planName);
};

const getIsConsumerPassPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([PASS, VPN_PASS_BUNDLE]);
export const getIsConsumerPassPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return getIsConsumerPassPlanCondition.has(planName);
};

const getCanAccessDuoPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([
    PLANS.MAIL,
    PLANS.DRIVE,
    PLANS.VPN,
    PLANS.BUNDLE,
    PLANS.MAIL_PRO,
    PLANS.VISIONARY,
    PLANS.MAIL_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
]);
export const getCanSubscriptionAccessDuoPlan = (subscription?: MaybeFreeSubscription) => {
    return hasFree(subscription) || subscription?.Plans?.some(({ Name }) => getCanAccessDuoPlanCondition.has(Name));
};

const getIsSentinelPlanCondition: Set<PLANS | ADDON_NAMES> = new Set([
    VISIONARY,
    BUNDLE,
    FAMILY,
    DUO,
    BUNDLE_PRO,
    BUNDLE_PRO_2024,
    PASS,
    VPN_PASS_BUNDLE,
    PASS_PRO,
    PASS_BUSINESS,
    MAIL_BUSINESS,
]);
export const getIsSentinelPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    if (!planName) {
        return false;
    }
    return getIsSentinelPlanCondition.has(planName);
};

export const getIsB2BAudienceFromSubscription = (subscription: Subscription | undefined) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsB2BAudienceFromPlan(Name));
};

export const getHasVpnB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasVpnPro(subscription) || hasVpnBusiness(subscription);
};

export const getHasSomeVpnPlan = (subscription: MaybeFreeSubscription) => {
    return (
        hasVPN(subscription) ||
        hasVPN2024(subscription) ||
        hasVPNPassBundle(subscription) ||
        hasVpnPro(subscription) ||
        hasVpnBusiness(subscription)
    );
};

export const getHasConsumerVpnPlan = (subscription: MaybeFreeSubscription) => {
    return hasVPN(subscription) || hasVPN2024(subscription) || hasVPNPassBundle(subscription);
};

export const getHasPassB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasPassPro(subscription) || hasPassBusiness(subscription);
};

const externalMemberB2BPlans: Set<PLANS | ADDON_NAMES> = new Set([
    VPN_PRO,
    VPN_BUSINESS,
    DRIVE_PRO,
    DRIVE_BUSINESS,
    PASS_PRO,
    PASS_BUSINESS,
]);
export const getHasExternalMemberCapableB2BPlan = (subscription: MaybeFreeSubscription) => {
    return subscription?.Plans?.some((plan) => externalMemberB2BPlans.has(plan.Name)) || false;
};

export const getHasMailB2BPlan = (subscription: MaybeFreeSubscription) => {
    return hasMailPro(subscription) || hasMailBusiness(subscription);
};

export const getPrimaryPlan = (subscription: Subscription | undefined) => {
    if (!subscription) {
        return;
    }

    return getPlan(subscription);
};

export const getBaseAmount = (
    name: PLANS | ADDON_NAMES,
    plansMap: PlansMap,
    subscription: Subscription | undefined,
    cycle = CYCLE.MONTHLY
) => {
    const base = plansMap[name];
    if (!base) {
        return 0;
    }
    return (subscription?.Plans || [])
        .filter(({ Name }) => Name === name)
        .reduce((acc) => {
            const pricePerCycle = base.Pricing[cycle] || 0;
            return acc + pricePerCycle;
        }, 0);
};

export const getPlanIDs = (subscription: MaybeFreeSubscription | null): PlanIDs => {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { Name, Quantity }) => {
        acc[Name] = (acc[Name] || 0) + Quantity;
        return acc;
    }, {});
};

export const isTrial = (subscription: Subscription | FreeSubscription | undefined, plan?: PLANS): boolean => {
    if (isFreeSubscription(subscription)) {
        return false;
    }

    const isTrialV4 =
        subscription?.CouponCode === COUPON_CODES.REFERRAL ||
        subscription?.CouponCode === COUPON_CODES.MEMBER_DOWNGRADE_TRIAL;
    const isTrialV5 = !!subscription?.IsTrial;
    const trial = isTrialV4 || isTrialV5;

    if (!plan) {
        return trial;
    }

    return trial && getPlanName(subscription) === plan;
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

const blackFridayDiscountCoupons: Set<string> = new Set([
    COUPON_CODES.BLACK_FRIDAY_2022,
    COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
    COUPON_CODES.VPN_BLACK_FRIDAY_2022,
]);
export const hasBlackFridayDiscount = (subscription: Subscription | undefined) => {
    if (!subscription || !subscription.CouponCode) {
        return false;
    }
    return blackFridayDiscountCoupons.has(subscription.CouponCode);
};

const endOfYearDiscountCoupons: Set<string> = new Set([
    COUPON_CODES.END_OF_YEAR_2023,
    COUPON_CODES.BLACK_FRIDAY_2023,
    COUPON_CODES.EOY_2023_1M_INTRO,
]);
export const getHas2023OfferCoupon = (coupon: string | undefined | null): boolean => {
    if (!coupon) {
        return false;
    }
    return endOfYearDiscountCoupons.has(coupon);
};

export const hasVPNBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.VPN_BLACK_FRIDAY_2022;
};

export const hasMailBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.MAIL_BLACK_FRIDAY_2022;
};

export const allCycles = Object.freeze(
    Object.values(CYCLE)
        .filter((cycle): cycle is CYCLE => typeof cycle === 'number')
        .sort((a, b) => a - b)
);
export const regularCycles = Object.freeze([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]);
export const customCycles = Object.freeze(allCycles.filter((cycle) => !regularCycles.includes(cycle)));

export const getValidCycle = (cycle: number): CYCLE | undefined => {
    return allCycles.includes(cycle) ? cycle : undefined;
};

const getValidAudienceCondition = [Audience.B2B, Audience.B2C, Audience.FAMILY];
export const getValidAudience = (audience: string | undefined | null): Audience | undefined => {
    return getValidAudienceCondition.find((realAudience) => realAudience === audience);
};

export const getIsCustomCycle = (subscription?: Subscription) => {
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

export const hasYearly = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.YEARLY;
};

export const hasMonthly = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.MONTHLY;
};

export const hasTwoYears = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.TWO_YEARS;
};

export const hasFifteen = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.FIFTEEN;
};

export const hasThirty = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.THIRTY;
};

export interface PricingForCycles {
    [CYCLE.MONTHLY]: number;
    [CYCLE.THREE]: number;
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

function isMultiUserPersonalPlan(plan: Plan) {
    // even though Duo, Family and Visionary plans can have up to 6 users in the org,
    // for the price displaying purposes we count it as 1 member.
    return plan.Name === PLANS.DUO || plan.Name === PLANS.FAMILY || plan.Name === PLANS.VISIONARY;
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

export const INCLUDED_IP_PRICING = {
    [CYCLE.MONTHLY]: 4999,
    [CYCLE.YEARLY]: 3999 * CYCLE.YEARLY,
    [CYCLE.TWO_YEARS]: 3599 * CYCLE.TWO_YEARS,
};

function getIpPrice(cycle: CYCLE): number {
    if (cycle === CYCLE.MONTHLY) {
        return INCLUDED_IP_PRICING[CYCLE.MONTHLY];
    }

    if (cycle === CYCLE.YEARLY) {
        return INCLUDED_IP_PRICING[CYCLE.YEARLY];
    }

    if (cycle === CYCLE.TWO_YEARS) {
        return INCLUDED_IP_PRICING[CYCLE.TWO_YEARS];
    }

    return 0;
}

export function getIpPricePerMonth(cycle: CYCLE): number {
    return getIpPrice(cycle) / cycle;
}

/**
 * The purpose of this overridden price is to show a coupon discount in the cycle selector. If that would be supported
 * this would not be needed.
 */
export const getPricePerCycle = (plan: Plan | undefined, cycle: CYCLE) => {
    return plan?.Pricing?.[cycle];
};

export function getPricePerMember(plan: Plan, cycle: CYCLE): number {
    const totalPrice = getPricePerCycle(plan, cycle) || 0;

    if (plan.Name === PLANS.VPN_BUSINESS) {
        // For VPN business, we exclude IP price from calculation. And we also divide by 2,
        // because it has 2 members by default too.
        const IP_PRICE = getIpPrice(cycle);
        return (totalPrice - IP_PRICE) / (plan.MaxMembers || 1);
    }

    if (isMultiUserPersonalPlan(plan)) {
        return totalPrice;
    }

    // Some plans have 0 MaxMembers. That's because they don't have access to mail.
    // In reality, they still get 1 member.
    return totalPrice / (plan.MaxMembers || 1);
}

export function getPricingPerMember(plan: Plan): Pricing {
    return allCycles.reduce((acc, cycle) => {
        acc[cycle] = getPricePerMember(plan, cycle);

        // If the plan doesn't have custom cycles, we need to remove it from the resulting Pricing object
        const isNonDefinedCycle = acc[cycle] === undefined || acc[cycle] === null || acc[cycle] === 0;
        if (customCycles.includes(cycle) && isNonDefinedCycle) {
            delete acc[cycle];
        }

        return acc;
    }, {} as Pricing);
}

interface OfferResult {
    pricing: Pricing;
    cycles: CYCLE[];
    valid: boolean;
}

export const getPlanOffer = (plan: Plan) => {
    const result = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].reduce<OfferResult>(
        (acc, cycle) => {
            acc.pricing[cycle] = (plan.DefaultPricing?.[cycle] ?? 0) - (getPricePerCycle(plan, cycle) ?? 0);
            return acc;
        },
        {
            valid: false,
            cycles: [],
            pricing: {
                [CYCLE.MONTHLY]: 0,
                [CYCLE.YEARLY]: 0,
                [CYCLE.THREE]: 0,
                [CYCLE.TWO_YEARS]: 0,
                [CYCLE.FIFTEEN]: 0,
                [CYCLE.EIGHTEEN]: 0,
                [CYCLE.THIRTY]: 0,
            },
        }
    );
    const sortedResults = (Object.entries(result.pricing) as unknown as [CYCLE, number][]).sort((a, b) => b[1] - a[1]);
    result.cycles = sortedResults.map(([cycle]) => cycle);
    if (sortedResults[0][1] > 0) {
        result.valid = true;
    }
    return result;
};

/**
 * Currently there is no convenient way to get the number of IPs for a VPN subscription.
 * There is no dedicated field for that in the API.
 * That's a hack that counts the number of IP addons.
 */
export const getVPNDedicatedIPs = (subscription: Subscription | undefined) => {
    const planName = getPlanName(subscription, PLAN_SERVICES.VPN);

    // If you have other VPN plans, they don't have dedicated IPs
    if (!planName) {
        return 0;
    }

    // Some plans might have included IPs without any indication on the backend.
    // For example, 1 IP is included in the Business plan
    const includedIPs = IPS_INCLUDED_IN_PLAN[planName] || 0;

    return (subscription as Subscription).Plans.reduce(
        (acc, { Name: addonOrPlanName, Quantity }) => acc + (isIpAddon(addonOrPlanName) ? Quantity : 0),
        includedIPs
    );
};

export const getHasCoupon = (subscription: Subscription | undefined, coupon: string) => {
    return [subscription?.CouponCode, subscription?.UpcomingSubscription?.CouponCode].includes(coupon);
};

/**
 * Checks if subscription can be cancelled by a user. Cancellation means that the user will be downgraded at the end
 * of the current billing cycle. In contrast, "Downgrade subscription" button means that the user will be downgraded
 * immediately. Note that B2B subscriptions also have "Cancel subscription" button, but it behaves differently, so
 * we don't consider B2B subscriptions cancellable for the purpose of this function.
 */
export const hasCancellablePlan = (subscription: Subscription | undefined, user: UserModel) => {
    // These plans are can be cancelled inhouse too
    const cancellablePlan = getHasConsumerVpnPlan(subscription) || hasPass(subscription);

    // In Chargebee, all plans are cancellable
    const chargebeeForced = onSessionMigrationChargebeeStatus(user, subscription) === ChargebeeEnabled.CHARGEBEE_FORCED;

    // Splitted users should go to PUT v4 renew because they still have an active subscription in inhouse system
    // And we force them to do the renew cancellation instead of subscription deletion because this case is much
    // simpler to handle
    const splittedUser = isSplittedUser(user.ChargebeeUser, user.ChargebeeUserExists, subscription?.BillingPlatform);

    return cancellablePlan || chargebeeForced || splittedUser;
};

export function hasMaximumCycle(subscription?: SubscriptionModel | FreeSubscription): boolean {
    return (
        subscription?.Cycle === CYCLE.TWO_YEARS ||
        subscription?.Cycle === CYCLE.THIRTY ||
        subscription?.UpcomingSubscription?.Cycle === CYCLE.TWO_YEARS ||
        subscription?.UpcomingSubscription?.Cycle === CYCLE.THIRTY
    );
}
