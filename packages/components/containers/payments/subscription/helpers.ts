import { CYCLE, PLAN_SERVICES, PLAN_TYPES, ADDON_NAMES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getUnixTime } from 'date-fns';
import { hasVpnBasic, hasVpnPlus } from '@proton/shared/lib/helpers/subscription';
import { Cycle, LatestSubscription, Plan, Subscription } from '@proton/shared/lib/interfaces';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL, VPN } = PLAN_SERVICES;
const OCTOBER_01 = getUnixTime(new Date(Date.UTC(2021, 9, 1)));

/**
 * Calculate total for a specific subscription configuration
 */
export const getSubTotal = ({
    plansMap,
    cycle,
    plans,
    services,
}: {
    plansMap: { [key: string]: number };
    cycle: Cycle;
    plans: Plan[];
    services?: PLAN_SERVICES;
}) => {
    return Object.entries(plansMap).reduce<number>((acc, [planName, quantity]) => {
        if (!quantity) {
            return acc;
        }
        const plan = plans.find(({ Name, Services }) => {
            if (services) {
                return Name === planName && hasBit(Services, services);
            }
            return Name === planName;
        });
        const amount = plan?.Pricing?.[cycle] || 0;
        return acc + quantity * amount;
    }, 0);
};

/**
 * Merge addon to addition parameters
 */
const mergeAddons = (
    { Quantity = 0, Amount = 0, MaxDomains = 0, MaxAddresses = 0, MaxSpace = 0, MaxMembers = 0, MaxVPN = 0 } = {},
    addon: Plan
) => ({
    ...addon,
    MaxAddresses: MaxAddresses + addon.MaxAddresses,
    MaxSpace: MaxSpace + addon.MaxSpace,
    MaxMembers: MaxMembers + addon.MaxMembers,
    MaxVPN: MaxVPN + addon.MaxVPN,
    MaxDomains: MaxDomains + addon.MaxDomains,
    Quantity: Quantity + addon.Quantity,
    Amount: Amount + addon.Amount,
});

/**
 * Format plans to returns essential structure
 */
export const formatPlans = (plans: Plan[] = []) => {
    return plans.reduce<
        Partial<{
            mailPlan: Plan;
            vpnPlan: Plan;
            domainAddon: Plan;
            memberAddon: Plan;
            vpnAddon: Plan;
            addressAddon: Plan;
            spaceAddon: Plan;
        }>
    >((acc, plan) => {
        if (plan.Type === PLAN) {
            // visionary is a special case because it contains mail and vpn services
            // we consider it as a mail plan
            if (plan.Name === 'visionary') {
                acc.mailPlan = plan;
                return acc;
            }
            if (hasBit(plan.Services, MAIL)) {
                acc.mailPlan = plan;
            }
            if (hasBit(plan.Services, VPN)) {
                acc.vpnPlan = plan;
            }
            return acc;
        }

        if (plan.Type === ADDON) {
            if (plan.Name === ADDON_NAMES.DOMAIN) {
                acc.domainAddon = mergeAddons(acc.domainAddon, plan);
            }
            if (plan.Name === ADDON_NAMES.MEMBER) {
                acc.memberAddon = mergeAddons(acc.memberAddon, plan);
            }
            if (plan.Name === ADDON_NAMES.VPN) {
                acc.vpnAddon = mergeAddons(acc.vpnAddon, plan);
            }
            if (plan.Name === ADDON_NAMES.ADDRESS) {
                acc.addressAddon = mergeAddons(acc.addressAddon, plan);
            }
            if (plan.Name === ADDON_NAMES.SPACE) {
                acc.spaceAddon = mergeAddons(acc.spaceAddon, plan);
            }
            return acc;
        }

        return acc;
    }, {});
};

/**
 * Check if the current user is eligible to Black Friday discount
 */
export const getBlackFridayEligibility = (subscription: Subscription, latestSubscription?: LatestSubscription) => {
    if (subscription?.Plans?.length === 1) {
        // Eligible if you are on a vpn plus and monthly cycle
        if (hasVpnPlus(subscription) && subscription.Plans[0]?.Cycle === CYCLE.MONTHLY) {
            return true;
        }

        // Eligible if you are on a vpn basic
        if (hasVpnBasic(subscription)) {
            return true;
        }
    }

    // Anyone else who had a paid plan at any point in time after Oct 2021 is not eligible
    if ((latestSubscription?.LastSubscriptionEnd ?? 0) > OCTOBER_01) {
        return false;
    }

    // Eligible if free plan
    if (!subscription?.Plans?.length) {
        return true;
    }

    return false;
};
