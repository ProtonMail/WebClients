import { PLAN_SERVICES, PLAN_TYPES, ADDON_NAMES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getUnixTime } from 'date-fns';
import { hasVpnBasic } from '@proton/shared/lib/helpers/subscription';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL, VPN } = PLAN_SERVICES;
const OCTOBER_01 = getUnixTime(new Date(Date.UTC(2021, 9, 1)));

/**
 * Calculate total for a specific subscription configuration
 * @type any
 */
export const getSubTotal = ({ plansMap, cycle, plans, services }) => {
    return Object.entries(plansMap).reduce((acc, [planName, quantity]) => {
        if (quantity) {
            const { Pricing = {} } =
                plans.find(({ Name, Services }) => {
                    if (services) {
                        return Name === planName && hasBit(Services, services);
                    }
                    return Name === planName;
                }) || {};
            const amount = Pricing[cycle] || 0;
            return acc + quantity * amount;
        }
        return acc;
    }, 0);
};

/**
 * Merge addon to addition parameters
 */
const mergeAddons = (
    { Quantity = 0, Amount = 0, MaxDomains = 0, MaxAddresses = 0, MaxSpace = 0, MaxMembers = 0, MaxVPN = 0 } = {},
    addon
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
export const formatPlans = (plans = []) => {
    return plans.reduce((acc, plan) => {
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
export const getBlackFridayEligibility = (subscription, latestSubscription) => {
    // Anyone who had a paid plan at any point in time after Oct 2021 is not eligible
    if ((latestSubscription?.LastSubscriptionEnd ?? 0) > OCTOBER_01) {
        return false;
    }

    // Eligible if you are on a vpn basic or free plan
    if (hasVpnBasic(subscription) || !subscription?.Plans?.length) {
        return true;
    }

    return false;
};
