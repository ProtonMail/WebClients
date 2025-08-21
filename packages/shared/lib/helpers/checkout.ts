import { addMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import {
    ADDON_NAMES,
    CYCLE,
    type CheckSubscriptionData,
    type Currency,
    DEFAULT_CYCLE,
    type FeatureLimitKey,
    INCLUDED_IP_PRICING,
    PLANS,
    PLAN_NAMES,
    PLAN_TYPES,
    type Plan,
    type PlanIDs,
    type PlansMap,
    type Pricing,
    type Subscription,
    type SubscriptionCheckResponse,
    SubscriptionMode,
    customCycles,
    getAddonMultiplier,
    getIsB2BAudienceFromPlan,
    getMembersFromPlanIDs,
    getPlanFromPlanIDs,
    getPlanNameFromIDs,
    getPrice,
    getPricingPerMember,
    isDomainAddon,
    isIpAddon,
    isLumoAddon,
    isMemberAddon,
    isScribeAddon,
} from '@proton/payments';

import { LUMO_APP_NAME } from '../constants';

export const getUserTitle = (users: number) => {
    return c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users);
};

const getAddonQuantity = (addon: Plan, quantity: number) => {
    let maxKey: FeatureLimitKey | undefined;
    if (isDomainAddon(addon.Name)) {
        maxKey = 'MaxDomains';
    } else if (isMemberAddon(addon.Name)) {
        maxKey = 'MaxMembers';
    } else if (isIpAddon(addon.Name)) {
        maxKey = 'MaxIPs';
    } else if (isScribeAddon(addon.Name)) {
        maxKey = 'MaxAI';
    } else if (isLumoAddon(addon.Name)) {
        maxKey = 'MaxLumo';
    }

    const addonMultiplier = maxKey ? getAddonMultiplier(maxKey, addon) : 0;

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

    const plan = getPlanNameFromIDs(planIDs);
    const isB2C = !getIsB2BAudienceFromPlan(plan);

    if (isScribeAddon(addonName)) {
        if (isB2C) {
            return c('Info').t`Writing assistant`;
        }
        const seats = quantity;
        // translator: sentence is "1 writing assistant seat" or "2 writing assistant seats"
        return c('Addon').ngettext(msgid`${seats} writing assistant seat`, `${seats} writing assistant seats`, seats);
    }

    if (isLumoAddon(addonName)) {
        if (isB2C) {
            return LUMO_APP_NAME;
        }

        const seats = quantity;
        return c('Addon').ngettext(msgid`${seats} ${LUMO_APP_NAME} seat`, `${seats} ${LUMO_APP_NAME} seats`, seats);
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
    | 'SubscriptionMode'
    | 'BaseRenewAmount'
    | 'RenewCycle'
>;

export type EnrichedCheckResponse = SubscriptionCheckResponse & {
    requestData: CheckSubscriptionData;
};

export const getUsersAndAddons = (planIDs: PlanIDs, plansMap: PlansMap) => {
    const plan = getPlanFromPlanIDs(plansMap, planIDs);
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
        const addon = addonsMap[ADDON_NAMES.IP_VPN_BUSINESS];

        if (addon) {
            addon.quantity += 1;
        } else {
            addonsMap[ADDON_NAMES.IP_VPN_BUSINESS] = {
                name: ADDON_NAMES.IP_VPN_BUSINESS,
                quantity: 1,
                pricing: plansMap[ADDON_NAMES.IP_VPN_BUSINESS]?.Pricing ?? INCLUDED_IP_PRICING,
                title: '',
            };
        }

        addonsMap[ADDON_NAMES.IP_VPN_BUSINESS].title = getAddonTitle(
            ADDON_NAMES.IP_VPN_BUSINESS,
            addonsMap[ADDON_NAMES.IP_VPN_BUSINESS].quantity,
            planIDs
        );
    }

    const addons: AddonDescription[] = Object.values(addonsMap).sort((a, b) => a.name.localeCompare(b.name));

    const planName = (plan?.Name as PLANS) ?? null;

    const planTitle = planName === PLANS.PASS_LIFETIME ? PLAN_NAMES[PLANS.PASS_LIFETIME] : (plan?.Title ?? '');

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

    const amount = (() => {
        // when the backend returns custom billing subscription mode then it also returns only ther partial amount.
        // so we need to manually switch back to the full amount.
        if (checkResult.SubscriptionMode === SubscriptionMode.CustomBillings) {
            return getPrice(planIDs, checkResult.Cycle, plansMap);
        }

        return checkResult.Amount || 0;
    })();

    const cycle = checkResult.Cycle || CYCLE.MONTHLY;
    const couponDiscount = Math.abs(checkResult.CouponDiscount || 0);

    const withDiscountPerCycle = amount - couponDiscount;

    const withoutDiscountPerMonth = getPrice(planIDs, CYCLE.MONTHLY, plansMap);

    const withoutDiscountPerCycle = withoutDiscountPerMonth * cycle;
    const withoutDiscountPerMostExpensiveCycle = withoutDiscountPerMonth * cycle;
    const discountPerCycle = Math.min(withoutDiscountPerCycle - withDiscountPerCycle, withoutDiscountPerCycle);
    const discountPerMostExpensiveCycle = Math.min(
        withoutDiscountPerMostExpensiveCycle - withDiscountPerCycle,
        withoutDiscountPerMostExpensiveCycle
    );

    const discountPercent =
        withoutDiscountPerMostExpensiveCycle > 0
            ? Math.round(100 * (discountPerMostExpensiveCycle / withoutDiscountPerMostExpensiveCycle))
            : 0;

    const addonsPerMonth = usersAndAddons.addons.reduce((acc, { quantity, pricing }) => {
        return acc + ((pricing[cycle] || 0) * quantity) / cycle;
    }, 0);

    const membersPerCycle = usersAndAddons.usersPricing?.[cycle] ?? null;
    const membersPerMonth =
        membersPerCycle !== null ? (membersPerCycle / cycle) * usersAndAddons.users : amount / cycle - addonsPerMonth;

    const couponDiscountPerMonth = couponDiscount / cycle;
    const withDiscountMembersPerMonth = membersPerMonth - couponDiscountPerMonth;
    const withDiscountOneMemberPerMonth = withDiscountMembersPerMonth / usersAndAddons.users;

    const renewCycle = checkResult.RenewCycle ?? checkResult.Cycle;
    const renewCycleOverriden = !!checkResult.RenewCycle;

    const renewPrice = (() => {
        if (checkResult.BaseRenewAmount) {
            return checkResult.BaseRenewAmount;
        }

        const couponMaxRedemptions = checkResult.Coupon?.MaximumRedemptionsPerUser ?? 0;
        if (couponMaxRedemptions >= 1) {
            return getPrice(planIDs, renewCycle, plansMap);
        }

        return getPrice(planIDs, renewCycle, plansMap);
    })();
    const renewPriceOverriden = !!checkResult.BaseRenewAmount;

    return {
        regularAmountPerCycle: amount,
        couponDiscount: checkResult.CouponDiscount,
        planIDs,
        planName: usersAndAddons.planName,
        planTitle: usersAndAddons.planTitle,
        addons: usersAndAddons.addons,
        usersTitle: getUserTitle(usersAndAddons.viewUsers || 1), // VPN and free plan has no users
        withoutDiscountPerMonth,
        withoutDiscountPerCycle,
        withDiscountPerCycle,
        withDiscountPerMonth: withDiscountPerCycle / cycle,
        membersPerMonth,
        discountPerCycle,
        discountPercent,
        currency: checkResult.Currency,
        withDiscountMembersPerMonth,
        withDiscountOneMemberPerMonth,
        cycle,
        renewCycle,
        renewPrice,
        renewCycleOverriden,
        renewPriceOverriden,
    };
};

export type PaymentsCheckout = ReturnType<typeof getCheckout>;

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
}): EnrichedCheckResponse => {
    const amount = getPrice(planIDs || {}, cycle, plansMap);

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
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        PeriodEnd: +addMonths(new Date(), cycle) / 1000,
        requestData: {
            Cycle: cycle,
            Currency: currency,
            Plans: planIDs || {},
        },
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
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
    };
};

export const getIsCustomCycle = (cycle: CYCLE) => {
    return customCycles.includes(cycle);
};
