import { c, msgid } from 'ttag';

import { ADDON_NAMES, CYCLE, DEFAULT_CYCLE, PLANS, PLAN_TYPES, VPN_PASS_PROMOTION_COUPONS } from '../constants';
import type {
    Currency,
    MaxKeys,
    Plan,
    PlanIDs,
    PlansMap,
    Pricing,
    Subscription,
    SubscriptionCheckResponse,
} from '../interfaces';
import { isDomainAddon, isIpAddon, isMemberAddon, isScribeAddon } from './addons';
import { getPlanFromCheckout } from './planIDs';
import {
    INCLUDED_IP_PRICING,
    customCycles,
    getMaxValue,
    getMembersFromPlanIDs,
    getPlanMaxIPs,
    getPricePerCycle,
    getPricingPerMember,
} from './subscription';

export const getDiscountText = () => {
    return c('Info')
        .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`;
};

export const getUserTitle = (users: number) => {
    return c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users);
};

const getAddonQuantity = (addon: Plan, quantity: number) => {
    let maxKey: MaxKeys | undefined;
    if (isDomainAddon(addon.Name)) {
        maxKey = 'MaxDomains';
    } else if (isMemberAddon(addon.Name)) {
        maxKey = 'MaxMembers';
    } else if (isIpAddon(addon.Name)) {
        maxKey = 'MaxIPs';
    } else if (isScribeAddon(addon.Name)) {
        maxKey = 'MaxAI';
    }

    /**
     * Workaround specifically for MaxIPs property. There is an upcoming mirgation in payments API v5
     * That will structure all these Max* properties in a different way.
     * For now, we need to handle MaxIPs separately.
     * See {@link MaxKeys} and {@link Plan}. Note that all properties from MaxKeys must be present in Plan
     * with the exception of MaxIPs.
     */
    let addonMultiplier: number;
    if (maxKey === 'MaxIPs') {
        addonMultiplier = getPlanMaxIPs(addon);
        if (addonMultiplier === 0) {
            addonMultiplier = 1;
        }
    } else {
        addonMultiplier = maxKey ? getMaxValue(addon, maxKey) : 0;
    }

    return quantity * addonMultiplier;
};

export const getAddonTitle = (addonName: ADDON_NAMES, quantity: number, planIDs: PlanIDs) => {
    if (isDomainAddon(addonName)) {
        const domains = quantity;
        return c('Addon').ngettext(
            msgid`${domains} additional custom domain`,
            `${domains} additional custom domains`,
            domains
        );
    }
    if (isMemberAddon(addonName)) {
        const users = quantity;
        return c('Addon').ngettext(msgid`${users} user`, `${users} users`, users);
    }
    if (isIpAddon(addonName)) {
        const ips = quantity;
        return c('Addon').ngettext(msgid`${ips} server`, `${ips} servers`, ips);
    }

    if (isScribeAddon(addonName)) {
        const isB2C = planIDs[PLANS.MAIL] || planIDs[PLANS.BUNDLE];
        if (isB2C) {
            return c('Info').t`Writing assistant`;
        }
        const seats = quantity;
        // translator: sentence is "1 writing assistant seat" or "2 writing assistant seats"
        return c('Addon').ngettext(msgid`${seats} writing assistant seat`, `${seats} writing assistant seats`, seats);
    }
    return '';
};

export interface AddonDescription {
    name: ADDON_NAMES;
    title: string;
    quantity: number;
    pricing: Pricing;
}

export type SubscriptionCheckoutData = ReturnType<typeof getCheckout>;

export type RequiredCheckResponse = Pick<
    SubscriptionCheckResponse,
    | 'Amount'
    | 'AmountDue'
    | 'Cycle'
    | 'CouponDiscount'
    | 'Proration'
    | 'Credit'
    | 'Coupon'
    | 'Gift'
    | 'Taxes'
    | 'TaxInclusive'
    | 'optimistic'
    | 'Currency'
>;

export const getUsersAndAddons = (planIDs: PlanIDs, plansMap: PlansMap) => {
    const plan = getPlanFromCheckout(planIDs, plansMap);
    const usersPricing = plan ? getPricingPerMember(plan) : null;

    const users = getMembersFromPlanIDs(planIDs, plansMap);
    const viewUsers = getMembersFromPlanIDs(planIDs, plansMap, false);

    const addonsMap = Object.entries(planIDs).reduce<{
        [addonName: string]: AddonDescription;
    }>((acc, [planName, quantity]) => {
        const planOrAddon = plansMap[planName as keyof typeof plansMap];
        if (planOrAddon?.Type !== PLAN_TYPES.ADDON || isMemberAddon(planOrAddon.Name)) {
            return acc;
        }

        const name = planOrAddon.Name as ADDON_NAMES;
        const title = getAddonTitle(name, quantity, planIDs);
        acc[name] = {
            name,
            title,
            quantity: getAddonQuantity(planOrAddon, quantity),
            pricing: planOrAddon.Pricing,
        };

        return acc;
    }, {});

    // VPN Business plan includes 1 IP by default. Each addons adds +1 IP.
    // So if users has business plan but doesn't have IP addons, then they still must have 1 IP for price
    // calculation purposes.
    if (plan?.Name === PLANS.VPN_BUSINESS) {
        const { IP_VPN_BUSINESS: IP } = ADDON_NAMES;
        const addon = addonsMap[IP];

        if (addon) {
            addon.quantity += 1;
        } else {
            addonsMap[IP] = {
                name: IP,
                quantity: 1,
                pricing: plansMap[IP]?.Pricing ?? INCLUDED_IP_PRICING,
                title: '',
            };
        }

        addonsMap[IP].title = getAddonTitle(IP, addonsMap[IP].quantity, planIDs);
    }

    const addons: AddonDescription[] = Object.values(addonsMap).sort((a, b) => a.name.localeCompare(b.name));

    const planName = (plan?.Name as PLANS) ?? null;
    const planTitle = plan?.Title ?? '';

    return {
        planName,
        planTitle,
        users,
        viewUsers,
        usersPricing,
        addons,
    };
};

export const getCheckout = ({
    planIDs,
    plansMap,
    checkResult,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult: RequiredCheckResponse;
}) => {
    const usersAndAddons = getUsersAndAddons(planIDs, plansMap);

    const amount = checkResult.Amount || 0;
    const cycle = checkResult.Cycle || CYCLE.MONTHLY;
    const couponDiscount = Math.abs(checkResult.CouponDiscount || 0);
    const coupon = checkResult.Coupon?.Code;
    const isVpnPassPromotion = !!planIDs[PLANS.VPN_PASS_BUNDLE] && VPN_PASS_PROMOTION_COUPONS.includes(coupon as any);

    const withDiscountPerCycle = amount - couponDiscount;

    const withoutDiscountPerMonth = Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const plan = plansMap[planName as keyof typeof plansMap];

        const defaultMonthly = isVpnPassPromotion ? 999 : (plan?.DefaultPricing?.[CYCLE.MONTHLY] ?? 0);
        const monthly = isVpnPassPromotion ? 999 : (getPricePerCycle(plan, CYCLE.MONTHLY) ?? 0);

        // Offers might affect Pricing both ways, increase and decrease.
        // So if the Pricing increases, then we don't want to use the lower DefaultPricing as basis
        // for discount calculations
        const price = Math.max(monthly, defaultMonthly);

        return acc + price * quantity;
    }, 0);

    const withoutDiscountPerCycle = withoutDiscountPerMonth * cycle;
    const withoutDiscountPerNormalCycle = withoutDiscountPerMonth * cycle;
    const discountPerCycle = Math.min(withoutDiscountPerCycle - withDiscountPerCycle, withoutDiscountPerCycle);
    const discountPerNormalCycle = Math.min(
        withoutDiscountPerNormalCycle - withDiscountPerCycle,
        withoutDiscountPerNormalCycle
    );
    const discountPercent =
        withoutDiscountPerNormalCycle > 0
            ? Math.round(100 * (discountPerNormalCycle / withoutDiscountPerNormalCycle))
            : 0;

    const addonsPerMonth = usersAndAddons.addons.reduce((acc, { quantity, pricing }) => {
        return acc + ((pricing[cycle] || 0) * quantity) / cycle;
    }, 0);

    const membersPerCycle = usersAndAddons.usersPricing?.[cycle] ?? null;
    const membersPerMonth =
        membersPerCycle !== null ? (membersPerCycle / cycle) * usersAndAddons.users : amount / cycle - addonsPerMonth;

    return {
        couponDiscount: checkResult.CouponDiscount,
        planIDs,
        planName: usersAndAddons.planName,
        planTitle: usersAndAddons.planTitle,
        addons: usersAndAddons.addons,
        usersTitle: getUserTitle(usersAndAddons.viewUsers || 1), // VPN and free plan has no users
        withoutDiscountPerMonth,
        withoutDiscountPerCycle: amount,
        withDiscountPerCycle,
        withDiscountPerMonth: withDiscountPerCycle / cycle,
        membersPerMonth,
        discountPerCycle,
        discountPercent,
        currency: checkResult.Currency,
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

export const getPremiumPasswordManagerText = () => {
    return c('bf2023: Deal details').t`Premium Password Manager`;
};

export const getOptimisticCheckResult = ({
    planIDs,
    plansMap,
    cycle,
    currency,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs | undefined;
    plansMap: PlansMap;
    currency: Currency;
}): RequiredCheckResponse => {
    const { amount } = Object.entries(planIDs || {}).reduce(
        (acc, [planName, quantity]) => {
            const plan = plansMap?.[planName as keyof typeof plansMap];
            const price = getPricePerCycle(plan, cycle);
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
        optimistic: true,
        Currency: currency,
    };
};

export const getCheckResultFromSubscription = (
    subscription: Subscription | undefined | null
): RequiredCheckResponse => {
    const Amount = subscription?.Amount || 0;
    const Discount = subscription?.Discount || 0;
    const Cycle = subscription?.Cycle || DEFAULT_CYCLE;
    const Currency = subscription?.Currency || 'USD';

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
        Currency,
    };
};

export const getIsCustomCycle = (cycle: CYCLE) => {
    return customCycles.includes(cycle);
};
