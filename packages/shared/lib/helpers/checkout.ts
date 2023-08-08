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
    MEMBER_PLAN_MAPPING,
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
import { INCLUDED_IP_PRICING_PER_MONTH, customCycles, getNormalCycleFromCustomCycle } from './subscription';

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

interface SubscriptionCheckoutData {
    planName: PLANS | null;
    planTitle: string;
    usersTitle: string;
    users: number;
    addons: AddonDescription[];
    withDiscountPerCycle: number;
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
    return Object.entries(planIDs).reduce<
        Pick<SubscriptionCheckoutData, 'planName' | 'planTitle'> & {
            users: number;
            addons: AddonDescription[];
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

                // MaxMembers is the number of users allowed in a plan. Right? Not quite.
                // There are some plans like VPN Plus that don't have access to Mail, and that's why their
                // MaxMembers is set to 0. For the purposes of price calculation, we need to set it to 1.
                // The only reason to use || 1 here is because it does handle all the corner cases (yet).
                // A proper solution would be either a full table tha maps plans and addons to number of users,
                // or a new property in a response that tells us how many users are included in a plan.
                acc.users += plan.MaxMembers || 1;

                if (plan.Name === PLANS.VPN_BUSINESS) {
                    const name = ADDON_NAMES.IP_VPN_BUSINESS;
                    const quantity = 1;
                    const title = getAddonTitle(name, quantity);

                    acc.addons.push({
                        name,
                        quantity,
                        pricing: INCLUDED_IP_PRICING_PER_MONTH,
                        title,
                    });
                }
            }
            if (plan.Type === PLAN_TYPES.ADDON) {
                const memberMapping = MEMBER_PLAN_MAPPING[plan.Name as keyof typeof MEMBER_PLAN_MAPPING];
                const totalQuantity = getAddonQuantity(plan, quantity);
                if (memberMapping) {
                    // Members are not shown as addons
                    acc.users += totalQuantity;
                } else {
                    const addonIndex = acc.addons.findIndex(({ name }) => name === plan.Name);
                    if (addonIndex > -1) {
                        const addon = acc.addons[addonIndex];
                        addon.quantity = addon.quantity + totalQuantity;
                        addon.title = getAddonTitle(addon.name, addon.quantity);
                    } else {
                        const name = plan.Name as ADDON_NAMES;
                        const quantity = totalQuantity;
                        const title = getAddonTitle(name, quantity);

                        acc.addons.push({
                            name,
                            quantity,
                            title,
                            pricing: plan.Pricing,
                        });
                    }
                }
            }
            return acc;
        },
        { planName: null, planTitle: '', users: 0, addons: [] }
    );
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

    return {
        ...usersAndAddons,
        usersTitle: getUserTitle(usersAndAddons.users || 1), // VPN and free plan has no users
        users: usersAndAddons.users || 1,
        withDiscountPerCycle,
        withDiscountPerMonth: withDiscountPerCycle / cycle,
        membersPerMonth: amount / cycle - addonsPerMonth,
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
