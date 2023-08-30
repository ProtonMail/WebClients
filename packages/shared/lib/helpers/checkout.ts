import { c, msgid } from 'ttag';

import {
    get2FAAuthenticatorText,
    getDevicesText,
    getLoginsAndNotesText,
    getUnlimitedHideMyEmailAliasesText,
} from '@proton/components/containers/payments/features/pass';
import { getVpnConnections, getVpnServers } from '@proton/shared/lib/vpn/features';

import {
    ADDON_NAMES,
    BRAND_NAME,
    COUPON_CODES,
    CYCLE,
    DEFAULT_CYCLE,
    FAMILY_MAX_USERS,
    MEMBER_ADDON_PREFIX,
    PLANS,
    PLAN_TYPES,
} from '../constants';
import {
    Plan,
    PlanIDs,
    PlansMap,
    Pricing,
    Subscription,
    SubscriptionCheckResponse,
    VPNServersCountData,
    getPlanMaxIPs,
} from '../interfaces';
import { FREE_PLAN } from '../subscription/freePlans';
import humanSize from './humanSize';
import { getPlanFromCheckout } from './planIDs';
import { INCLUDED_IP_PRICING, customCycles, getNormalCycleFromCustomCycle, getPricingPerMember } from './subscription';

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
    if (addon.Name.startsWith(MEMBER_ADDON_PREFIX)) {
        return quantity * (addon.MaxMembers || 0);
    }
    if (addon.Name.startsWith('1ip')) {
        return quantity * getPlanMaxIPs(addon);
    }
    return 0;
};

export const getAddonTitle = (addonName: ADDON_NAMES, quantity: number) => {
    if (addonName.startsWith('1domain')) {
        const domains = quantity;
        return c('Addon').ngettext(msgid`${domains} custom domain`, `${domains} custom domains`, domains);
    }
    if (addonName.startsWith(MEMBER_ADDON_PREFIX)) {
        const users = quantity;
        return c('Addon').ngettext(msgid`${users} user`, `${users} users`, users);
    }
    if (addonName.startsWith('1ip')) {
        const ips = quantity;
        return c('Addon').ngettext(msgid`${ips} server`, `${ips} servers`, ips);
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
    planName: PLANS | null;
    planTitle: string;
    usersTitle: string;
    users: number;
    addons: AddonDescription[];
    withDiscountPerCycle: number;
    withoutDiscountPerMonth: number;
    withDiscountPerMonth: number;
    membersPerMonth: number;
    addonsPerMonth: number;
    discountPerCycle: number;
    discountPercent: number;
}

export type RequiredCheckResponse = Pick<
    SubscriptionCheckResponse,
    'Amount' | 'AmountDue' | 'Cycle' | 'CouponDiscount' | 'Proration' | 'Credit' | 'Coupon' | 'Gift'
>;

export const getUsersAndAddons = (planIDs: PlanIDs, plansMap: PlansMap) => {
    const plan = getPlanFromCheckout(planIDs, plansMap);
    let users = plan?.MaxMembers || 1;
    const usersPricing = plan ? getPricingPerMember(plan) : null;

    const memberAddonsNumber = Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const planOrAddon = plansMap[planName as keyof typeof plansMap];
        if (planOrAddon?.Type === PLAN_TYPES.ADDON && planOrAddon.Name.startsWith(MEMBER_ADDON_PREFIX)) {
            acc += quantity;
        }

        return acc;
    }, 0);

    users += memberAddonsNumber;

    const addonsMap = Object.entries(planIDs).reduce<{
        [addonName: string]: AddonDescription;
    }>((acc, [planName, quantity]) => {
        const planOrAddon = plansMap[planName as keyof typeof plansMap];
        if (planOrAddon?.Type !== PLAN_TYPES.ADDON || planOrAddon.Name.startsWith(MEMBER_ADDON_PREFIX)) {
            return acc;
        }

        const name = planOrAddon.Name as ADDON_NAMES;
        const title = getAddonTitle(name, quantity);
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

        addonsMap[IP].title = getAddonTitle(IP, addonsMap[IP].quantity);
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
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult?: RequiredCheckResponse;
}): SubscriptionCheckoutData => {
    const usersAndAddons = getUsersAndAddons(planIDs, plansMap);

    const amount = checkResult?.Amount || 0;
    const cycle = checkResult?.Cycle || CYCLE.MONTHLY;
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

    const addonsPerMonth = usersAndAddons.addons.reduce((acc, { quantity, pricing }) => {
        return acc + ((pricing[cycle] || 0) * quantity) / cycle;
    }, 0);

    const membersPerCycle = usersAndAddons.usersPricing?.[cycle] ?? null;

    const membersPerMonth =
        membersPerCycle !== null ? (membersPerCycle / cycle) * usersAndAddons.users : amount / cycle - addonsPerMonth;

    return {
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
    vpnServers: VPNServersCountData;
}): Included[] => {
    const vpn = planIDs[PLANS.VPN];
    if (vpn !== undefined && vpn > 0) {
        return [
            {
                type: 'text',
                text: getVpnServers(vpnServers.paid.servers),
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
    const passPremium = planIDs[PLANS.PASS_PLUS];
    if (passPremium !== undefined && passPremium > 0) {
        return [
            {
                type: 'text',
                text: getLoginsAndNotesText(),
            },
            {
                type: 'text',
                text: getDevicesText(),
            },
            {
                type: 'text',
                text: getUnlimitedHideMyEmailAliasesText(),
            },
            {
                type: 'text',
                text: get2FAAuthenticatorText(),
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

    const family = planIDs[PLANS.FAMILY];
    if (family !== undefined && family > 0) {
        const storage = humanSize(summary.space || FREE_PLAN.MaxSpace, undefined, undefined, 0);

        return [
            {
                type: 'text',
                text: c('Info').t`Up to ${FAMILY_MAX_USERS} users`,
            },
            {
                type: 'text',
                text: c('Info').t`${storage} storage`,
            },
            {
                type: 'text',
                text: c('Info').t`All ${BRAND_NAME} apps and their premium features`,
            },
        ];
    }

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

export const getIsOfferBasedOnCoupon = (code: string) => {
    return [
        COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
        COUPON_CODES.VPN_BLACK_FRIDAY_2022,
        COUPON_CODES.ANNIVERSARY23,
    ].includes(code as COUPON_CODES);
};
