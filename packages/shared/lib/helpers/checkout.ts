import { c, msgid } from 'ttag';

import { ADDON_NAMES, CYCLE, DEFAULT_CYCLE, PLANS, PLAN_TYPES, VPN_PASS_PROMOTION_COUPONS } from '../constants';
import {
    MaxKeys,
    Plan,
    PlanIDs,
    PlansMap,
    PriceType,
    Pricing,
    Subscription,
    SubscriptionCheckResponse,
    getMaxValue,
} from '../interfaces';
import { getPlanFromCheckout, isDomainAddon, isIpAddon, isMemberAddon, isScribeAddon } from './planIDs';
import { INCLUDED_IP_PRICING, customCycles, getOverriddenPricePerCycle, getPricingPerMember } from './subscription';

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

    const multiplier = maxKey ? getMaxValue(addon, maxKey) : 0;

    return quantity * multiplier;
};

export const getAddonTitle = (addonName: ADDON_NAMES, quantity: number, planIDs: PlanIDs) => {
    if (isDomainAddon(addonName)) {
        const domains = quantity;
        return c('Addon').ngettext(msgid`${domains} custom domain`, `${domains} custom domains`, domains);
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

export interface SubscriptionCheckoutData {
    couponDiscount: number | undefined;
    planIDs: PlanIDs;
    planName: PLANS;
    planTitle: string;
    usersTitle: string;
    users: number;
    addons: AddonDescription[];
    coupon?: string;
    withDiscountPerCycle: number;
    withoutDiscountPerMonth: number;
    withDiscountPerMonth: number;
    membersPerMonth: number;
    discountPerCycle: number;
    discountPercent: number;
    addonsPerMonth: number;
    addonsPerMonthBase: number;
    addonsDiscountPerCycle: number;
    addonsPerCycleBase: number;
    addonsDiscountPercent: number;
    memberDiscountPerCycle: number;
    memberDiscountPercent: number;
}

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
>;

export const getUsersAndAddons = (planIDs: PlanIDs, plansMap: PlansMap, priceType?: PriceType) => {
    const plan = getPlanFromCheckout(planIDs, plansMap);
    let users = plan?.MaxMembers || 1;
    const usersPricing = plan ? getPricingPerMember(plan, priceType) : null;

    const memberAddonsNumber = Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const planOrAddon = plansMap[planName as keyof typeof plansMap];
        if (planOrAddon?.Type === PLAN_TYPES.ADDON && isMemberAddon(planOrAddon.Name)) {
            acc += quantity;
        }

        return acc;
    }, 0);

    users += memberAddonsNumber;

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

    const addons: AddonDescription[] = Object.values(addonsMap);

    const planName = (plan?.Name as PLANS) ?? null;
    const planTitle = plan?.Title ?? '';

    return {
        planName,
        planTitle,
        users,
        usersPricing,
        addons,
    };
};

export const getCheckout = ({
    planIDs,
    plansMap,
    checkResult,
    priceType,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult?: RequiredCheckResponse;
    priceType?: PriceType;
}): SubscriptionCheckoutData => {
    const usersAndAddons = getUsersAndAddons(planIDs, plansMap, priceType);

    const amount = checkResult?.Amount || 0;
    const cycle = checkResult?.Cycle || CYCLE.MONTHLY;
    const couponDiscount = Math.abs(checkResult?.CouponDiscount || 0);
    const coupon = checkResult?.Coupon?.Code;
    const isVpnPassPromotion = !!planIDs[PLANS.VPN_PASS_BUNDLE] && VPN_PASS_PROMOTION_COUPONS.includes(coupon as any);

    const withDiscountPerCycle = amount - couponDiscount;
    const withoutDiscountPerMonth = Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const plan = plansMap[planName as keyof typeof plansMap];

        const defaultMonthly = isVpnPassPromotion ? 999 : plan?.DefaultPricing?.[CYCLE.MONTHLY] ?? 0;
        const monthly = isVpnPassPromotion ? 999 : getOverriddenPricePerCycle(plan, CYCLE.MONTHLY, priceType) ?? 0;

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

    const addonsPerMonthBase = usersAndAddons.addons.reduce((acc, { quantity, pricing }) => {
        return acc + (pricing[CYCLE.MONTHLY] ?? 0) * quantity;
    }, 0);
    const addonsPerCycleBase = addonsPerMonthBase * cycle;
    const addonsDiscountPerCycle = addonsPerCycleBase - addonsPerMonth * cycle;
    const addonsDiscountPercent =
        addonsPerCycleBase === 0 ? 0 : Math.round(100 * (addonsDiscountPerCycle / addonsPerCycleBase));

    const membersPerCycle = usersAndAddons.usersPricing?.[cycle] ?? null;
    const membersPerMonth =
        membersPerCycle !== null ? (membersPerCycle / cycle) * usersAndAddons.users : amount / cycle - addonsPerMonth;
    const oneMemberPerCycleBase = (usersAndAddons.usersPricing?.[CYCLE.MONTHLY] ?? 0) * cycle;
    const oneMemberPerCycle = usersAndAddons.usersPricing?.[cycle] ?? 0;

    const memberDiscountPerCycle = oneMemberPerCycleBase - oneMemberPerCycle;
    const memberDiscountPercent = Math.round(100 * (memberDiscountPerCycle / oneMemberPerCycleBase));

    return {
        couponDiscount: checkResult?.CouponDiscount,
        coupon,
        planIDs,
        planName: usersAndAddons.planName,
        planTitle: usersAndAddons.planTitle,
        addons: usersAndAddons.addons,
        usersTitle: getUserTitle(usersAndAddons.users || 1), // VPN and free plan has no users
        users: usersAndAddons.users || 1,
        withoutDiscountPerMonth,
        withDiscountPerCycle,
        withDiscountPerMonth: withDiscountPerCycle / cycle,
        membersPerMonth,
        addonsPerMonth,
        addonsPerMonthBase,
        addonsPerCycleBase,
        addonsDiscountPerCycle,
        discountPerCycle,
        discountPercent,
        addonsDiscountPercent,
        memberDiscountPerCycle,
        memberDiscountPercent,
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
    priceType,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs | undefined;
    plansMap: PlansMap;
    priceType?: PriceType;
}): RequiredCheckResponse => {
    const { amount } = Object.entries(planIDs || {}).reduce(
        (acc, [planName, quantity]) => {
            const plan = plansMap?.[planName as keyof typeof plansMap];
            const price = getOverriddenPricePerCycle(plan, cycle, priceType);
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

export const getCheckResultFromSubscription = (
    subscription: Subscription | undefined | null
): RequiredCheckResponse => {
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
