import { addWeeks, fromUnixTime, isBefore } from 'date-fns';

import {
    ADDON_NAMES,
    APPS,
    APP_NAMES,
    COUPON_CODES,
    CYCLE,
    IPS_INCLUDED_IN_PLAN,
    MEMBER_ADDON_PREFIX,
    PLANS,
    PLAN_SERVICES,
    PLAN_TYPES,
} from '../constants';
import { External, Plan, PlanIDs, PlansMap, Pricing, Subscription } from '../interfaces';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;
const {
    PLUS,
    VPNPLUS,
    VPNBASIC,
    PROFESSIONAL,
    VISIONARY,
    NEW_VISIONARY,
    MAIL,
    MAIL_PRO,
    DRIVE,
    DRIVE_PRO,
    PASS_PLUS,
    VPN,
    ENTERPRISE,
    BUNDLE,
    BUNDLE_PRO,
    FAMILY,
    VPN_PRO,
    VPN_BUSINESS,
} = PLANS;

export const getPlan = (subscription: Subscription | undefined, service?: PLAN_SERVICES) => {
    const result = (subscription?.Plans || []).find(
        ({ Services, Type }) => Type === PLAN && (service === undefined ? true : hasBit(Services, service))
    );
    if (result) {
        return result as Plan & { Name: PLANS };
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

export const hasSomePlan = (subscription: Subscription | undefined, planName: PLANS) => {
    return (subscription?.Plans || []).some(({ Name }) => Name === planName);
};

export const hasLifetime = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.LIFETIME;
};

export const hasMigrationDiscount = (subscription: Subscription) => {
    return subscription?.CouponCode?.startsWith('MIGRATION');
};

export const isManagedExternally = (
    subscription: Subscription | Pick<Subscription, 'External'> | undefined | null
): boolean => {
    if (!subscription) {
        return false;
    }

    return subscription.External === External.Android || subscription.External === External.iOS;
};

export const hasVisionary = (subscription: Subscription | undefined) => hasSomePlan(subscription, VISIONARY);
export const hasNewVisionary = (subscription: Subscription | undefined) => hasSomePlan(subscription, NEW_VISIONARY);
export const hasVPN = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPN);
export const hasMail = (subscription: Subscription | undefined) => hasSomePlan(subscription, MAIL);
export const hasMailPro = (subscription: Subscription | undefined) => hasSomePlan(subscription, MAIL_PRO);
export const hasDrive = (subscription: Subscription | undefined) => hasSomePlan(subscription, DRIVE);
export const hasDrivePro = (subscription: Subscription | undefined) => hasSomePlan(subscription, DRIVE_PRO);
export const hasPassPlus = (subscription: Subscription | undefined) => hasSomePlan(subscription, PASS_PLUS);
export const hasEnterprise = (subscription: Subscription | undefined) => hasSomePlan(subscription, ENTERPRISE);
export const hasBundle = (subscription: Subscription | undefined) => hasSomePlan(subscription, BUNDLE);
export const hasBundlePro = (subscription: Subscription | undefined) => hasSomePlan(subscription, BUNDLE_PRO);
export const hasMailPlus = (subscription: Subscription | undefined) => hasSomePlan(subscription, PLUS);
export const hasMailProfessional = (subscription: Subscription | undefined) => hasSomePlan(subscription, PROFESSIONAL);
export const hasVpnBasic = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPNBASIC);
export const hasVpnPlus = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPNPLUS);
export const hasFamily = (subscription: Subscription | undefined) => hasSomePlan(subscription, FAMILY);
export const hasVpnPro = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPN_PRO);
export const hasVpnBusiness = (subscription: Subscription | undefined) => hasSomePlan(subscription, VPN_BUSINESS);
export const hasFree = (subscription: Subscription | undefined) => (subscription?.Plans || []).length === 0;

export const getUpgradedPlan = (subscription: Subscription | undefined, app: APP_NAMES) => {
    if (hasFree(subscription)) {
        switch (app) {
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

export const getIsB2BPlan = (planName: PLANS | ADDON_NAMES) => {
    return [MAIL_PRO, DRIVE_PRO, BUNDLE_PRO, ENTERPRISE, VPN_PRO, VPN_BUSINESS].includes(planName as any);
};

export const getIsLegacyPlan = (planName: PLANS | ADDON_NAMES) => {
    return [VPNBASIC, VPNPLUS, PLUS, PROFESSIONAL, VISIONARY].includes(planName as any);
};

export const getHasB2BPlan = (subscription: Subscription | undefined) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsB2BPlan(Name));
};

export const getHasVpnB2BPlan = (subscription: Subscription | undefined) => {
    return hasVpnPro(subscription) || hasVpnBusiness(subscription);
};

export const getHasLegacyPlans = (subscription: Subscription | undefined) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsLegacyPlan(Name));
};

export const getPrimaryPlan = (subscription: Subscription | undefined, app: APP_NAMES) => {
    if (!subscription) {
        return;
    }
    if (getHasLegacyPlans(subscription)) {
        const mailPlan = getPlan(subscription, PLAN_SERVICES.MAIL);
        const vpnPlan = getPlan(subscription, PLAN_SERVICES.VPN);

        if (app === APPS.PROTONVPN_SETTINGS) {
            return vpnPlan || mailPlan;
        }

        return mailPlan || vpnPlan;
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

export const getPlanIDs = (subscription: Subscription | undefined | null): PlanIDs => {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { Name, Quantity }) => {
        acc[Name] = (acc[Name] || 0) + Quantity;
        return acc;
    }, {});
};

export const isTrial = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.REFERRAL;
};

export const isTrialExpired = (subscription: Subscription | undefined) => {
    const now = new Date();
    return now > fromUnixTime(subscription?.PeriodEnd || 0);
};

export const willTrialExpire = (subscription: Subscription | undefined) => {
    const now = new Date();
    return isBefore(fromUnixTime(subscription?.PeriodEnd || 0), addWeeks(now, 1));
};

export const hasBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return [
        COUPON_CODES.BLACK_FRIDAY_2022,
        COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
        COUPON_CODES.VPN_BLACK_FRIDAY_2022,
    ].includes(subscription?.CouponCode as COUPON_CODES);
};

export const hasVPNBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.VPN_BLACK_FRIDAY_2022;
};

export const hasMailBlackFridayDiscount = (subscription: Subscription | undefined) => {
    return subscription?.CouponCode === COUPON_CODES.MAIL_BLACK_FRIDAY_2022;
};

export const allCycles = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS, CYCLE.FIFTEEN, CYCLE.THIRTY];
export const customCycles = [CYCLE.FIFTEEN, CYCLE.THIRTY];

export const getValidCycle = (cycle: number): CYCLE | undefined => {
    return allCycles.includes(cycle) ? cycle : undefined;
};

export function getNormalCycleFromCustomCycle(cycle: CYCLE): CYCLE;

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

export const hasYearly = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.YEARLY;
};

export const hasMonthly = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.MONTHLY;
};

export const hasTwoYears = (subscription?: Subscription) => {
    return subscription?.Cycle === CYCLE.TWO_YEARS;
};

interface PricingForCycles {
    [CYCLE.MONTHLY]: number;
    [CYCLE.YEARLY]: number;
    [CYCLE.TWO_YEARS]: number;
    [CYCLE.FIFTEEN]: number;
    [CYCLE.THIRTY]: number;
}

export interface AggregatedPricing {
    all: PricingForCycles;
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

function getPlanMembers(plan: Plan, quantity: number): number {
    const hasMembers =
        plan.Type === PLAN_TYPES.PLAN || (plan.Type === PLAN_TYPES.ADDON && plan.Name.startsWith(MEMBER_ADDON_PREFIX));

    let membersNumberInPlan = 0;
    // even though Family plan can have up to 6 users in the org, for the price displaying purposes we count it as
    // 1 member.
    if (plan.Name === PLANS.FAMILY) {
        membersNumberInPlan = 1;
    } else if (hasMembers) {
        membersNumberInPlan = plan.MaxMembers || 1;
    }

    return membersNumberInPlan * quantity;
}

export const INCLUDED_IP_PRICING_PER_MONTH: Pricing = {
    [CYCLE.MONTHLY]: 4999,
    [CYCLE.YEARLY]: 3999 * CYCLE.YEARLY,
    [CYCLE.TWO_YEARS]: 3599 * CYCLE.TWO_YEARS,
};

function getIpPrice(cycle: CYCLE): number {
    if (cycle === CYCLE.MONTHLY) {
        return INCLUDED_IP_PRICING_PER_MONTH[CYCLE.MONTHLY];
    }

    if (cycle === CYCLE.YEARLY) {
        return INCLUDED_IP_PRICING_PER_MONTH[CYCLE.YEARLY];
    }

    if (cycle === CYCLE.TWO_YEARS) {
        return INCLUDED_IP_PRICING_PER_MONTH[CYCLE.TWO_YEARS];
    }

    return 0;
}

function getPricePerMember(plan: Plan, cycle: CYCLE): number {
    const totalPrice = plan.Pricing[cycle] || 0;

    if (plan.Name === PLANS.VPN_PRO) {
        // Because VPN Pro has 2 members by default.
        return totalPrice / 2;
    }

    if (plan.Name === PLANS.VPN_BUSINESS) {
        // For VPN business, we exclude IP price from calculation. And we also divide by 2,
        // because it has 2 members by default too.
        const IP_PRICE = getIpPrice(cycle);
        return (totalPrice - IP_PRICE) / 2;
    }

    return totalPrice;
}

export const getPricingFromPlanIDs = (planIDs: PlanIDs, plansMap: PlansMap): AggregatedPricing => {
    const initial = {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
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
                const price = plan.Pricing[cycle];
                if (price) {
                    target[cycle] += quantity * price;
                }
            };

            const addMembersPricing = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getPricePerMember(plan, cycle);
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

            return acc;
        },
        {
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
    const totalNoDiscount = pricing.all[CYCLE.MONTHLY] * cycle;
    const discount = cycle === CYCLE.MONTHLY ? 0 : totalNoDiscount - total;
    const perUserPerMonth = Math.floor(pricing.members[cycle] / cycle / pricing.membersNumber);

    return {
        discount,
        discountPercentage: Math.round((discount / totalNoDiscount) * 100),
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
            acc.pricing[cycle] = (plan.DefaultPricing?.[cycle] ?? 0) - (plan.Pricing?.[cycle] ?? 0);
            return acc;
        },
        {
            valid: false,
            cycles: [],
            pricing: {
                [CYCLE.MONTHLY]: 0,
                [CYCLE.YEARLY]: 0,
                [CYCLE.TWO_YEARS]: 0,
                [CYCLE.FIFTEEN]: 0,
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
 * Currently there is no convinent way to get the number of IPs for a VPN subscription.
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
