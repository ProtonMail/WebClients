import { c, msgid } from 'ttag';

import { getVpnConnections, getVpnServers } from '@proton/shared/lib/vpn/features';

import { ADDON_NAMES, COUPON_CODES, CYCLE, DEFAULT_CYCLE, MEMBER_PLAN_MAPPING, PLANS, PLAN_TYPES } from '../constants';
import { Plan, PlanIDs, PlansMap, Subscription, SubscriptionCheckResponse, VPNServers } from '../interfaces';
import { FREE_PLAN } from '../subscription/freePlans';
import humanSize from './humanSize';
import { customCycles, getNormalCycleFromCustomCycle } from './subscription';

export const getDiscountText = () => {
    return c('Info')
        .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`;
};

export const getUserTitle = (users: number) => {
    return c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users);
};

const getAddonQuantity = (addon: Plan, quantity: number) => {
    if (addon.Name.startsWith('1domain')) {
        return quantity * (addon.MaxDomains || 0);
    }
    if (addon.Name.startsWith('1member')) {
        return quantity * (addon.MaxMembers || 0);
    }
    return 0;
};

export const getAddonTitle = (addonName: ADDON_NAMES, quantity: number) => {
    if (addonName.startsWith('1domain')) {
        const domains = quantity;
        return c('Addon').ngettext(msgid`+ ${domains} custom domain`, `+ ${domains} custom domains`, domains);
    }
    if (addonName.startsWith('1member')) {
        const users = quantity;
        return c('Addon').ngettext(msgid`+ ${users} user`, `+ ${users} users`, users);
    }
    return '';
};

interface SubscriptionCheckoutData {
    planName: PLANS | null;
    planTitle: string;
    usersTitle: string;
    users: number;
    addons: { name: ADDON_NAMES; title: string; quantity: number }[];
    withDiscountPerCycle: number;
    withDiscountPerMonth: number;
    discountPerCycle: number;
    discountPercent: number;
}

export type RequiredCheckResponse = Pick<
    SubscriptionCheckResponse,
    'Amount' | 'AmountDue' | 'Cycle' | 'CouponDiscount' | 'Proration' | 'Credit' | 'Coupon' | 'Gift'
>;

export const getCheckout = ({
    planIDs,
    plansMap,
    checkResult,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult?: RequiredCheckResponse;
}): SubscriptionCheckoutData => {
    const result = Object.entries(planIDs).reduce<
        Pick<SubscriptionCheckoutData, 'planName' | 'planTitle'> & {
            users: number;
            addons: { name: ADDON_NAMES; quantity: number }[];
        }
    >(
        (acc, [planName, quantity]) => {
            const plan = plansMap[planName as keyof typeof plansMap];
            if (!plan) {
                return acc;
            }
            if (plan.Type === PLAN_TYPES.PLAN) {
                acc.planName = plan.Name as PLANS;
                acc.planTitle = plan.Title;
                acc.users += plan.MaxMembers;
            }
            if (plan.Type === PLAN_TYPES.ADDON) {
                const memberMapping = MEMBER_PLAN_MAPPING[plan.Name as keyof typeof MEMBER_PLAN_MAPPING];
                const totalQuantity = getAddonQuantity(plan, quantity);
                if (memberMapping) {
                    // Members are not shown as addons
                    acc.users += totalQuantity;
                } else {
                    acc.addons.push({
                        name: plan.Name as ADDON_NAMES,
                        quantity: totalQuantity,
                    });
                }
            }
            return acc;
        },
        { planName: null, planTitle: '', users: 0, addons: [] }
    );

    const amount = checkResult?.Amount || 0;
    const cycle = checkResult?.Cycle || 1;
    const couponDiscount = Math.abs(checkResult?.CouponDiscount || 0);

    const withDiscountPerCycle = amount - couponDiscount;
    const withoutDiscountPerMonth = Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const plan = plansMap[planName as keyof typeof plansMap];
        const price = plan?.Pricing?.[CYCLE.MONTHLY] || 0;
        return acc + price * quantity;
    }, 0);

    const withoutDiscountPerCycle = withoutDiscountPerMonth * cycle;
    const withoutDiscountPerNormalCycle = withoutDiscountPerMonth * getNormalCycleFromCustomCycle(cycle);
    const discountPerCycle = Math.min(withoutDiscountPerCycle - withDiscountPerCycle, withoutDiscountPerCycle);
    const discountPerNormalCycle = Math.min(
        withoutDiscountPerNormalCycle - withDiscountPerCycle,
        withoutDiscountPerNormalCycle
    );
    const discountPercent =
        withoutDiscountPerNormalCycle > 0
            ? Math.round(100 * (discountPerNormalCycle / withoutDiscountPerNormalCycle))
            : 0;

    return {
        ...result,
        addons: result.addons.map((addon) => {
            return {
                ...addon,
                title: getAddonTitle(addon.name, addon.quantity),
            };
        }),
        usersTitle: getUserTitle(result.users || 1), // VPN and free plan has no users
        users: result.users || 1,
        withDiscountPerCycle,
        withDiscountPerMonth: withDiscountPerCycle / cycle,
        discountPerCycle,
        discountPercent,
    };
};

export type Included =
    | {
          type: 'text';
          text: string;
      }
    | {
          type: 'value';
          text: string;
          value: string | number;
      };
export const getWhatsIncluded = ({
    planIDs,
    plansMap,
    vpnServers,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    vpnServers: VPNServers;
}): Included[] => {
    const vpn = planIDs[PLANS.VPN];
    if (vpn !== undefined && vpn > 0) {
        return [
            {
                type: 'text',
                text: getVpnServers(vpnServers[PLANS.VPN]),
            },
            {
                type: 'text',
                text: c('specialoffer: Deal details').t`Highest VPN speed`,
            },
            {
                type: 'text',
                text: c('specialoffer: Deal details').t`Secure streaming`,
            },
            {
                type: 'text',
                text: getVpnConnections(10),
            },
        ];
    }
    const summary = Object.entries(planIDs).reduce(
        (acc, [planNameValue, quantity]) => {
            const planName = planNameValue as keyof PlansMap;
            const plan = plansMap[planName];
            if (!plan || !quantity || quantity <= 0) {
                return acc;
            }
            acc.addresses += plan.MaxAddresses * quantity;
            acc.domains += plan.MaxDomains * quantity;
            acc.space += plan.MaxSpace * quantity;
            acc.vpn += plan.MaxVPN * quantity;
            return acc;
        },
        { space: 0, addresses: 0, domains: 0, vpn: 0 }
    );
    return [
        {
            type: 'value',
            text: c('Info').t`Total storage`,
            value: humanSize(summary.space || FREE_PLAN.MaxSpace, undefined, undefined, 0),
        },
        { type: 'value', text: c('Info').t`Total email addresses`, value: summary.addresses || FREE_PLAN.MaxAddresses },
        { type: 'value', text: c('Info').t`Total supported domains`, value: summary.domains || FREE_PLAN.MaxDomains },
        { type: 'value', text: c('Info').t`Total VPN connections`, value: summary.vpn || FREE_PLAN.MaxVPN },
    ];
};

export const getOptimisticCheckResult = ({
    planIDs,
    plansMap,
    cycle,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
}): RequiredCheckResponse => {
    const { amount } = Object.entries(planIDs).reduce(
        (acc, [planName, quantity]) => {
            const plan = plansMap?.[planName as keyof typeof plansMap];
            const price = plan?.Pricing?.[cycle];
            if (!plan || !price) {
                return acc;
            }
            acc.amount += quantity * price;
            return acc;
        },
        { amount: 0 }
    );

    return {
        Amount: amount,
        AmountDue: amount,
        CouponDiscount: 0,
        Cycle: cycle,
        Proration: 0,
        Credit: 0,
        Coupon: null,
        Gift: 0,
    };
};

export const getCheckResultFromSubscription = (subscription: Subscription | undefined): RequiredCheckResponse => {
    const Amount = subscription?.Amount || 0;
    const Discount = subscription?.Discount || 0;
    const Cycle = subscription?.Cycle || DEFAULT_CYCLE;

    // In subscription, Amount includes discount, which is different from the check call.
    // Here we add them together to be like the check call.
    const amount = Amount + Math.abs(Discount);

    return {
        Amount: amount,
        AmountDue: amount,
        Cycle,
        CouponDiscount: Discount,
        Proration: 0,
        Credit: 0,
        Coupon: null,
        Gift: 0,
    };
};

export const getIsCustomCycle = (cycle: CYCLE) => {
    return customCycles.includes(cycle);
};

export const getIsOfferBasedOnCoupon = (code: string) => {
    return [COUPON_CODES.MAIL_BLACK_FRIDAY_2022, COUPON_CODES.VPN_BLACK_FRIDAY_2022].includes(code as COUPON_CODES);
};
