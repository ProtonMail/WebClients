import { PLAN_SERVICES, PLAN_TYPES, ADDON_NAMES } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { c, msgid } from 'ttag';
import { isEquivalent, pick } from 'proton-shared/lib/helpers/object';
import { getLastCancelledSubscription } from 'proton-shared/lib/api/payments';
import { getUnixTime } from 'date-fns';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL, VPN } = PLAN_SERVICES;
const OCTOBER_01 = getUnixTime(new Date('2020-10-01'));

const I18N = {
    included: c('Option').t`Included`,
    address(value) {
        return c('Option').ngettext(msgid`${value} address`, `${value} addresses`, value);
    },
    space(value) {
        return c('Option').ngettext(msgid`${value} GB storage`, `${value} GB storage`, value);
    },
    domain(value) {
        return c('Option').ngettext(msgid`${value} custom domain`, `${value} custom domains`, value);
    },
    member(value) {
        return c('Option').ngettext(msgid`${value} user`, `${value} users`, value);
    },
    vpn(value) {
        return c('Option').ngettext(msgid`${value} VPN connection`, `${value} VPN connections`, value);
    },
};

/**
 * Check if a plans map contains at least b plans map
 * @param {Object} a plans map
 * @param {Object} b plans map
 * @returns {Boolean}
 */
export const containsSamePlans = (a, b) => isEquivalent(pick(a, Object.keys(b)), b);

/**
 * Convert subscription plans to PlanIDs format required by API requests
 * @param {Array} plans coming from Subscription API
 * @returns {Object}
 */
export const toPlanMap = (plans = [], key = 'ID') => {
    return plans.reduce((acc, plan) => {
        acc[plan[key]] = acc[plan[key]] || 0;
        acc[plan[key]] += 1;
        return acc;
    }, Object.create(null));
};

export const toPlanIDs = toPlanMap;
export const toPlanNames = (plans = []) => toPlanMap(plans, 'Name');

/**
 * Build plansMap from current subscription and user demand
 * @param {Object} plansMap user demand
 * Possible entries for plansMap
 * {}
 * { vpnplus: 1 }
 * { vpnbasic: 1 }
 * { plus: 1 }
 * { vpnplus: 1, plus: 1 }
 * { professional: 1 }
 * { vpnplus: 1, professional: 1 }
 * { visionary: 1 }
 * @param {Array} subscription.Plans
 * @returns {Object} plansMap
 */
export const mergePlansMap = (plansMap = {}, { Plans = [] }) => {
    // Free user subscribing
    if (!Plans.length) {
        return plansMap;
    }

    // Has an existing subscription

    // Visionary includes mail and vpn service with no addons
    if (plansMap.visionary) {
        return plansMap;
    }

    const currentPlansMap = toPlanNames(Plans);

    if (containsSamePlans(plansMap, { vpnplus: 1, plus: 1 })) {
        return {
            ...plansMap,
            [ADDON_NAMES.DOMAIN]: currentPlansMap[ADDON_NAMES.DOMAIN],
            [ADDON_NAMES.ADDRESS]: currentPlansMap[ADDON_NAMES.ADDRESS],
            [ADDON_NAMES.SPACE]: currentPlansMap[ADDON_NAMES.SPACE],
        };
    }

    if (containsSamePlans(plansMap, { vpnplus: 1, professional: 1 })) {
        return {
            ...plansMap,
            [ADDON_NAMES.DOMAIN]:
                currentPlansMap[ADDON_NAMES.DOMAIN] > 1 ? currentPlansMap[ADDON_NAMES.DOMAIN] : undefined, // pro starts with 2 custom domain
            [ADDON_NAMES.MEMBER]: currentPlansMap[ADDON_NAMES.MEMBER],
            [ADDON_NAMES.VPN]: currentPlansMap[ADDON_NAMES.VPN], // Only possible with vpnplus and professional
        };
    }

    // Only concern ProtonVPN dashboard
    if (containsSamePlans(plansMap, { vpnplus: 1 }) || containsSamePlans(plansMap, { vpnbasic: 1 })) {
        return {
            ...plansMap,
            plus: currentPlansMap.plus,
            professional: currentPlansMap.professional,
            [ADDON_NAMES.DOMAIN]: currentPlansMap[ADDON_NAMES.DOMAIN],
            [ADDON_NAMES.ADDRESS]: currentPlansMap[ADDON_NAMES.ADDRESS],
            [ADDON_NAMES.SPACE]: currentPlansMap[ADDON_NAMES.SPACE],
            [ADDON_NAMES.MEMBER]: currentPlansMap[ADDON_NAMES.MEMBER],
            [ADDON_NAMES.VPN]: currentPlansMap[ADDON_NAMES.VPN],
        };
    }

    return plansMap;
};

export const getTextOption = (type, value, index) => {
    return `${I18N[type](value)} ${index ? '' : `(${I18N.included})`}`.trim();
};

/**
 * Calculate total for a specific subscription configuration
 * @param {Object} param.plansMap
 * @param {Number} param.cycle
 * @param {Array} param.plans
 * @param {Number} param.services optional
 * @returns {Number} amount
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
 * @param {Number} oldAddon.Quantity
 * @param {Number} oldAddon.Amount
 * @param {Number} oldAddon.MaxDomains
 * @param {Number} oldAddon.MaxAddresses
 * @param {Number} oldAddon.MaxSpace
 * @param {Number} oldAddon.MaxMembers
 * @param {Number} oldAddon.MaxVPN
 * @param {Object} addon to merge with
 * @returns {Object} new addon
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
 * @param {Array} plans coming from Subscription API
 * @returns {Object} { mailPlan, vpnPlan, addressAddon, vpnAddon, domainAddon, memberAddon, spaceAddon }
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
 * Helper to find plans from Subscription.Plans or Plans
 * @param {Array} plans from Subscription.Plans or Plans
 * @param {String} params.planName examples: 'plus', 'vpnplus', 'visionary', ADDON_NAMES.ADDRESS, ADDON_NAMES.MEMBER
 * @param {String} params.id plan ID
 * @param {Number} params.type default: plan
 * @returns {Object} plan Object
 */
export const getPlan = (plans = [], { type = PLAN, name = '', id = '' }) => {
    if (!plans.length) {
        throw new Error('plans not defined');
    }

    if (!name && !id) {
        throw new Error('name or id not defined to get plan');
    }

    if (name) {
        return plans.find(({ Type, Name }) => Type === type && Name === name);
    }

    return plans.find(({ Type, ID }) => Type === type && ID === id);
};

/**
 * Alias to getPlan with Type = ADDON
 * @param {Array} plans
 * @param {Object} params
 */
export const getAddon = (plans, params) => getPlan(plans, { ...params, type: ADDON });

/**
 * Prepare params for /api/subscription/check request
 * @param {Array} param.plans
 * @param {Object} param.plansMap
 * @param {String} param.coupon
 * @param {String} param.currency
 * @param {Number} param.cycle
 * @returns {Object} parameters
 */
export const getCheckParams = ({
    plans = [],
    plansMap = {},
    coupon: CouponCode,
    currency: Currency,
    cycle: Cycle,
    ...rest
}) => {
    if (!plans.length) {
        throw new Error('plans not defined');
    }

    const PlanIDs = Object.entries(plansMap).reduce((acc, [planName, quantity]) => {
        if (quantity) {
            const { ID } = plans.find((plan) => plan.Name === planName);
            acc[ID] = quantity;
        }
        return acc;
    }, Object.create(null));

    return {
        PlanIDs,
        CouponCode,
        Currency,
        Cycle,
        ...rest,
    };
};

/**
 * Check if the current user is eligible to Black Friday discount
 * @param {Function} api useApi hook
 * @returns {Promise<Boolean>}
 */
export const checkLastCancelledSubscription = async (api) => {
    // Return the latest subscription cancellation time, return null if the user never had any subscription, 0 if the user currently has an active subscription
    const { LastSubscriptionEnd = 0 } = await api(getLastCancelledSubscription());

    if (LastSubscriptionEnd === null) {
        return true;
    }

    return LastSubscriptionEnd ? LastSubscriptionEnd < OCTOBER_01 : false;
};
