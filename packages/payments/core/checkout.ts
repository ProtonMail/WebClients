import { c, msgid } from 'ttag';

import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import { addMonths } from '@proton/shared/lib/date-fns-utc';

import { ADDON_NAMES, ADDON_PREFIXES, CYCLE, DEFAULT_CYCLE, PLANS, PLAN_NAMES, PLAN_TYPES } from './constants';
import type { Currency, FeatureLimitKey, PlanIDs, Pricing } from './interface';
import {
    getAddonType,
    isDomainAddon,
    isIpAddon,
    isLumoAddon,
    isMemberAddon,
    isScribeAddon,
    supportsMemberAddon,
} from './plan/addons';
import { getAddonMultiplier, getMembersFromPlanIDs } from './plan/feature-limits';
import { getIsB2BAudienceFromPlan, getPlanFromPlanIDs, getPlanNameFromIDs } from './plan/helpers';
import type { Plan, PlansMap } from './plan/interface';
import { INCLUDED_IP_PRICING, getPrice, getPricingPerMember } from './price-helpers';
import { SubscriptionMode } from './subscription/constants';
import { customCycles, getHas2025OfferCoupon, getPlanIDs } from './subscription/helpers';
import type { Subscription, SubscriptionEstimation } from './subscription/interface';
import { isValidPlanName } from './type-guards';

interface AddonDescription {
    name: ADDON_NAMES;
    quantity: number;
    pricing: Pricing;
    title: string;
}

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

export const getAddonTitleWithQuantity = (addonName: ADDON_NAMES, quantity: number, planIDs: PlanIDs) => {
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
        return c('Addon').ngettext(msgid`${ips} dedicated VPN server`, `${ips} dedicated VPN servers`, ips);
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
        const seats = quantity;
        if (isB2C) {
            return c('Addon').ngettext(
                msgid`${seats} ${LUMO_APP_NAME} AI license`,
                `${seats} ${LUMO_APP_NAME} AI licenses`,
                seats
            );
        }

        return c('Addon').ngettext(msgid`${seats} ${LUMO_APP_NAME} seat`, `${seats} ${LUMO_APP_NAME} seats`, seats);
    }

    return '';
};

export const getAddonTitleByType = (
    addonType: ADDON_PREFIXES,
    isB2C: boolean,
    { short }: { short?: boolean } = {}
): string => {
    const scribeTitle = isB2C ? c('Addon').t`Writing assistant` : c('Addon').t`Writing assistant seats`;
    const lumoTitle = isB2C ? c('Addon').t`${LUMO_APP_NAME} AI license` : c('Addon').t`${LUMO_APP_NAME} seats`;
    const ipTitle = short ? c('Addon').t`Servers` : c('Addon').t`Dedicated VPN servers`;

    const mapping: Record<ADDON_PREFIXES, string> = {
        [ADDON_PREFIXES.SCRIBE]: scribeTitle,
        [ADDON_PREFIXES.LUMO]: lumoTitle,
        [ADDON_PREFIXES.MEMBER]: c('Addon').t`Users`,
        [ADDON_PREFIXES.DOMAIN]: c('Addon').t`Domains`,
        [ADDON_PREFIXES.IP]: ipTitle,
    };

    return mapping[addonType];
};

export const getAddonTitleWithoutQuantity = (
    addonName: ADDON_NAMES,
    planIDs: PlanIDs,
    options: { short?: boolean } = {}
) => {
    const plan = getPlanNameFromIDs(planIDs);
    const isB2C = !getIsB2BAudienceFromPlan(plan);

    const addonType = getAddonType(addonName);
    if (!addonType) {
        return '';
    }

    return getAddonTitleByType(addonType, isB2C, options);
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
        acc[name] = {
            name,
            quantity: getAddonQuantity(planOrAddon, quantity),
            pricing: planOrAddon.Pricing,
            title: getAddonTitleWithQuantity(name, quantity, planIDs),
        };

        return acc;
    }, {});

    // VPN Business plan includes 1 IP by default. Each addon adds +1 IP.
    // So if user has business plan but doesn't have IP addons, then they still must have 1 IP for price
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

        addonsMap[ADDON_NAMES.IP_VPN_BUSINESS].title = getAddonTitleWithQuantity(
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

const getUserTitle = (users: number) => {
    return c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users);
};

export const getCheckoutUi = ({
    planIDs,
    plansMap,
    checkResult,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult: SubscriptionEstimation;
}) => {
    const usersAndAddons = getUsersAndAddons(planIDs, plansMap);

    const amountOptimistic = getPrice(planIDs, checkResult.Cycle, plansMap);

    // when the backend returns custom billing subscription mode then it also returns only ther partial amount.
    // so we need to manually switch back to the full amount.
    const amount =
        checkResult.SubscriptionMode === SubscriptionMode.CustomBillings ? amountOptimistic : checkResult.Amount || 0;

    const cycle = checkResult.Cycle || CYCLE.MONTHLY;
    const couponDiscount = Math.abs(checkResult.CouponDiscount || 0);

    const withDiscountPerCycle = amount - couponDiscount;

    const withoutDiscountPerMonth = getPrice(planIDs, CYCLE.MONTHLY, plansMap);

    const withoutDiscountPerCycle = withoutDiscountPerMonth * cycle;
    const discountPerCycle = Math.min(withoutDiscountPerCycle - withDiscountPerCycle, withoutDiscountPerCycle);

    const discountPercent =
        withoutDiscountPerCycle > 0 ? Math.round(100 * (discountPerCycle / withoutDiscountPerCycle)) : 0;

    const addonsPerMonth = usersAndAddons.addons.reduce((acc, { quantity, pricing }) => {
        return acc + ((pricing[cycle] || 0) * quantity) / cycle;
    }, 0);

    const oneMemberPerCycle = usersAndAddons.usersPricing?.[cycle] ?? null;
    const membersPerMonth =
        oneMemberPerCycle !== null
            ? (oneMemberPerCycle / cycle) * usersAndAddons.users
            : amount / cycle - addonsPerMonth;

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

    const planName = usersAndAddons.planName;

    const withDiscountPerMonth = withDiscountPerCycle / cycle;

    /**
     * If the selected plan has member addons, then we want to display the full price per one member - don't take into
     * account any discount. This is because calculating the price per one member with a discount present gets messy and
     * error-prone very quickly.
     */
    const isPricePerMember = supportsMemberAddon(planIDs);
    const oneMemberPerMonth = membersPerMonth / usersAndAddons.users;
    const viewPricePerMonth = isPricePerMember ? oneMemberPerMonth : withDiscountPerMonth;
    const monthlySuffix = isPricePerMember ? c('Suffix').t`/user per month` : c('Suffix').t`/month`;

    const discountTarget: 'base-users' | undefined =
        checkResult.Coupon?.Targets && Object.keys(checkResult.Coupon.Targets).every((it) => isValidPlanName(it))
            ? 'base-users'
            : undefined;

    return {
        regularAmountPerCycleOptimistic: amountOptimistic,
        regularAmountPerCycle: amount,
        couponDiscount: checkResult.CouponDiscount,
        planIDs,
        planName,
        planTitle: usersAndAddons.planTitle,
        addons: usersAndAddons.addons,
        usersTitle: getUserTitle(usersAndAddons.viewUsers || 1), // VPN and free plan has no users
        withoutDiscountPerMonth,
        withoutDiscountPerCycle,
        withDiscountPerCycle,
        withDiscountPerMonth,
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
        amountDue: checkResult.AmountDue,
        viewPricePerMonth,
        monthlySuffix,
        checkResult,
        discountTarget,
        viewUsers: usersAndAddons.viewUsers,
        oneMemberPerMonth,
    };
};

export type PaymentsCheckoutUI = ReturnType<typeof getCheckoutUi>;

export const getCheckResultFromSubscription = (
    subscription: Subscription | undefined | null
): SubscriptionEstimation => {
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
        PeriodEnd: +addMonths(new Date(), Cycle) / 1000,
        requestData: {
            Plans: getPlanIDs(subscription),
            Currency,
            Cycle,
        },
    };
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
}): SubscriptionEstimation => {
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

export const getOptimisticCheckout = (params: Parameters<typeof getOptimisticCheckResult>[0]): PaymentsCheckoutUI => {
    const optimisticCheckResult = getOptimisticCheckResult(params);
    return getCheckoutUi({
        planIDs: params.planIDs ?? {},
        plansMap: params.plansMap,
        checkResult: optimisticCheckResult,
    });
};

export const getIsCustomCycle = (cycle: CYCLE) => {
    return customCycles.includes(cycle);
};

export const isBF2025Offer = ({
    coupon,
    planIDs,
    cycle,
}: {
    coupon: string | undefined | null;
    planIDs: PlanIDs;
    cycle: CYCLE;
}): boolean => {
    return getHas2025OfferCoupon(coupon) || (!!planIDs[PLANS.VPN2024] && cycle === CYCLE.FIFTEEN);
};
