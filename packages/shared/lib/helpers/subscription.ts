import { addWeeks, fromUnixTime, isBefore } from 'date-fns';

import { ProductParam } from '@proton/shared/lib/apps/product';
import { getSupportedAddons } from '@proton/shared/lib/helpers/planIDs';

import {
    ADDON_NAMES,
    APPS,
    COUPON_CODES,
    CYCLE,
    FreeSubscription,
    IPS_INCLUDED_IN_PLAN,
    MEMBER_ADDON_PREFIX,
    PLANS,
    PLAN_SERVICES,
    PLAN_TYPES,
    isFreeSubscription,
} from '../constants';
import {
    Audience,
    Cycle,
    External,
    Organization,
    Plan,
    PlanIDs,
    PlansMap,
    PriceType,
    Pricing,
    Subscription,
    SubscriptionModel,
    SubscriptionPlan,
} from '../interfaces';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;
const {
    NEW_VISIONARY,
    MAIL,
    MAIL_PRO,
    DRIVE,
    DRIVE_PRO,
    PASS_PLUS,
    VPN,
    VPN2024,
    VPN_PASS_BUNDLE,
    ENTERPRISE,
    BUNDLE,
    BUNDLE_PRO,
    FAMILY,
    VPN_PRO,
    VPN_BUSINESS,
    PASS_PRO,
    PASS_BUSINESS,
} = PLANS;

type MaybeFreeSubscription = Subscription | FreeSubscription | undefined;

export const getPlan = (subscription: Subscription | undefined, service?: PLAN_SERVICES) => {
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

export const getPlanName = (subscription: Subscription | undefined, service: PLAN_SERVICES) => {
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

export const hasNewVisionary = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, NEW_VISIONARY);
export const hasVPN = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN);
export const hasVPN2024 = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN2024);
export const hasVPNPassBundle = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN_PASS_BUNDLE);
export const hasMail = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, MAIL);
export const hasMailPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, MAIL_PRO);
export const hasDrive = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, DRIVE);
export const hasDrivePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, DRIVE_PRO);
export const hasPassPlus = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PASS_PLUS);
export const hasEnterprise = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, ENTERPRISE);
export const hasBundle = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, BUNDLE);
export const hasBundlePro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, BUNDLE_PRO);
export const hasFamily = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, FAMILY);
export const hasVpnPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN_PRO);
export const hasVpnBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, VPN_BUSINESS);
export const hasPassPro = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PASS_PRO);
export const hasPassBusiness = (subscription: MaybeFreeSubscription) => hasSomePlan(subscription, PASS_BUSINESS);
export const hasFree = (subscription: MaybeFreeSubscription) => (subscription?.Plans || []).length === 0;

export const getUpgradedPlan = (subscription: Subscription | undefined, app: ProductParam) => {
    if (hasFree(subscription)) {
        switch (app) {
            case APPS.PROTONPASS:
                return PLANS.PASS_PLUS;
            case APPS.PROTONDRIVE:
                return PLANS.DRIVE;
            case APPS.PROTONVPN_SETTINGS:
                return PLANS.VPN;
            default:
            case APPS.PROTONMAIL:
                return PLANS.MAIL;
        }
    }
    if (hasBundle(subscription) || hasBundlePro(subscription)) {
        return PLANS.BUNDLE_PRO;
    }
    return PLANS.BUNDLE;
};

export const getIsB2BAudienceFromPlan = (planName: PLANS | ADDON_NAMES) => {
    return [MAIL_PRO, DRIVE_PRO, BUNDLE_PRO, ENTERPRISE, VPN_PRO, VPN_BUSINESS, PASS_PRO, PASS_BUSINESS].includes(
        planName as any
    );
};

export const canCheckItemPaidChecklist = (subscription: Subscription | undefined) => {
    return subscription?.Plans?.some(({ Name }) => [MAIL, DRIVE, FAMILY, BUNDLE].includes(Name as any));
};

export const canCheckItemGetStarted = (subscription: Subscription | undefined) => {
    return subscription?.Plans?.some(({ Name }) => [VPN, PASS_PLUS, VPN_PASS_BUNDLE].includes(Name as any));
};

export const getIsVpnB2BPlan = (planName: PLANS | ADDON_NAMES) => {
    return [VPN_PRO, VPN_BUSINESS].includes(planName as any);
};

export const getIsPassB2BPlan = (planName?: PLANS | ADDON_NAMES) => {
    return [PASS_PRO, PASS_BUSINESS].includes(planName as any);
};

export const getIsVpnPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    return [VPN, VPN2024, VPN_PASS_BUNDLE, VPN_PRO, VPN_BUSINESS].includes(planName as any);
};

export const getIsConsumerVpnPlan = (planName: PLANS | ADDON_NAMES | undefined) => {
    return [VPN, VPN2024, VPN_PASS_BUNDLE].includes(planName as any);
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

export const getHasVpnOrPassB2BPlan = (subscription: MaybeFreeSubscription) => {
    return getHasVpnB2BPlan(subscription) || getHasPassB2BPlan(subscription);
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

export function getPlanFromIds(planIDs: PlanIDs): PLANS {
    return Object.values(PLANS).find((key) => {
        // If the planIDs object has non-zero value for the plan, then it exists.
        // There can be at most 1 plan, and others are addons.
        const planNumber = planIDs[key as PLANS] ?? 0;
        return planNumber > 0;
    }) as PLANS;
}

export const isTrial = (subscription: Subscription | undefined) => {
    const isTrialV4 =
        subscription?.CouponCode === COUPON_CODES.REFERRAL ||
        subscription?.CouponCode === COUPON_CODES.MEMBER_DOWNGRADE_TRIAL;
    const isTrialV5 = !!subscription?.IsTrial;
    return isTrialV4 || isTrialV5;
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
    return (
        (organization?.MaxMembers || 0) > 1 ||
        Object.keys(supportedAddons).some((key) => key.startsWith(MEMBER_ADDON_PREFIX))
    );
};

export const hasBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return [
        COUPON_CODES.BLACK_FRIDAY_2022,
        COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
        COUPON_CODES.VPN_BLACK_FRIDAY_2022,
    ].includes(subscription?.CouponCode as COUPON_CODES);
};

export const getHas2023OfferCoupon = (coupon: string | undefined | null): boolean => {
    return [COUPON_CODES.END_OF_YEAR_2023, COUPON_CODES.BLACK_FRIDAY_2023, COUPON_CODES.EOY_2023_1M_INTRO].includes(
        coupon as any
    );
};

export const hasVPNBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.VPN_BLACK_FRIDAY_2022;
};

export const hasMailBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.MAIL_BLACK_FRIDAY_2022;
};

export const allCycles = [
    CYCLE.MONTHLY,
    CYCLE.THREE,
    CYCLE.YEARLY,
    CYCLE.TWO_YEARS,
    CYCLE.FIFTEEN,
    CYCLE.EIGHTEEN,
    CYCLE.THIRTY,
];
export const customCycles = [CYCLE.THREE, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.THIRTY];
export const regularCycles = allCycles.filter((cycle) => !customCycles.includes(cycle));

export const getValidCycle = (cycle: number): CYCLE | undefined => {
    return allCycles.includes(cycle) ? cycle : undefined;
};

export const getValidAudience = (audience: string | undefined | null): Audience | undefined => {
    return [Audience.B2B, Audience.B2C, Audience.FAMILY].find((realAudience) => audience === realAudience);
};

export const getIsCustomCycle = (subscription?: Subscription) => {
    return customCycles.includes(subscription?.Cycle as any);
};

export const getDowngradedVpn2024Cycle = (cycle: Cycle): CYCLE => {
    if (cycle === CYCLE.MONTHLY || cycle === CYCLE.THREE || cycle === CYCLE.YEARLY) {
        return cycle;
    }
    // 15,24,30 all renew at yearly.
    return CYCLE.YEARLY;
};

export function getNormalCycleFromCustomCycle(cycle: CYCLE): CYCLE;
export function getNormalCycleFromCustomCycle(cycle: undefined): undefined;
export function getNormalCycleFromCustomCycle(cycle: CYCLE | undefined): CYCLE | undefined;
export function getNormalCycleFromCustomCycle(cycle: CYCLE | undefined): CYCLE | undefined {
    if (!cycle) {
        return undefined;
    }
    if (cycle === CYCLE.FIFTEEN) {
        return CYCLE.YEARLY;
    }
    if (cycle === CYCLE.THIRTY) {
        return CYCLE.TWO_YEARS;
    }
    return cycle;
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

interface PricingForCycles {
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
    // even though Family and Visionary plans can have up to 6 users in the org,
    // for the price displaying purposes we count it as 1 member.
    return plan.Name === PLANS.FAMILY || plan.Name === PLANS.NEW_VISIONARY;
}

function getPlanMembers(plan: Plan, quantity: number): number {
    const hasMembers =
        plan.Type === PLAN_TYPES.PLAN || (plan.Type === PLAN_TYPES.ADDON && plan.Name.startsWith(MEMBER_ADDON_PREFIX));

    let membersNumberInPlan = 0;
    if (isMultiUserPersonalPlan(plan)) {
        membersNumberInPlan = 1;
    } else if (hasMembers) {
        membersNumberInPlan = plan.MaxMembers || 1;
    }

    return membersNumberInPlan * quantity;
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
export const getOverriddenPricePerCycle = (plan: Plan | undefined, cycle: CYCLE, type?: PriceType) => {
    if (type === PriceType.default) {
        return plan?.Pricing?.[cycle];
    }
    if (plan?.Name === PLANS.VPN2024) {
        if (cycle === CYCLE.YEARLY) {
            return 5988;
        }
        if (cycle === CYCLE.TWO_YEARS) {
            return 10776;
        }
    }

    return plan?.Pricing?.[cycle];
};

export function getPricePerMember(plan: Plan, cycle: CYCLE, priceType?: PriceType): number {
    const totalPrice = getOverriddenPricePerCycle(plan, cycle, priceType) || 0;

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

export function getPricingPerMember(plan: Plan, priceType?: PriceType): Pricing {
    return allCycles.reduce((acc, cycle) => {
        acc[cycle] = getPricePerMember(plan, cycle, priceType);

        // If the plan doesn't have custom cycles, we need to remove it from the resulting Pricing object
        const isNonDefinedCycle = acc[cycle] === undefined || acc[cycle] === null || acc[cycle] === 0;
        if (customCycles.includes(cycle) && isNonDefinedCycle) {
            delete acc[cycle];
        }

        return acc;
    }, {} as Pricing);
}

export const getPricingFromPlanIDs = (
    planIDs: PlanIDs,
    plansMap: PlansMap,
    priceType?: PriceType
): AggregatedPricing => {
    const initial = {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.THREE]: 0,
        [CYCLE.EIGHTEEN]: 0,
        [CYCLE.TWO_YEARS]: 0,
        [CYCLE.FIFTEEN]: 0,
        [CYCLE.THIRTY]: 0,
    };

    return Object.entries(planIDs).reduce<AggregatedPricing>(
        (acc, [planName, quantity]) => {
            const plan = plansMap[planName as keyof PlansMap];
            if (!plan) {
                return acc;
            }

            const members = getPlanMembers(plan, quantity);
            acc.membersNumber += members;

            const add = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getOverriddenPricePerCycle(plan, cycle, priceType);
                if (price) {
                    target[cycle] += quantity * price;
                }
            };

            const addMembersPricing = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getPricePerMember(plan, cycle, priceType);
                if (price) {
                    target[cycle] += members * price;
                }
            };

            allCycles.forEach((cycle) => {
                add(acc.all, cycle);
            });

            if (members !== 0) {
                allCycles.forEach((cycle) => {
                    addMembersPricing(acc.members, cycle);
                });
            }

            if (plan.Type === PLAN_TYPES.PLAN) {
                allCycles.forEach((cycle) => {
                    add(acc.plans, cycle);
                });
            }

            const defaultMonthly = plan.DefaultPricing?.[CYCLE.MONTHLY] ?? 0;
            const monthly = getOverriddenPricePerCycle(plan, CYCLE.MONTHLY, priceType) ?? 0;

            // Offers might affect Pricing both ways, increase and decrease.
            // So if the Pricing increases, then we don't want to use the lower DefaultPricing as basis
            // for discount calculations
            const price = Math.max(defaultMonthly, monthly);

            acc.defaultMonthlyPrice += quantity * price;

            return acc;
        },
        {
            defaultMonthlyPrice: 0,
            all: { ...initial },
            members: {
                ...initial,
            },
            plans: {
                ...initial,
            },
            membersNumber: 0,
        }
    );
};

export interface TotalPricing {
    discount: number;
    total: number;
    totalPerMonth: number;
    totalNoDiscountPerMonth: number;
    discountPercentage: number;
    perUserPerMonth: number;
}

export const getTotalFromPricing = (pricing: AggregatedPricing, cycle: CYCLE): TotalPricing => {
    const total = pricing.all[cycle];
    const totalPerMonth = pricing.all[cycle] / cycle;
    const totalNoDiscount = pricing.defaultMonthlyPrice * cycle;
    const discount = cycle === CYCLE.MONTHLY ? 0 : totalNoDiscount - total;
    const perUserPerMonth = Math.floor(pricing.members[cycle] / cycle / pricing.membersNumber);

    return {
        discount,
        discountPercentage: discount > 0 ? Math.round((discount / totalNoDiscount) * 100) : 0,
        total,
        totalPerMonth,
        totalNoDiscountPerMonth: totalNoDiscount / cycle,
        perUserPerMonth,
    };
};

interface OfferResult {
    pricing: Pricing;
    cycles: CYCLE[];
    valid: boolean;
}

export const getPlanOffer = (plan: Plan) => {
    const result = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].reduce<OfferResult>(
        (acc, cycle) => {
            acc.pricing[cycle] = (plan.DefaultPricing?.[cycle] ?? 0) - (getOverriddenPricePerCycle(plan, cycle) ?? 0);
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

    return (subscription as Subscription).Plans.reduce(
        (acc, { Name, Quantity }) => acc + (Name.startsWith('1ip') ? Quantity : 0),
        IPS_INCLUDED_IN_PLAN[planName] || 0 // 1 IP is included in the Business plan
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
export const hasCancellablePlan = (subscription: Subscription | undefined) => {
    return getHasConsumerVpnPlan(subscription) || hasPassPlus(subscription);
};

export function hasMaximumCycle(subscription?: SubscriptionModel | FreeSubscription): boolean {
    return (
        subscription?.Cycle === CYCLE.TWO_YEARS ||
        subscription?.Cycle === CYCLE.THIRTY ||
        subscription?.UpcomingSubscription?.Cycle === CYCLE.TWO_YEARS ||
        subscription?.UpcomingSubscription?.Cycle === CYCLE.THIRTY
    );
}

export function getPlanNameFromIDs(planIDs: PlanIDs): PLANS | undefined {
    const availableKeys = Object.keys(planIDs);
    return Object.values(PLANS).find((value) => availableKeys.includes(value));
}
